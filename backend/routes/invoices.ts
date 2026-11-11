/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore, InvoiceRecord, PaymentRecord } from '../config/db.js';

const router = Router();

// Helper to compute overdue status and days
export function evaluateInvoiceStatus(invoice: {
  invoice_amount: number;
  amount_paid: number;
  due_date: string;
  payment_status: string;
}) {
  const outstanding = Math.max(0, invoice.invoice_amount - invoice.amount_paid);
  if (outstanding <= 0.01) {
    return { status: 'PAID' as const, daysOverdue: 0, outstanding: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(invoice.due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { status: 'OVERDUE' as const, daysOverdue: diffDays, outstanding };
  } else if (invoice.amount_paid > 0) {
    return { status: 'PARTIAL' as const, daysOverdue: 0, outstanding };
  } else {
    return { status: 'PENDING' as const, daysOverdue: 0, outstanding };
  }
}

// GET /api/invoices - Retrieve invoices with optional filters
router.get('/', async (req: Request, res: Response) => {
  const { status: filterStatus, businessId, search } = req.query;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      let query = `
        SELECT 
          i.*,
          b.business_name,
          b.owner_name,
          b.phone AS seller_phone,
          b.email AS seller_email,
          DATEDIFF(CURRENT_DATE, i.due_date) AS raw_days_overdue
        FROM invoices i
        JOIN businesses b ON i.business_id = b.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (businessId) {
        query += ' AND i.business_id = ?';
        params.push(parseInt(businessId as string, 10));
      }

      if (filterStatus && filterStatus !== 'ALL') {
        query += ' AND i.payment_status = ?';
        params.push(filterStatus);
      }

      if (search) {
        query += ' AND (i.invoice_number LIKE ? OR i.buyer_name LIKE ? OR b.business_name LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ' ORDER BY i.due_date ASC';

      const [rows]: any = await pool!.execute(query, params);
      const enhancedRows = rows.map((row: any) => {
        const evalRes = evaluateInvoiceStatus(row);
        return {
          ...row,
          days_overdue: row.payment_status === 'PAID' ? 0 : Math.max(0, row.raw_days_overdue || 0),
          is_past_45_days: (row.raw_days_overdue || 0) > 45 && row.payment_status !== 'PAID',
        };
      });

      return res.json({ success: true, data: enhancedRows });
    }

    // In-memory evaluation
    let list = memoryStore.invoices.map(inv => {
      const bus = memoryStore.businesses.find(b => b.id === inv.business_id);
      const evalRes = evaluateInvoiceStatus(inv);
      return {
        ...inv,
        payment_status: evalRes.status,
        days_overdue: evalRes.daysOverdue,
        outstanding_amount: evalRes.outstanding,
        business_name: bus ? bus.business_name : 'Unknown MSME',
        owner_name: bus ? bus.owner_name : '',
        seller_phone: bus ? bus.phone : '',
        seller_email: bus ? bus.email : '',
        is_past_45_days: evalRes.daysOverdue > 45,
      };
    });

    if (businessId) {
      const bid = parseInt(businessId as string, 10);
      list = list.filter(i => i.business_id === bid);
    }

    if (filterStatus && filterStatus !== 'ALL') {
      list = list.filter(i => i.payment_status === filterStatus);
    }

    if (search) {
      const s = String(search).toLowerCase();
      list = list.filter(
        i =>
          i.invoice_number.toLowerCase().includes(s) ||
          i.buyer_name.toLowerCase().includes(s) ||
          i.business_name.toLowerCase().includes(s)
      );
    }

    list.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return res.json({ success: true, data: list });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/overdue - Specifically returns delayed/overdue invoices with statutory calculations
router.get('/overdue', async (_req: Request, res: Response) => {
  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [rows]: any = await pool!.execute(`
        SELECT 
          i.*,
          b.business_name,
          b.owner_name,
          b.phone AS seller_phone,
          b.email AS seller_email,
          b.udyam_reg_number,
          DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue,
          ROUND(i.outstanding_amount * (0.195 / 365) * GREATEST(0, DATEDIFF(CURRENT_DATE, i.due_date)), 2) AS estimated_penal_interest
        FROM invoices i
        JOIN businesses b ON i.business_id = b.id
        WHERE i.payment_status != 'PAID' AND i.due_date < CURRENT_DATE
        ORDER BY days_overdue DESC
      `);

      return res.json({
        success: true,
        data: rows,
        summary: {
          total_overdue_count: rows.length,
          total_overdue_amount: rows.reduce((s: number, r: any) => s + parseFloat(r.outstanding_amount), 0),
          past_45_days_statutory_count: rows.filter((r: any) => r.days_overdue > 45).length,
        },
      });
    }

    // In-memory
    const overdueList = memoryStore.invoices
      .map(inv => {
        const bus = memoryStore.businesses.find(b => b.id === inv.business_id);
        const evalRes = evaluateInvoiceStatus(inv);
        const penalInterest = Math.round(evalRes.outstanding * (0.195 / 365) * evalRes.daysOverdue);
        return {
          ...inv,
          payment_status: evalRes.status,
          days_overdue: evalRes.daysOverdue,
          outstanding_amount: evalRes.outstanding,
          business_name: bus ? bus.business_name : 'Unknown MSME',
          owner_name: bus ? bus.owner_name : '',
          seller_phone: bus ? bus.phone : '',
          seller_email: bus ? bus.email : '',
          udyam_reg_number: bus ? bus.udyam_reg_number : null,
          estimated_penal_interest: penalInterest,
          is_past_45_days: evalRes.daysOverdue > 45,
        };
      })
      .filter(i => i.payment_status === 'OVERDUE' && i.days_overdue > 0)
      .sort((a, b) => b.days_overdue - a.days_overdue);

    const totalOverdueAmount = overdueList.reduce((sum, i) => sum + i.outstanding_amount, 0);
    const past45DaysCount = overdueList.filter(i => i.days_overdue > 45).length;

    return res.json({
      success: true,
      data: overdueList,
      summary: {
        total_overdue_count: overdueList.length,
        total_overdue_amount: totalOverdueAmount,
        past_45_days_statutory_count: past45DaysCount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/:id - Single invoice with payment receipts
router.get('/:id', async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [invRows]: any = await pool!.execute(
        `SELECT i.*, b.business_name, b.owner_name, b.phone, b.email, b.udyam_reg_number
         FROM invoices i
         JOIN businesses b ON i.business_id = b.id
         WHERE i.id = ?`,
        [invoiceId]
      );
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      const [paymentRows]: any = await pool!.execute(
        'SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC',
        [invoiceId]
      );

      return res.json({
        success: true,
        data: {
          ...invRows[0],
          payments: paymentRows,
        },
      });
    }

    const inv = memoryStore.invoices.find(i => i.id === invoiceId);
    if (!inv) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const bus = memoryStore.businesses.find(b => b.id === inv.business_id);
    const payments = memoryStore.payments.filter(p => p.invoice_id === invoiceId);
    const evalRes = evaluateInvoiceStatus(inv);

    return res.json({
      success: true,
      data: {
        ...inv,
        payment_status: evalRes.status,
        days_overdue: evalRes.daysOverdue,
        outstanding_amount: evalRes.outstanding,
        business_name: bus?.business_name,
        owner_name: bus?.owner_name,
        phone: bus?.phone,
        email: bus?.email,
        udyam_reg_number: bus?.udyam_reg_number,
        payments,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/invoices - Create a new invoice
router.post('/', async (req: Request, res: Response) => {
  const {
    invoice_number,
    business_id,
    buyer_name,
    buyer_gstin,
    invoice_amount,
    invoice_date,
    due_date,
    notes,
  } = req.body;

  // Validation
  if (!invoice_number || !business_id || !buyer_name || !invoice_amount || !invoice_date || !due_date) {
    return res.status(400).json({
      success: false,
      error: 'Invoice number, business ID, buyer name, amount, invoice date, and due date are required.',
    });
  }

  const numAmount = parseFloat(invoice_amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invoice amount must be greater than zero.' });
  }

  if (new Date(due_date) < new Date(invoice_date)) {
    return res.status(400).json({ success: false, error: 'Due date cannot be earlier than invoice date.' });
  }

  const evalInitial = evaluateInvoiceStatus({
    invoice_amount: numAmount,
    amount_paid: 0,
    due_date,
    payment_status: 'PENDING',
  });

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [result]: any = await pool!.execute(
        `INSERT INTO invoices 
          (invoice_number, business_id, buyer_name, buyer_gstin, invoice_amount, amount_paid, outstanding_amount, invoice_date, due_date, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?)`,
        [
          invoice_number,
          parseInt(business_id, 10),
          buyer_name,
          buyer_gstin || null,
          numAmount,
          numAmount,
          invoice_date,
          due_date,
          evalInitial.status,
          notes || null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully in MySQL',
        data: { id: result.insertId, invoice_number, outstanding_amount: numAmount, payment_status: evalInitial.status },
      });
    }

    // Check unique invoice number in memory
    if (memoryStore.invoices.some(i => i.invoice_number.toUpperCase() === invoice_number.trim().toUpperCase())) {
      return res.status(400).json({ success: false, error: `Invoice number '${invoice_number}' already exists.` });
    }

    const newId = memoryStore.invoices.length > 0 ? Math.max(...memoryStore.invoices.map(i => i.id)) + 1 : 1;
    const newInvoice: InvoiceRecord = {
      id: newId,
      invoice_number: invoice_number.trim().toUpperCase(),
      business_id: parseInt(business_id, 10),
      buyer_name,
      buyer_gstin: buyer_gstin || null,
      invoice_amount: numAmount,
      amount_paid: 0.0,
      outstanding_amount: numAmount,
      invoice_date,
      due_date,
      payment_status: evalInitial.status,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    memoryStore.invoices.unshift(newInvoice);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice,
    });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create invoice', details: error.message });
  }
});

// POST /api/invoices/:id/payments - Record a partial or complete payment
router.post('/:id/payments', async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id, 10);
  const { amount, payment_date, payment_mode, reference_number, notes } = req.body;

  if (isNaN(invoiceId)) {
    return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
  }

  const numPayment = parseFloat(amount);
  if (isNaN(numPayment) || numPayment <= 0) {
    return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero.' });
  }

  const payDate = payment_date || new Date().toISOString().split('T')[0];
  const mode = payment_mode || 'NEFT/RTGS';

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const connection = await pool!.getConnection();

      try {
        await connection.beginTransaction();

        const [invRows]: any = await connection.execute(
          'SELECT * FROM invoices WHERE id = ? FOR UPDATE',
          [invoiceId]
        );

        if (invRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        const invoice = invRows[0];
        const newPaid = parseFloat(invoice.amount_paid) + numPayment;
        if (newPaid > parseFloat(invoice.invoice_amount) + 0.01) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            error: `Payment amount ₹${numPayment.toLocaleString('en-IN')} exceeds current outstanding amount ₹${parseFloat(invoice.outstanding_amount).toLocaleString('en-IN')}`,
          });
        }

        const newOutstanding = Math.max(0, parseFloat(invoice.invoice_amount) - newPaid);
        const evalRes = evaluateInvoiceStatus({
          invoice_amount: parseFloat(invoice.invoice_amount),
          amount_paid: newPaid,
          due_date: invoice.due_date,
          payment_status: invoice.payment_status,
        });

        // Insert into payments
        const [payRes]: any = await connection.execute(
          `INSERT INTO payments (invoice_id, payment_date, amount, payment_mode, reference_number, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [invoiceId, payDate, numPayment, mode, reference_number || null, notes || null]
        );

        // Update invoices
        await connection.execute(
          `UPDATE invoices 
           SET amount_paid = ?, outstanding_amount = ?, payment_status = ?
           WHERE id = ?`,
          [newPaid, newOutstanding, evalRes.status, invoiceId]
        );

        await connection.commit();
        connection.release();

        return res.status(201).json({
          success: true,
          message: 'Payment recorded successfully',
          data: {
            payment_id: payRes.insertId,
            invoice_id: invoiceId,
            amount: numPayment,
            amount_paid: newPaid,
            outstanding_amount: newOutstanding,
            payment_status: evalRes.status,
          },
        });
      } catch (err: any) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    }

    // In-memory payment processing
    const invoice = memoryStore.invoices.find(i => i.id === invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const newPaid = invoice.amount_paid + numPayment;
    if (newPaid > invoice.invoice_amount + 0.01) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds outstanding balance of ₹${invoice.outstanding_amount.toLocaleString('en-IN')}`,
      });
    }

    invoice.amount_paid = newPaid;
    const evalRes = evaluateInvoiceStatus(invoice);
    invoice.outstanding_amount = evalRes.outstanding;
    invoice.payment_status = evalRes.status;

    const newPayId = memoryStore.payments.length > 0 ? Math.max(...memoryStore.payments.map(p => p.id)) + 1 : 1;
    const newPayment: PaymentRecord = {
      id: newPayId,
      invoice_id: invoiceId,
      payment_date: payDate,
      amount: numPayment,
      payment_mode: mode,
      reference_number: reference_number || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    memoryStore.payments.unshift(newPayment);

    return res.status(201).json({
      success: true,
      message: 'Payment recorded and invoice updated successfully',
      data: {
        payment: newPayment,
        invoice,
      },
    });
  } catch (error: any) {
    console.error('Payment record error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/:id/reminder - Generate follow-up reminders (Module 3)
router.get('/:id/reminder', async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id, 10);
  const tone = (req.query.tone as string) || 'formal'; // 'gentle' | 'formal' | 'statutory'

  try {
    let invoice: any = null;
    let business: any = null;

    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [rows]: any = await pool!.execute(
        `SELECT i.*, b.business_name, b.owner_name, b.phone AS seller_phone, b.email AS seller_email, b.udyam_reg_number
         FROM invoices i
         JOIN businesses b ON i.business_id = b.id
         WHERE i.id = ?`,
        [invoiceId]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Invoice not found' });
      invoice = rows[0];
      business = {
        business_name: invoice.business_name,
        owner_name: invoice.owner_name,
        phone: invoice.seller_phone,
        email: invoice.seller_email,
        udyam_reg_number: invoice.udyam_reg_number,
      };
    } else {
      invoice = memoryStore.invoices.find(i => i.id === invoiceId);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
      business = memoryStore.businesses.find(b => b.id === invoice.business_id);
    }

    const evalRes = evaluateInvoiceStatus(invoice);
    const daysOverdue = evalRes.daysOverdue;
    const outstanding = evalRes.outstanding;
    const formattedAmount = `₹${outstanding.toLocaleString('en-IN')}`;

    let subject = '';
    let messageBody = '';

    if (tone === 'gentle') {
      subject = `Gentle Reminder: Pending Payment for Invoice ${invoice.invoice_number} - ${business?.business_name}`;
      messageBody = `Dear ${invoice.buyer_name} Accounts Team,

We hope you are having a productive week.

This is a courteous reminder regarding Invoice No. ${invoice.invoice_number} dated ${invoice.invoice_date} for the outstanding balance of ${formattedAmount}, which fell due on ${invoice.due_date} (${daysOverdue > 0 ? `${daysOverdue} days ago` : 'due today'}).

We request you to kindly review the pending invoice and arrange the remittance at your earliest convenience. Please let us know once the transfer is initiated so we may update our records.

Thank you for your valued partnership.

Warm regards,
${business?.owner_name || 'Accounts Dept'}
${business?.business_name}
Contact: ${business?.phone} | ${business?.email}`;
    } else if (tone === 'statutory') {
      const penalInterest = Math.round(outstanding * (0.195 / 365) * Math.max(1, daysOverdue));
      subject = `STATUTORY DEMAND NOTICE: Overdue Payment Under MSMED Act 2006 (Invoice ${invoice.invoice_number})`;
      messageBody = `FORMAL DEMAND NOTICE UNDER SECTIONS 15 & 16 OF THE MSMED ACT, 2006

To,
The Managing Director / Head of Accounts
${invoice.buyer_name}
${invoice.buyer_gstin ? `Buyer GSTIN: ${invoice.buyer_gstin}` : ''}

Subject: Demand for overdue payment of ${formattedAmount} towards Invoice No. ${invoice.invoice_number} with statutory penal interest.

Enterprise Details:
Supplier: ${business?.business_name}
Udyam Registration No.: ${business?.udyam_reg_number || 'Registered MSME'}

Dear Sir/Madam,

Please take formal notice that Invoice No. ${invoice.invoice_number} dated ${invoice.invoice_date} for an amount of ₹${parseFloat(invoice.invoice_amount).toLocaleString('en-IN')} with an outstanding balance of ${formattedAmount} has remained UNPAID past its due date of ${invoice.due_date} (${daysOverdue} days overdue).

Under Section 15 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006, the statutory credit period cannot exceed 45 days. 

Under Section 16 of the MSMED Act, the buyer is legally liable to pay compound interest with monthly rests at three times (3x) the Bank Rate notified by the Reserve Bank of India (approx. 19.5% p.a.) on delayed payments.

Accumulated Statutory Interest (Est.): ₹${penalInterest.toLocaleString('en-IN')}

We urge you to release the principal outstanding amount of ${formattedAmount} along with accrued statutory interest within 7 (seven) days of receipt of this notice. Failure to settle the dues will compel us to file an arbitration petition before the Micro & Small Enterprises Facilitation Council (MSEFC) through the Government of India's MSME Samadhaan portal.

Yours faithfully,
Authorized Signatory,
${business?.owner_name}
${business?.business_name}
Phone: ${business?.phone} | Email: ${business?.email}`;
    } else {
      // Formal tone (default)
      subject = `Urgent Follow-up: Overdue Payment for Invoice ${invoice.invoice_number} (${daysOverdue} Days Overdue)`;
      messageBody = `Dear ${invoice.buyer_name} Finance Team,

Ref: Invoice No. ${invoice.invoice_number} | Due Date: ${invoice.due_date} | Amount: ${formattedAmount}

We write to bring to your urgent attention that the payment for Invoice No. ${invoice.invoice_number} amounting to ${formattedAmount} is now overdue by ${daysOverdue} days.

Timely cash flow is critical to maintain our raw material supply chain and operations. We request your immediate intervention to clear this outstanding balance via NEFT/RTGS before the end of this billing cycle.

Please confirm the payment schedule or share the transaction UTR number as soon as the transfer has been executed.

Sincerely,
${business?.owner_name}
${business?.business_name}
Contact: ${business?.phone} | ${business?.email}`;
    }

    return res.json({
      success: true,
      data: {
        invoice_number: invoice.invoice_number,
        buyer_name: invoice.buyer_name,
        outstanding_amount: outstanding,
        due_date: invoice.due_date,
        days_overdue: daysOverdue,
        tone,
        subject,
        message: messageBody,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', async (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      await pool!.execute('DELETE FROM invoices WHERE id = ?', [invoiceId]);
      return res.json({ success: true, message: 'Invoice and payment records deleted successfully' });
    }

    const index = memoryStore.invoices.findIndex(i => i.id === invoiceId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const removed = memoryStore.invoices.splice(index, 1)[0];
    memoryStore.payments = memoryStore.payments.filter(p => p.invoice_id !== invoiceId);

    return res.json({ success: true, message: `Invoice '${removed.invoice_number}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
