-- 1. מיקום (כבר יש לך 500 כאלו מ-Mockaroo)
-- נניח ש-ID 1 הוא הגג
INSERT INTO LOCATIONS (Location_ID, Floor_Number, Area_Name, Access_Level) 
VALUES (10, 5, 'Roof Top', 'Staff Only');

INSERT INTO STAFF (Staff_ID, First_Name, Last_Name, Phone_Number, Expertise) 
VALUES (501, 'Yossi', 'Cohen', '050-1234567', 'HVAC Technician');

INSERT INTO VENDORS (Vendor_Id, Company_Name, Contact_Person, Phone_Number, Support_Email, Contract_Number, Contract_Expiration) 
VALUES (501, 'Electra HVAC', 'Yael Cohen', '03-555-1234', 'service@electra.co.il', 'CON-9999', '2028-12-31');

INSERT INTO ASSETS (Asset_Id, Asset_Name, Asset_Category, Location_Id, Vendor_Id, Manufacturer, Model_Number, Installation_Date, Status) 
VALUES (20001, 'Main Chiller Unit', 'HVAC', 1, 501, 'Carrier', 'XP-9000', '2023-05-15', 'Active');

INSERT INTO MAINTENANCE_TICKETS (Ticket_ID, Asset_Id, Staff_Id, Issue_Description, Opened_At, Resolved_At, Urgency_Level, Ticket_Status) 
VALUES (10, 8922, 104, 'Making noise', '2025-10-01', '2025-10-04', 'High', 'Closed');

INSERT INTO INSPECTION_LOG (Log_Id, Asset_Id, Staff_Id, Inspection_Date, Inspection_Result, Technician_Result, Technician_Notes, Tools_Used) 
VALUES (9, 14001, 342, '2026-03-20', 'Needs Repair', 'Minor Wear', 'Detected slight pressure drop during routine stress test. Re-calibration recommended.', 'Pressure Gauge');