import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/inspections
 * Professor requirement 1: JOINs return Asset_Name and the inspector's
 * full name instead of raw foreign key numbers.
 */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.Log_Id            AS id,
             a.Asset_Name        AS asset_name,
             s.First_Name || ' ' || s.Last_Name AS inspector_name,
             TO_CHAR(i.Inspection_Date, 'YYYY-MM-DD') AS inspection_date,
             i.Inspection_Result AS inspection_result,
             i.Technician_Result AS technician_result,
             i.Technician_Notes  AS technician_notes,
             i.Tools_Used        AS tools_used
      FROM INSPECTION_LOG i
      JOIN ASSETS a ON i.Asset_Id = a.Asset_Id
      JOIN STAFF  s ON i.Staff_Id = s.Staff_ID
      ORDER BY i.Log_Id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/inspections/:id — raw record (with FK ids) for the Fetch-before-Update form. */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Log_Id            AS id,
              Asset_Id          AS asset_id,
              Staff_Id          AS staff_id,
              TO_CHAR(Inspection_Date, 'YYYY-MM-DD') AS inspection_date,
              Inspection_Result AS inspection_result,
              Technician_Result AS technician_result,
              Technician_Notes  AS technician_notes,
              Tools_Used        AS tools_used
       FROM INSPECTION_LOG WHERE Log_Id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Inspection log with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/inspections */
router.post('/', async (req, res) => {
  const { assetId, staffId, inspectionDate, inspectionResult, technicianResult, technicianNotes, toolsUsed } = req.body;
  if (!assetId || !staffId || !inspectionDate || !inspectionResult || !technicianResult || !technicianNotes || !toolsUsed) {
    return res.status(400).json({ error: 'All inspection fields are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO INSPECTION_LOG
         (Log_Id, Asset_Id, Staff_Id, Inspection_Date, Inspection_Result,
          Technician_Result, Technician_Notes, Tools_Used)
       VALUES ((SELECT COALESCE(MAX(Log_Id), 0) + 1 FROM INSPECTION_LOG),
               $1, $2, $3, $4, $5, $6, $7)
       RETURNING Log_Id AS id`,
      [assetId, staffId, inspectionDate, inspectionResult, technicianResult, technicianNotes, toolsUsed],
    );
    res.status(201).json({ id: rows[0].id, message: 'Inspection log created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/inspections/:id */
router.put('/:id', async (req, res) => {
  const { assetId, staffId, inspectionDate, inspectionResult, technicianResult, technicianNotes, toolsUsed } = req.body;
  if (!assetId || !staffId || !inspectionDate || !inspectionResult || !technicianResult || !technicianNotes || !toolsUsed) {
    return res.status(400).json({ error: 'All inspection fields are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE INSPECTION_LOG
       SET Asset_Id = $1, Staff_Id = $2, Inspection_Date = $3, Inspection_Result = $4,
           Technician_Result = $5, Technician_Notes = $6, Tools_Used = $7
       WHERE Log_Id = $8`,
      [assetId, staffId, inspectionDate, inspectionResult, technicianResult, technicianNotes, toolsUsed, req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Inspection log with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Inspection log updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/inspections/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM INSPECTION_LOG WHERE Log_Id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Inspection log with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Inspection log deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
