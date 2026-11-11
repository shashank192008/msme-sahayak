/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { getPool, getDbStatus, memoryStore } from '../config/db.js';

const router = Router();

// GET /api/schemes - Directory of government schemes with profile filtering
router.get('/', async (req: Request, res: Response) => {
  const { msmeType, category, search } = req.query;

  try {
    const status = getDbStatus();
    if (status.type === 'mysql') {
      const pool = getPool();
      let query = 'SELECT * FROM schemes WHERE 1=1';
      const params: any[] = [];

      if (msmeType && msmeType !== 'ALL') {
        query += ' AND eligible_msme_types LIKE ?';
        params.push(`%${msmeType}%`);
      }

      if (category && category !== 'ALL') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (name LIKE ? OR purpose LIKE ? OR eligibility_summary LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ' ORDER BY id ASC';

      const [rows] = await pool!.execute(query, params);
      return res.json({ success: true, data: rows });
    }

    // In-memory
    let schemes = [...memoryStore.schemes];

    if (msmeType && msmeType !== 'ALL') {
      const t = String(msmeType).toLowerCase();
      schemes = schemes.filter(s => s.eligible_msme_types.toLowerCase().includes(t));
    }

    if (category && category !== 'ALL') {
      schemes = schemes.filter(s => s.category === category);
    }

    if (search) {
      const s = String(search).toLowerCase();
      schemes = schemes.filter(
        item =>
          item.name.toLowerCase().includes(s) ||
          item.purpose.toLowerCase().includes(s) ||
          item.eligibility_summary.toLowerCase().includes(s)
      );
    }

    return res.json({ success: true, data: schemes });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
