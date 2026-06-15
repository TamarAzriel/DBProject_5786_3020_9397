import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, verifyConnection } from './db.js';
import assetsRouter from './routes/assets.js';
import ticketsRouter from './routes/tickets.js';
import lookupsRouter from './routes/lookups.js';
import locationsRouter from './routes/locations.js';
import staffRouter from './routes/staff.js';
import vendorsRouter from './routes/vendors.js';
import inspectionsRouter from './routes/inspections.js';
import advancedRouter from './routes/advanced.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/assets', assetsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/lookups', lookupsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/advanced', advancedRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

/**
 * Dashboard statistics: real-time counts from the core tables,
 * plus a few operational highlights for the summary cards.
 */
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM ASSETS)                                              AS total_assets,
        (SELECT COUNT(*) FROM MAINTENANCE_TICKETS)                                 AS total_tickets,
        (SELECT COUNT(*) FROM LOCATIONS)                                           AS total_locations,
        (SELECT COUNT(*) FROM STAFF)                                               AS total_staff,
        (SELECT COUNT(*) FROM VENDORS)                                             AS total_vendors,
        (SELECT COUNT(*) FROM INSPECTION_LOG)                                      AS total_inspections,
        (SELECT COUNT(*) FROM MAINTENANCE_TICKETS WHERE Ticket_Status = 'Open')    AS open_tickets,
        (SELECT COUNT(*) FROM MAINTENANCE_TICKETS
          WHERE Ticket_Status = 'Open' AND Urgency_Level IN ('High', 'Urgent'))    AS urgent_open_tickets
    `);

    const r = rows[0];
    res.json({
      totalAssets: Number(r.total_assets),
      totalTickets: Number(r.total_tickets),
      totalLocations: Number(r.total_locations),
      totalStaff: Number(r.total_staff),
      totalVendors: Number(r.total_vendors),
      totalInspections: Number(r.total_inspections),
      openTickets: Number(r.open_tickets),
      urgentOpenTickets: Number(r.urgent_open_tickets),
    });
  } catch (err) {
    console.error('[api] /api/dashboard/stats failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics', details: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, async () => {
  console.log(`[server] API listening on http://localhost:${PORT}`);
  try {
    await verifyConnection();
  } catch (err) {
    console.error('[db] Could not connect to PostgreSQL:', err.message);
    console.error('[db] Check that the Docker container is running and Step_E/server/.env is correct.');
  }
});
