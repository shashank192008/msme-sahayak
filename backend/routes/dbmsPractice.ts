/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore } from '../config/db.js';

const router = Router();

export interface DBMSConcept {
  id: string;
  concept_name: string;
  category: 'DDL' | 'DML' | 'DQL & Filtering' | 'Aggregations' | 'Relational JOINs' | 'Subqueries' | 'Views' | 'Transactions' | 'Indexing' | 'Set Operations';
  description: string;
  sql_query: string;
  explanation: string;
}

export const dbmsCatalog: DBMSConcept[] = [
  {
    id: 'select_where',
    concept_name: 'SELECT & WHERE Clause',
    category: 'DQL & Filtering',
    description: 'Filter high-value overdue invoices greater than ₹5 Lakhs',
    sql_query: `SELECT invoice_number, buyer_name, invoice_amount, outstanding_amount, due_date
FROM invoices
WHERE payment_status = 'OVERDUE' 
  AND outstanding_amount >= 500000.00
ORDER BY outstanding_amount DESC;`,
    explanation: 'Demonstrates projection of specific columns and horizontal filtering using the WHERE conditional predicate with comparison operators.',
  },
  {
    id: 'distinct_categories',
    concept_name: 'DISTINCT Operator',
    category: 'DQL & Filtering',
    description: 'Retrieve unique business sectors registered on the platform',
    sql_query: `SELECT DISTINCT category 
FROM businesses 
ORDER BY category ASC;`,
    explanation: 'Eliminates duplicate category values across the businesses table to give a distinct sector taxonomy list.',
  },
  {
    id: 'aggregates_all',
    concept_name: 'Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
    category: 'Aggregations',
    description: 'Calculate nationwide invoice totals, average ticket size, and extreme values',
    sql_query: `SELECT 
    COUNT(id) AS total_invoices_count,
    SUM(invoice_amount) AS total_turnover_billed,
    SUM(amount_paid) AS total_cash_recovered,
    SUM(outstanding_amount) AS total_capital_blocked,
    ROUND(AVG(invoice_amount), 2) AS average_invoice_size,
    MIN(invoice_amount) AS smallest_invoice,
    MAX(invoice_amount) AS largest_invoice
FROM invoices;`,
    explanation: 'Demonstrates SQL multi-row aggregate computations over the full invoices dataset.',
  },
  {
    id: 'group_by_status',
    concept_name: 'GROUP BY Clause',
    category: 'Aggregations',
    description: 'Group invoices by payment lifecycle status to audit blocked liquidity',
    sql_query: `SELECT 
    payment_status,
    COUNT(id) AS invoice_count,
    SUM(invoice_amount) AS total_status_amount,
    SUM(outstanding_amount) AS total_pending_amount
FROM invoices
GROUP BY payment_status;`,
    explanation: 'Partitions rows into summary buckets based on payment_status and aggregates amounts within each bucket.',
  },
  {
    id: 'group_by_having',
    concept_name: 'GROUP BY with HAVING Filter',
    category: 'Aggregations',
    description: 'Identify enterprises carrying over ₹5 Lakhs in delayed receivables',
    sql_query: `SELECT 
    b.business_name,
    b.owner_name,
    b.msme_type,
    COUNT(i.id) AS overdue_invoice_count,
    SUM(i.outstanding_amount) AS total_overdue_blocked
FROM businesses b
JOIN invoices i ON b.id = i.business_id
WHERE i.payment_status = 'OVERDUE'
GROUP BY b.id, b.business_name, b.owner_name, b.msme_type
HAVING total_overdue_blocked >= 500000.00
ORDER BY total_overdue_blocked DESC;`,
    explanation: 'HAVING applies conditional filtering on aggregated group results after GROUP BY, unlike WHERE which filters individual rows before grouping.',
  },
  {
    id: 'inner_join_payments',
    concept_name: 'INNER JOIN (3 Tables)',
    category: 'Relational JOINs',
    description: 'Relate businesses, invoices, and payment receipts across primary/foreign keys',
    sql_query: `SELECT 
    b.business_name,
    i.invoice_number,
    i.buyer_name,
    p.amount AS payment_amount,
    p.payment_date,
    p.payment_mode,
    p.reference_number
FROM businesses b
INNER JOIN invoices i ON b.id = i.business_id
INNER JOIN payments p ON i.id = p.invoice_id
ORDER BY p.payment_date DESC;`,
    explanation: 'INNER JOIN returns only matching rows where foreign keys align across businesses -> invoices -> payments.',
  },
  {
    id: 'left_join_cashflow',
    concept_name: 'LEFT OUTER JOIN',
    category: 'Relational JOINs',
    description: 'Include all MSMEs, even those with zero invoices yet',
    sql_query: `SELECT 
    b.id AS business_id,
    b.business_name,
    b.msme_type,
    COALESCE(COUNT(i.id), 0) AS total_invoices,
    COALESCE(SUM(i.invoice_amount), 0) AS total_billed,
    COALESCE(SUM(i.outstanding_amount), 0) AS total_pending
FROM businesses b
LEFT JOIN invoices i ON b.id = i.business_id
GROUP BY b.id, b.business_name, b.msme_type
ORDER BY b.id ASC;`,
    explanation: 'LEFT JOIN preserves all rows from the left table (businesses), returning NULLs for unmatched right-table attributes.',
  },
  {
    id: 'subquery_scalar',
    concept_name: 'Scalar Subquery in WHERE',
    category: 'Subqueries',
    description: 'Find invoices exceeding the nationwide average outstanding invoice size',
    sql_query: `SELECT invoice_number, buyer_name, outstanding_amount, due_date
FROM invoices
WHERE outstanding_amount > (
    SELECT AVG(outstanding_amount) 
    FROM invoices 
    WHERE outstanding_amount > 0
)
ORDER BY outstanding_amount DESC;`,
    explanation: 'The inner SELECT evaluates to a single numeric scalar value (the average), which the outer query tests against each row.',
  },
  {
    id: 'subquery_correlated',
    concept_name: 'Correlated Subquery (EXISTS)',
    category: 'Subqueries',
    description: 'Find suppliers that have buyers overdue past the 45-day statutory MSMED limit',
    sql_query: `SELECT b.id, b.business_name, b.owner_name, b.phone
FROM businesses b
WHERE EXISTS (
    SELECT 1 
    FROM invoices i 
    WHERE i.business_id = b.id 
      AND i.payment_status = 'OVERDUE'
      AND DATEDIFF(CURRENT_DATE, i.due_date) > 45
);`,
    explanation: 'A correlated subquery references columns from the outer query (b.id) and executes once per candidate row.',
  },
  {
    id: 'view_overdue_legal',
    concept_name: 'Database View & Virtual Tables',
    category: 'Views',
    description: 'Query from pre-computed view calculating MSMED Act 3x RBI penal interest',
    sql_query: `SELECT 
    invoice_id,
    invoice_number,
    business_name,
    buyer_name,
    outstanding_amount,
    days_overdue,
    estimated_penal_interest_inr
FROM view_overdue_invoices_summary
ORDER BY days_overdue DESC;`,
    explanation: 'Encapsulates complex statutory interest formulas inside a reusable database view, abstracting underlying joins and date math.',
  },
  {
    id: 'acid_transaction',
    concept_name: 'ACID Transaction (COMMIT / ROLLBACK)',
    category: 'Transactions',
    description: 'Atomic dual-write recording a payment and updating the invoice balance',
    sql_query: `START TRANSACTION;
-- 1. Insert payment ledger entry
INSERT INTO payments (invoice_id, payment_date, amount, payment_mode, reference_number)
VALUES (3, CURRENT_DATE, 200000.00, 'NEFT/RTGS', 'AXIS2026TXN0099');

-- 2. Decrement invoice outstanding balance
UPDATE invoices 
SET amount_paid = amount_paid + 200000.00,
    outstanding_amount = invoice_amount - (amount_paid + 200000.00),
    payment_status = CASE 
        WHEN (invoice_amount - (amount_paid + 200000.00)) <= 0 THEN 'PAID'
        ELSE 'PARTIAL'
    END
WHERE id = 3;
COMMIT;`,
    explanation: 'Guarantees Atomicity and Consistency. If either statement fails, the entire transaction is rolled back with zero orphaned rows.',
  },
  {
    id: 'union_all_alerts',
    concept_name: 'UNION ALL Operator',
    category: 'Set Operations',
    description: 'Combine operational threats from Overdue Invoices and Low Inventory Stock into a single master alert feed',
    sql_query: `SELECT 
    'OVERDUE_INVOICE' AS alert_type,
    CONCAT(invoice_number, ' - Buyer: ', buyer_name) AS description,
    outstanding_amount AS financial_impact
FROM invoices
WHERE payment_status = 'OVERDUE'

UNION ALL

SELECT 
    'LOW_STOCK_ALERT' AS alert_type,
    CONCAT(product_name, ' (Qty: ', available_quantity, ', Min: ', min_stock_level, ')') AS description,
    (min_stock_level - available_quantity) * unit_price AS financial_impact
FROM inventory
WHERE available_quantity < min_stock_level
ORDER BY financial_impact DESC;`,
    explanation: 'UNION ALL stacks result sets from two distinct tables having matching projection columns without deduplication overhead.',
  },
];

