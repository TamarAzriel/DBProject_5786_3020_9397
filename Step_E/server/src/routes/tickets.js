import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/tickets
 * Professor requirement 1: JOINs return Asset_Name and the technician's
 * full name instead of raw foreign key numbers.
 */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.Ticket_ID         AS id,
             t.Issue_Description AS issue,
             a.Asset_Name        AS asset_name,
             s.First_Name || ' ' || s.Last_Name AS technician_name,
             TO_CHAR(t.Opened_At,   'YYYY-MM-DD') AS opened_at,
             TO_CHAR(t.Resolved_At, 'YYYY-MM-DD') AS resolved_at,
             t.Urgency_Level     AS urgency,
             t.Ticket_Status     AS status
      FROM MAINTENANCE_TICKETS t
      JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
      JOIN STAFF  s ON t.Staff_Id = s.Staff_ID
      ORDER BY t.Ticket_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tickets/:id
 * Raw record (with FK ids) used to populate the Fetch-before-Update form.
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Ticket_ID          AS id,
              Asset_Id           AS asset_id,
              Staff_Id           AS staff_id,
              Issue_Description  AS issue,
              TO_CHAR(Opened_At,   'YYYY-MM-DD') AS opened_at,
              TO_CHAR(Resolved_At, 'YYYY-MM-DD') AS resolved_at,
              Urgency_Level      AS urgency,
              Ticket_Status      AS status
       FROM MAINTENANCE_TICKETS WHERE Ticket_ID = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Ticket with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tickets — the next Ticket_ID is generated server-side (MAX + 1).
 * Note: the Step_D trigger trg_before_ticket_save validates dates and may
 * block urgent tickets on assets that are 'Under Review' — its message is
 * forwarded to the client.
 */
router.post('/', async (req, res) => {
  const { assetId, staffId, issue, openedAt, resolvedAt, urgency, status } = req.body;
  if (!assetId || !staffId || !issue || !openedAt || !urgency || !status) {
    return res.status(400).json({ error: 'Asset, technician, issue, opened date, urgency and status are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO MAINTENANCE_TICKETS
         (Ticket_ID, Asset_Id, Staff_Id, Issue_Description, Opened_At, Resolved_At, Urgency_Level, Ticket_Status)
       VALUES ((SELECT COALESCE(MAX(Ticket_ID), 0) + 1 FROM MAINTENANCE_TICKETS),
               $1, $2, $3, $4, $5, $6, $7)
       RETURNING Ticket_ID AS id`,
      [assetId, staffId, issue, openedAt, resolvedAt || null, urgency, status],
    );
    res.status(201).json({ id: rows[0].id, message: 'Ticket created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/tickets/:id — Step_D triggers also run here (validation + auto inspection log). */
router.put('/:id', async (req, res) => {
  const { assetId, staffId, issue, openedAt, resolvedAt, urgency, status } = req.body;
  if (!assetId || !staffId || !issue || !openedAt || !urgency || !status) {
    return res.status(400).json({ error: 'Asset, technician, issue, opened date, urgency and status are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE MAINTENANCE_TICKETS
       SET Asset_Id = $1, Staff_Id = $2, Issue_Description = $3,
           Opened_At = $4, Resolved_At = $5, Urgency_Level = $6, Ticket_Status = $7
       WHERE Ticket_ID = $8`,
      [assetId, staffId, issue, openedAt, resolvedAt || null, urgency, status, req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Ticket with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Ticket updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/tickets/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM MAINTENANCE_TICKETS WHERE Ticket_ID = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Ticket with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Ticket deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
