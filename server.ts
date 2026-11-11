/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDbStatus } from './backend/config/db.js';

import businessesRouter from './backend/routes/businesses.js';
import invoicesRouter from './backend/routes/invoices.js';
import inventoryRouter from './backend/routes/inventory.js';
import schemesRouter from './backend/routes/schemes.js';
import supportResourcesRouter from './backend/routes/supportResources.js';
import dashboardRouter from './backend/routes/dashboard.js';
import dbmsPracticeRouter from './backend/routes/dbmsPractice.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Initialize and check database connection at boot
  await initDatabase();

  // API Health and database connection status endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    res.json({
      status: 'online',
      app: 'MSME Sahayak',
      tagline: 'Empowering MSMEs. Strengthening India\'s Economy.',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      env: {
        node_env: process.env.NODE_ENV || 'development',
        port: PORT,
      },
    });
  });

  // Re-test database connection endpoint
  app.post('/api/db/reconnect', async (_req: Request, res: Response) => {
    const status = await initDatabase();
    res.json({ success: true, database: status });
  });

  // Mount REST API Routers
  app.use('/api/businesses', businessesRouter);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/schemes', schemesRouter);
  app.use('/api/support-resources', supportResourcesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/dbms', dbmsPracticeRouter);

  // Development: Vite middlewares
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MSME Sahayak Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server Error]', err);
});