// GET /api/dbms/queries - List all practice queries
router.get('/queries', (_req: Request, res: Response) => {
  return res.json({ success: true, data: dbmsCatalog });
});

// POST /api/dbms/run - Execute a selected query
router.post('/run', async (req: Request, res: Response) => {
  const { conceptId } = req.body;
  const concept = dbmsCatalog.find(c => c.id === conceptId);
  if (!concept) {
    return res.status(404).json({ success: false, error: 'Concept not found' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      // For SELECT queries only to ensure safe demonstration
      if (concept.sql_query.trim().toUpperCase().startsWith('SELECT')) {
        const [rows] = await pool!.execute(concept.sql_query);
        return res.json({
          success: true,
          execution_mode: 'Active MySQL Server',
          concept,
          rows,
        });
      }
    }

    // In-memory simulation dataset for immediate demonstration
    let simulatedRows: any[] = [];
    switch (concept.id) {
      case 'select_where':
        simulatedRows = memoryStore.invoices
          .filter(i => i.payment_status === 'OVERDUE' && i.outstanding_amount >= 500000)
          .map(i => ({
            invoice_number: i.invoice_number,
            buyer_name: i.buyer_name,
            invoice_amount: i.invoice_amount,
            outstanding_amount: i.outstanding_amount,
            due_date: i.due_date,
          }));
        break;
      case 'distinct_categories':
        const distinctCats = Array.from(new Set(memoryStore.businesses.map(b => b.category))).sort();
        simulatedRows = distinctCats.map(category => ({ category }));
        break;
      case 'aggregates_all':
        const totalBilled = memoryStore.invoices.reduce((s, i) => s + i.invoice_amount, 0);
        const totalPaid = memoryStore.invoices.reduce((s, i) => s + i.amount_paid, 0);
        const totalOut = memoryStore.invoices.reduce((s, i) => s + i.outstanding_amount, 0);
        simulatedRows = [
          {
            total_invoices_count: memoryStore.invoices.length,
            total_turnover_billed: totalBilled,
            total_cash_recovered: totalPaid,
            total_capital_blocked: totalOut,
            average_invoice_size: Math.round(totalBilled / memoryStore.invoices.length),
            smallest_invoice: Math.min(...memoryStore.invoices.map(i => i.invoice_amount)),
            largest_invoice: Math.max(...memoryStore.invoices.map(i => i.invoice_amount)),
          },
        ];
        break;
      case 'group_by_status':
        const mapStatus: Record<string, { count: number; total: number; pending: number }> = {};
        memoryStore.invoices.forEach(i => {
          if (!mapStatus[i.payment_status]) mapStatus[i.payment_status] = { count: 0, total: 0, pending: 0 };
          mapStatus[i.payment_status].count++;
          mapStatus[i.payment_status].total += i.invoice_amount;
          mapStatus[i.payment_status].pending += i.outstanding_amount;
        });
        simulatedRows = Object.entries(mapStatus).map(([status, d]) => ({
          payment_status: status,
          invoice_count: d.count,
          total_status_amount: d.total,
          total_pending_amount: d.pending,
        }));
        break;
      case 'inner_join_payments':
        simulatedRows = memoryStore.payments.map(p => {
          const inv = memoryStore.invoices.find(i => i.id === p.invoice_id);
          const bus = memoryStore.businesses.find(b => b.id === inv?.business_id);
          return {
            business_name: bus?.business_name,
            invoice_number: inv?.invoice_number,
            buyer_name: inv?.buyer_name,
            payment_amount: p.amount,
            payment_date: p.payment_date,
            payment_mode: p.payment_mode,
            reference_number: p.reference_number,
          };
        });
        break;
      default:
        simulatedRows = memoryStore.invoices.slice(0, 5).map(i => ({
          invoice_number: i.invoice_number,
          buyer_name: i.buyer_name,
          outstanding_amount: i.outstanding_amount,
          payment_status: i.payment_status,
        }));
    }

    return res.json({
      success: true,
      execution_mode: status.type === 'mysql' ? 'MySQL 8.0 Engine' : 'In-Memory Relational Engine',
      concept,
      rows: simulatedRows,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
