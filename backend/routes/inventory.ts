/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore, InventoryRecord } from '../config/db.js';

const router = Router();

// GET /api/inventory - Retrieve inventory items with low-stock alerts and valuations
router.get('/', async (req: Request, res: Response) => {
  const { businessId, lowStockOnly, search } = req.query;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      let query = `
        SELECT 
          inv.*,
          b.business_name,
          (inv.available_quantity * inv.unit_price) AS item_valuation,
          (inv.available_quantity < inv.min_stock_level) AS is_low_stock,
          GREATEST(0, inv.min_stock_level - inv.available_quantity) AS units_to_reorder
        FROM inventory inv
        JOIN businesses b ON inv.business_id = b.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (businessId) {
        query += ' AND inv.business_id = ?';
        params.push(parseInt(businessId as string, 10));
      }

      if (lowStockOnly === 'true') {
        query += ' AND inv.available_quantity < inv.min_stock_level';
      }

      if (search) {
        query += ' AND (inv.product_name LIKE ? OR inv.supplier_name LIKE ? OR inv.product_category LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ' ORDER BY is_low_stock DESC, inv.product_name ASC';

      const [rows]: any = await pool!.execute(query, params);
      const totalValuation = rows.reduce((sum: number, r: any) => sum + parseFloat(r.item_valuation || 0), 0);
      const lowStockCount = rows.filter((r: any) => r.is_low_stock).length;

      return res.json({
        success: true,
        data: rows,
        summary: {
          total_items: rows.length,
          total_valuation: totalValuation,
          low_stock_count: lowStockCount,
        },
      });
    }

    // In-memory
    let items = memoryStore.inventory.map(item => {
      const bus = memoryStore.businesses.find(b => b.id === item.business_id);
      const isLowStock = item.available_quantity < item.min_stock_level;
      const itemValuation = item.available_quantity * item.unit_price;
      const unitsToReorder = Math.max(0, item.min_stock_level - item.available_quantity);

      return {
        ...item,
        business_name: bus ? bus.business_name : 'General Inventory',
        item_valuation: itemValuation,
        is_low_stock: isLowStock,
        units_to_reorder: unitsToReorder,
      };
    });

    if (businessId) {
      const bid = parseInt(businessId as string, 10);
      items = items.filter(i => i.business_id === bid);
    }

    if (lowStockOnly === 'true') {
      items = items.filter(i => i.is_low_stock);
    }

    if (search) {
      const s = String(search).toLowerCase();
      items = items.filter(
        i =>
          i.product_name.toLowerCase().includes(s) ||
          i.supplier_name.toLowerCase().includes(s) ||
          i.product_category.toLowerCase().includes(s)
      );
    }

    items.sort((a, b) => (b.is_low_stock ? 1 : 0) - (a.is_low_stock ? 1 : 0));

    const totalValuation = items.reduce((sum, i) => sum + i.item_valuation, 0);
    const lowStockCount = items.filter(i => i.is_low_stock).length;

    return res.json({
      success: true,
      data: items,
      summary: {
        total_items: items.length,
        total_valuation: totalValuation,
        low_stock_count: lowStockCount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/inventory - Add new product/material
router.post('/', async (req: Request, res: Response) => {
  const {
    business_id,
    product_name,
    product_category,
    available_quantity,
    min_stock_level,
    unit_price,
    unit_of_measure,
    supplier_name,
  } = req.body;

  if (!business_id || !product_name || !product_category || !supplier_name) {
    return res.status(400).json({ success: false, error: 'Product name, category, business, and supplier are required.' });
  }

  const qty = parseInt(available_quantity || '0', 10);
  const minStock = parseInt(min_stock_level || '10', 10);
  const price = parseFloat(unit_price || '0.00');

  if (qty < 0 || minStock < 0 || price < 0) {
    return res.status(400).json({ success: false, error: 'Quantities and price must be non-negative values.' });
  }

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      const [result]: any = await pool!.execute(
        `INSERT INTO inventory 
          (business_id, product_name, product_category, available_quantity, min_stock_level, unit_price, unit_of_measure, supplier_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(business_id, 10),
          product_name,
          product_category,
          qty,
          minStock,
          price,
          unit_of_measure || 'Units',
          supplier_name,
        ]
      );
      return res.status(201).json({
        success: true,
        message: 'Product added to inventory successfully',
        data: { id: result.insertId, product_name, available_quantity: qty },
      });
    }

    const newId = memoryStore.inventory.length > 0 ? Math.max(...memoryStore.inventory.map(i => i.id)) + 1 : 1;
    const newItem: InventoryRecord = {
      id: newId,
      business_id: parseInt(business_id, 10),
      product_name,
      product_category,
      available_quantity: qty,
      min_stock_level: minStock,
      unit_price: price,
      unit_of_measure: unit_of_measure || 'Units',
      supplier_name,
      created_at: new Date().toISOString(),
    };

    memoryStore.inventory.unshift(newItem);

    return res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully',
      data: newItem,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/inventory/:id - Update product
router.put('/:id', async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) return res.status(400).json({ success: false, error: 'Invalid item ID' });

  const {
    product_name,
    product_category,
    available_quantity,
    min_stock_level,
    unit_price,
    unit_of_measure,
    supplier_name,
  } = req.body;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      await pool!.execute(
        `UPDATE inventory 
         SET product_name = ?, product_category = ?, available_quantity = ?, min_stock_level = ?, unit_price = ?, unit_of_measure = ?, supplier_name = ?
         WHERE id = ?`,
        [
          product_name,
          product_category,
          parseInt(available_quantity, 10),
          parseInt(min_stock_level, 10),
          parseFloat(unit_price),
          unit_of_measure,
          supplier_name,
          itemId,
        ]
      );
      return res.json({ success: true, message: 'Inventory updated successfully' });
    }

    const index = memoryStore.inventory.findIndex(i => i.id === itemId);
    if (index === -1) return res.status(404).json({ success: false, error: 'Item not found' });

    memoryStore.inventory[index] = {
      ...memoryStore.inventory[index],
      product_name: product_name || memoryStore.inventory[index].product_name,
      product_category: product_category || memoryStore.inventory[index].product_category,
      available_quantity: available_quantity !== undefined ? parseInt(available_quantity, 10) : memoryStore.inventory[index].available_quantity,
      min_stock_level: min_stock_level !== undefined ? parseInt(min_stock_level, 10) : memoryStore.inventory[index].min_stock_level,
      unit_price: unit_price !== undefined ? parseFloat(unit_price) : memoryStore.inventory[index].unit_price,
      unit_of_measure: unit_of_measure || memoryStore.inventory[index].unit_of_measure,
      supplier_name: supplier_name || memoryStore.inventory[index].supplier_name,
    };

    return res.json({ success: true, message: 'Inventory updated successfully', data: memoryStore.inventory[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/inventory/:id - Delete item
router.delete('/:id', async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) return res.status(400).json({ success: false, error: 'Invalid item ID' });

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      await pool!.execute('DELETE FROM inventory WHERE id = ?', [itemId]);
      return res.json({ success: true, message: 'Item deleted successfully' });
    }

    const index = memoryStore.inventory.findIndex(i => i.id === itemId);
    if (index === -1) return res.status(404).json({ success: false, error: 'Item not found' });

    const removed = memoryStore.inventory.splice(index, 1)[0];
    return res.json({ success: true, message: `Item '${removed.product_name}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
