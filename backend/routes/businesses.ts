/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore, BusinessRecord } from '../config/db.js';

const router = Router();

// GET /api/businesses - Retrieve all registered MSMEs
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [rows] = await pool!.execute(`
        SELECT 
          b.*,
          COUNT(i.id) AS total_invoices,
          COALESCE(SUM(i.invoice_amount), 0) AS total_billed,
          COALESCE(SUM(i.amount_paid), 0) AS total_paid,
          COALESCE(SUM(i.outstanding_amount), 0) AS total_outstanding,
          COALESCE(SUM(CASE WHEN i.payment_status = 'OVERDUE' THEN i.outstanding_amount ELSE 0 END), 0) AS total_overdue
        FROM businesses b
        LEFT JOIN invoices i ON b.id = i.business_id
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `);
      return res.json({ success: true, data: rows });
    }

    // In-memory relational calculation
    const businessesWithStats = memoryStore.businesses.map(b => {
      const invoices = memoryStore.invoices.filter(i => i.business_id === b.id);
      const total_billed = invoices.reduce((sum, i) => sum + i.invoice_amount, 0);
      const total_paid = invoices.reduce((sum, i) => sum + i.amount_paid, 0);
      const total_outstanding = invoices.reduce((sum, i) => sum + i.outstanding_amount, 0);
      const total_overdue = invoices
        .filter(i => i.payment_status === 'OVERDUE')
        .reduce((sum, i) => sum + i.outstanding_amount, 0);

      return {
        ...b,
        total_invoices: invoices.length,
        total_billed,
        total_paid,
        total_outstanding,
        total_overdue,
      };
    });

    return res.json({ success: true, data: businessesWithStats });
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return res.status(500).json({ success: false, error: 'Database error fetching businesses', details: error.message });
  }
});

// GET /api/businesses/:id - Single MSME details
router.get('/:id', async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.id, 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ success: false, error: 'Invalid business ID' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [rows]: any = await pool!.execute('SELECT * FROM businesses WHERE id = ?', [businessId]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Business not found' });
      }
      return res.json({ success: true, data: rows[0] });
    }

    const business = memoryStore.businesses.find(b => b.id === businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }
    return res.json({ success: true, data: business });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/businesses - Register a new MSME
router.post('/', async (req: Request, res: Response) => {
  const {
    business_name,
    owner_name,
    email,
    phone,
    category,
    msme_type,
    udyam_reg_number,
    location,
    address,
  } = req.body;

  // Validation
  if (!business_name || !owner_name || !email || !phone || !category || !location || !address) {
    return res.status(400).json({
      success: false,
      error: 'All fields except Udyam Registration are required.',
    });
  }

  const validTypes = ['Micro', 'Small', 'Medium'];
  const type = validTypes.includes(msme_type) ? msme_type : 'Micro';

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [result]: any = await pool!.execute(
        `INSERT INTO businesses (business_name, owner_name, email, phone, category, msme_type, udyam_reg_number, location, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [business_name, owner_name, email, phone, category, type, udyam_reg_number || null, location, address]
      );
      return res.status(201).json({
        success: true,
        message: 'Enterprise registered successfully in MySQL database',
        data: { id: result.insertId, business_name, owner_name, msme_type: type },
      });
    }

    // In-memory insertion
    const newId = memoryStore.businesses.length > 0
      ? Math.max(...memoryStore.businesses.map(b => b.id)) + 1
      : 1;

    const newBusiness: BusinessRecord = {
      id: newId,
      business_name,
      owner_name,
      email,
      phone,
      category,
      msme_type: type,
      udyam_reg_number: udyam_reg_number || null,
      location,
      address,
      created_at: new Date().toISOString(),
    };

    memoryStore.businesses.unshift(newBusiness);

    return res.status(201).json({
      success: true,
      message: 'Enterprise registered successfully',
      data: newBusiness,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to register business', details: error.message });
  }
});

// PUT /api/businesses/:id - Update enterprise details
router.put('/:id', async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.id, 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ success: false, error: 'Invalid business ID' });
  }

  const {
    business_name,
    owner_name,
    email,
    phone,
    category,
    msme_type,
    udyam_reg_number,
    location,
    address,
  } = req.body;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      await pool!.execute(
        `UPDATE businesses 
         SET business_name = ?, owner_name = ?, email = ?, phone = ?, category = ?, msme_type = ?, udyam_reg_number = ?, location = ?, address = ?
         WHERE id = ?`,
        [business_name, owner_name, email, phone, category, msme_type, udyam_reg_number || null, location, address, businessId]
      );
      return res.json({ success: true, message: 'Business updated successfully' });
    }

    const index = memoryStore.businesses.findIndex(b => b.id === businessId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    memoryStore.businesses[index] = {
      ...memoryStore.businesses[index],
      business_name: business_name || memoryStore.businesses[index].business_name,
      owner_name: owner_name || memoryStore.businesses[index].owner_name,
      email: email || memoryStore.businesses[index].email,
      phone: phone || memoryStore.businesses[index].phone,
      category: category || memoryStore.businesses[index].category,
      msme_type: msme_type || memoryStore.businesses[index].msme_type,
      udyam_reg_number: udyam_reg_number !== undefined ? udyam_reg_number : memoryStore.businesses[index].udyam_reg_number,
      location: location || memoryStore.businesses[index].location,
      address: address || memoryStore.businesses[index].address,
    };

    return res.json({ success: true, message: 'Business updated successfully', data: memoryStore.businesses[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/businesses/:id - Remove enterprise (and cascading records)
router.delete('/:id', async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.id, 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ success: false, error: 'Invalid business ID' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      await pool!.execute('DELETE FROM businesses WHERE id = ?', [businessId]);
      return res.json({ success: true, message: 'Business and related records removed successfully' });
    }

    const index = memoryStore.businesses.findIndex(b => b.id === businessId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    // Cascade delete in memory
    const removed = memoryStore.businesses.splice(index, 1)[0];
    const invoiceIds = memoryStore.invoices.filter(i => i.business_id === businessId).map(i => i.id);
    memoryStore.invoices = memoryStore.invoices.filter(i => i.business_id !== businessId);
    memoryStore.payments = memoryStore.payments.filter(p => !invoiceIds.includes(p.invoice_id));
    memoryStore.inventory = memoryStore.inventory.filter(item => item.business_id !== businessId);

    return res.json({ success: true, message: `Business '${removed.business_name}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
