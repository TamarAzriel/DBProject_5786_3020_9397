INSERT INTO LOCATIONS (Location_ID, Floor_Number, Area_Name, Access_Level)
VALUES (1, 5, 'Main Lobby', 'Public');

-- הכנסת ספק לדוגמה
INSERT INTO VENDORS (Vendor_Id, Company_Name, Contract_Number, Contact_Person)
VALUES (101, 'Electra Air Conditioning', 'CON-2026', 'Avi Levi');

-- הכנסת נכס (מזגן) שמחובר למיקום ולספק
INSERT INTO ASSETS (Asset_Id, Asset_Name, Manufacturer, Model_Number)
VALUES (500, 'Main Chiller Unit', 'Carrier', 'XP-9000');

-- הכנסת טכנאי מהצוות
INSERT INTO STAFF (Staff_ID, First_Name, Last_Name, Phone_Number, Expertise)
VALUES (201, 'Yossi', 'Cohen', '050-1234567', 'HVAC Technician');

-- הכנסת קריאת שירות (Maintenance Ticket) עם 2 תאריכים!
INSERT INTO MAINTENANCE_TICKETS (Ticket_ID, Issue_Description, Opened_At, Resolved_At, Urgency_Level, Ticket_Status)
VALUES (1001, 'Water leak from ceiling', '2026-03-15', '2026-03-16', 'High', 'Closed');

-- הכנסת שורת יומן בדיקה
INSERT INTO INSPECTION_LOG (Log_Id, Inspection_Result, Technician_Result, Technician_Notes, Tools_Used)
VALUES (9001, 'Passed', 'System stable', 'Routine checkup completed', 'Multimeter, Pressure Gauge');