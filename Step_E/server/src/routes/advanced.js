import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * SECTION 1 — Step B report queries
 */

/**
 * GET /api/advanced/reports/top-technicians
 * Step B query 1: technicians who closed more than 5 tickets in 2025,
 * ranked by the number of closed tickets.
 */
router.get('/reports/top-technicians', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT S.First_Name  AS first_name,
             S.Last_Name   AS last_name,
             S.Phone_Number AS phone_number,
             S.Expertise   AS expertise,
             COUNT(T.Ticket_ID) AS total_closed
      FROM STAFF S
      JOIN MAINTENANCE_TICKETS T ON S.Staff_ID = T.Staff_ID
      WHERE T.Ticket_Status = 'Closed' AND EXTRACT(YEAR FROM T.Opened_At) = 2025
      GROUP BY S.Staff_ID, S.First_Name, S.Last_Name, S.Phone_Number, S.Expertise
      HAVING COUNT(T.Ticket_ID) > 5
      ORDER BY total_closed DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/advanced/reports/vendor-issues
 * Step B query 3: vendors whose equipment currently has open urgent
 * tickets, enriched with the number of affected tickets.
 */
router.get('/reports/vendor-issues', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT V.Company_Name   AS company_name,
             V.Contact_Person AS contact_person,
             V.Phone_Number   AS phone_number,
             COUNT(T.Ticket_ID) AS urgent_open_tickets
      FROM VENDORS V
      JOIN ASSETS A ON V.Vendor_ID = A.Vendor_ID
      JOIN MAINTENANCE_TICKETS T ON A.Asset_ID = T.Asset_ID
      WHERE T.Ticket_Status = 'Open' AND T.Urgency_Level = 'Urgent'
      GROUP BY V.Vendor_ID, V.Company_Name, V.Contact_Person, V.Phone_Number
      ORDER BY urgent_open_tickets DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * SECTION 2 — Step D procedures
 *
 * The PL/pgSQL procedures communicate via RAISE NOTICE. A dedicated client
 * is checked out so its 'notice' events can be captured and returned to
 * the UI, and RAISE EXCEPTION errors are forwarded as readable messages.
 */
async function callProcedure(res, sql, params = []) {
  const client = await pool.connect();
  const notices = [];
  const onNotice = (msg) => notices.push(msg.message);
  client.on('notice', onNotice);

  const startedAt = Date.now();
  try {
    await client.query(sql, params);
    // The procedures emit a final summary notice; surface it prominently.
    const summary = notices.length > 0 ? notices[notices.length - 1] : 'Procedure completed successfully.';
    res.json({
      success: true,
      summary,
      noticeCount: notices.length,
      notices: notices.slice(0, 15),
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.removeListener('notice', onNotice);
    client.release();
  }
}

/**
 * POST /api/advanced/actions/reassign-tickets
 * CALL reassign_overdue_tickets() — reassigns open tickets older than 3
 * days to a technician whose expertise matches the asset category and
 * raises their urgency to 'High'.
 */
router.post('/actions/reassign-tickets', async (_req, res) => {
  await callProcedure(res, 'CALL reassign_overdue_tickets()');
});

/**
 * POST /api/advanced/actions/process-vendors
 * CALL process_vendor_failures($1) — penalizes vendors by inspection
 * failure count (>=5: contract shortened + assets frozen, 2-4: assets
 * flagged). The seeded data stores failed inspections as 'Fail'.
 */
router.post('/actions/process-vendors', async (req, res) => {
  const status = req.body?.status || 'Fail';
  await callProcedure(res, 'CALL process_vendor_failures($1)', [status]);
});

export default router;
