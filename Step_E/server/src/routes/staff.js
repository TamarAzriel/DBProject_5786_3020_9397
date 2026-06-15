import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/** GET /api/staff */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT Staff_ID     AS id,
             First_Name   AS first_name,
             Last_Name    AS last_name,
             Phone_Number AS phone_number,
             Expertise    AS expertise
      FROM STAFF
      ORDER BY Staff_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/staff/:id — for the Fetch-before-Update form. */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Staff_ID AS id, First_Name AS first_name, Last_Name AS last_name,
              Phone_Number AS phone_number, Expertise AS expertise
       FROM STAFF WHERE Staff_ID = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Staff member with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/staff */
router.post('/', async (req, res) => {
  const { firstName, lastName, phoneNumber, expertise } = req.body;
  if (!firstName || !lastName || !phoneNumber || !expertise) {
    return res.status(400).json({ error: 'First name, last name, phone number and expertise are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO STAFF (Staff_ID, First_Name, Last_Name, Phone_Number, Expertise)
       VALUES ((SELECT COALESCE(MAX(Staff_ID), 0) + 1 FROM STAFF), $1, $2, $3, $4)
       RETURNING Staff_ID AS id`,
      [firstName, lastName, phoneNumber, expertise],
    );
    res.status(201).json({ id: rows[0].id, message: 'Staff member created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/staff/:id */
router.put('/:id', async (req, res) => {
  const { firstName, lastName, phoneNumber, expertise } = req.body;
  if (!firstName || !lastName || !phoneNumber || !expertise) {
    return res.status(400).json({ error: 'First name, last name, phone number and expertise are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE STAFF SET First_Name = $1, Last_Name = $2, Phone_Number = $3, Expertise = $4
       WHERE Staff_ID = $5`,
      [firstName, lastName, phoneNumber, expertise, req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Staff member with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Staff member updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/staff/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM STAFF WHERE Staff_ID = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Staff member with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Staff member deleted successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'This staff member cannot be deleted because maintenance tickets or inspection logs are still assigned to them. Reassign or delete those records first.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
