import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/assets
 * Professor requirement 1: JOINs return meaningful names (Area_Name,
 * Company_Name) instead of raw foreign key numbers.
 */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.Asset_Id          AS id,
             a.Asset_Name        AS name,
             a.Asset_Category    AS category,
             l.Area_Name         AS location_area,
             l.Floor_Number      AS location_floor,
             v.Company_Name      AS vendor_name,
             a.Manufacturer      AS manufacturer,
             a.Model_Number      AS model_number,
             TO_CHAR(a.Installation_Date, 'YYYY-MM-DD') AS installation_date,
             a.Status            AS status
      FROM ASSETS a
      JOIN LOCATIONS l ON a.Location_Id = l.Location_ID
      JOIN VENDORS   v ON a.Vendor_Id   = v.Vendor_Id
      ORDER BY a.Asset_Id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/assets/:id
 * Raw record (with FK ids) used to populate the Fetch-before-Update form.
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Asset_Id          AS id,
              Asset_Name        AS name,
              Asset_Category    AS category,
              Location_Id       AS location_id,
              Vendor_Id         AS vendor_id,
              Manufacturer      AS manufacturer,
              Model_Number      AS model_number,
              TO_CHAR(Installation_Date, 'YYYY-MM-DD') AS installation_date,
              Status            AS status
       FROM ASSETS WHERE Asset_Id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Asset with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/assets — the next Asset_Id is generated server-side (MAX + 1). */
router.post('/', async (req, res) => {
  const { name, category, locationId, vendorId, manufacturer, modelNumber, installationDate, status } = req.body;
  if (!name || !locationId || !vendorId) {
    return res.status(400).json({ error: 'Asset name, location and vendor are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO ASSETS (Asset_Id, Asset_Name, Asset_Category, Location_Id, Vendor_Id,
                           Manufacturer, Model_Number, Installation_Date, Status)
       VALUES ((SELECT COALESCE(MAX(Asset_Id), 0) + 1 FROM ASSETS),
               $1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'Active'))
       RETURNING Asset_Id AS id`,
      [name, category || null, locationId, vendorId, manufacturer || null,
       modelNumber || null, installationDate || null, status || null],
    );
    res.status(201).json({ id: rows[0].id, message: 'Asset created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/assets/:id */
router.put('/:id', async (req, res) => {
  const { name, category, locationId, vendorId, manufacturer, modelNumber, installationDate, status } = req.body;
  if (!name || !locationId || !vendorId) {
    return res.status(400).json({ error: 'Asset name, location and vendor are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE ASSETS
       SET Asset_Name = $1, Asset_Category = $2, Location_Id = $3, Vendor_Id = $4,
           Manufacturer = $5, Model_Number = $6, Installation_Date = $7, Status = $8
       WHERE Asset_Id = $9`,
      [name, category || null, locationId, vendorId, manufacturer || null,
       modelNumber || null, installationDate || null, status || 'Active', req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Asset with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Asset updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/assets/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM ASSETS WHERE Asset_Id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Asset with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Asset deleted successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'This asset cannot be deleted because maintenance tickets or inspection logs still reference it. Delete those records first.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
