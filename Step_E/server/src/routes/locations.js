import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/** GET /api/locations */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT Location_ID  AS id,
             Floor_Number AS floor_number,
             Area_Name    AS area_name,
             Access_Level AS access_level
      FROM LOCATIONS
      ORDER BY Location_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/locations/:id — for the Fetch-before-Update form. */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Location_ID AS id, Floor_Number AS floor_number,
              Area_Name AS area_name, Access_Level AS access_level
       FROM LOCATIONS WHERE Location_ID = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Location with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/locations */
router.post('/', async (req, res) => {
  const { floorNumber, areaName, accessLevel } = req.body;
  if (floorNumber === undefined || floorNumber === '' || !areaName || !accessLevel) {
    return res.status(400).json({ error: 'Floor number, area name and access level are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO LOCATIONS (Location_ID, Floor_Number, Area_Name, Access_Level)
       VALUES ((SELECT COALESCE(MAX(Location_ID), 0) + 1 FROM LOCATIONS), $1, $2, $3)
       RETURNING Location_ID AS id`,
      [floorNumber, areaName, accessLevel],
    );
    res.status(201).json({ id: rows[0].id, message: 'Location created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/locations/:id */
router.put('/:id', async (req, res) => {
  const { floorNumber, areaName, accessLevel } = req.body;
  if (floorNumber === undefined || floorNumber === '' || !areaName || !accessLevel) {
    return res.status(400).json({ error: 'Floor number, area name and access level are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE LOCATIONS SET Floor_Number = $1, Area_Name = $2, Access_Level = $3
       WHERE Location_ID = $4`,
      [floorNumber, areaName, accessLevel, req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Location with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Location updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/locations/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM LOCATIONS WHERE Location_ID = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Location with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Location deleted successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'This location cannot be deleted because assets are still registered to it. Move or delete those assets first.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
