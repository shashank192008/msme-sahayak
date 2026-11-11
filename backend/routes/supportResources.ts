/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore } from '../config/db.js';

const router = Router();

// GET /api/support-resources - Facilitation councils & DFO centers
router.get('/', async (req: Request, res: Response) => {
  const { entityType, search } = req.query;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      let query = 'SELECT * FROM support_resources WHERE 1=1';
      const params: any[] = [];

      if (entityType && entityType !== 'ALL') {
        query += ' AND entity_type = ?';
        params.push(entityType);
      }

      if (search) {
        query += ' AND (name LIKE ? OR city_state LIKE ? OR services_offered LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ' ORDER BY id ASC';

      const [rows] = await pool!.execute(query, params);
      return res.json({ success: true, data: rows });
    }

    let resources = [...memoryStore.supportResources];
    if (entityType && entityType !== 'ALL') {
      resources = resources.filter(r => r.entity_type === entityType);
    }
    if (search) {
      const s = String(search).toLowerCase();
      resources = resources.filter(
        r =>
          r.name.toLowerCase().includes(s) ||
          r.city_state.toLowerCase().includes(s) ||
          r.services_offered.toLowerCase().includes(s)
      );
    }

    return res.json({ success: true, data: resources });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
