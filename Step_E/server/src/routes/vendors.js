import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/** GET /api/vendors */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT Vendor_Id       AS id,
             Company_Name    AS company_name,
             Contact_Person  AS contact_person,
             Phone_Number    AS phone_number,
             Support_Email   AS support_email,
             Contract_Number AS contract_number,
             TO_CHAR(Contract_Expiration, 'YYYY-MM-DD') AS contract_expiration
      FROM VENDORS
      ORDER BY Vendor_Id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/vendors/:id — for the Fetch-before-Update form. */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT Vendor_Id AS id, Company_Name AS company_name, Contact_Person AS contact_person,
              Phone_Number AS phone_number, Support_Email AS support_email,
              Contract_Number AS contract_number,
              TO_CHAR(Contract_Expiration, 'YYYY-MM-DD') AS contract_expiration
       FROM VENDORS WHERE Vendor_Id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Vendor with ID ${req.params.id} was not found.` });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/vendors */
router.post('/', async (req, res) => {
  const { companyName, contactPerson, phoneNumber, supportEmail, contractNumber, contractExpiration } = req.body;
  if (!companyName || !contactPerson || !contractNumber) {
    return res.status(400).json({ error: 'Company name, contact person and contract number are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO VENDORS (Vendor_Id, Company_Name, Contact_Person, Phone_Number,
                            Support_Email, Contract_Number, Contract_Expiration)
       VALUES ((SELECT COALESCE(MAX(Vendor_Id), 0) + 1 FROM VENDORS), $1, $2, $3, $4, $5, $6)
       RETURNING Vendor_Id AS id`,
      [companyName, contactPerson, phoneNumber || null, supportEmail || null,
       contractNumber, contractExpiration || null],
    );
    res.status(201).json({ id: rows[0].id, message: 'Vendor created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/vendors/:id */
router.put('/:id', async (req, res) => {
  const { companyName, contactPerson, phoneNumber, supportEmail, contractNumber, contractExpiration } = req.body;
  if (!companyName || !contactPerson || !contractNumber) {
    return res.status(400).json({ error: 'Company name, contact person and contract number are required.' });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE VENDORS
       SET Company_Name = $1, Contact_Person = $2, Phone_Number = $3,
           Support_Email = $4, Contract_Number = $5, Contract_Expiration = $6
       WHERE Vendor_Id = $7`,
      [companyName, contactPerson, phoneNumber || null, supportEmail || null,
       contractNumber, contractExpiration || null, req.params.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: `Vendor with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Vendor updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/vendors/:id */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM VENDORS WHERE Vendor_Id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Vendor with ID ${req.params.id} was not found.` });
    }
    res.json({ message: 'Vendor deleted successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'This vendor cannot be deleted because assets are still supplied by it. Reassign or delete those assets first.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
