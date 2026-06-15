import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * GET /api/lookups
 * Reference lists for the frontend form dropdowns, so users pick
 * human-readable names instead of typing raw foreign key numbers.
 */
router.get('/', async (_req, res) => {
  try {
    const [locations, vendors, staff, assets] = await Promise.all([
      pool.query(`SELECT Location_ID AS id, Area_Name || ' · Floor ' || Floor_Number AS label
                  FROM LOCATIONS ORDER BY Floor_Number, Area_Name`),
      pool.query(`SELECT Vendor_Id AS id, Company_Name AS label FROM VENDORS ORDER BY Company_Name`),
      pool.query(`SELECT Staff_ID AS id, First_Name || ' ' || Last_Name || ' (' || Expertise || ')' AS label
                  FROM STAFF ORDER BY First_Name, Last_Name`),
      pool.query(`SELECT Asset_Id AS id, Asset_Name AS label FROM ASSETS ORDER BY Asset_Name`),
    ]);
    res.json({
      locations: locations.rows,
      vendors: vendors.rows,
      staff: staff.rows,
      assets: assets.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
