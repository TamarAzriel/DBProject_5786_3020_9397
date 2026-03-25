-- 1. טבלאות בסיס (ללא מפתחות זרים)

CREATE TABLE LOCATIONS (
    Location_ID INT NOT NULL,
    Floor_Number INT NOT NULL,
    Area_Name VARCHAR(255) NOT NULL,
    Access_Level VARCHAR(255) NOT NULL,
    PRIMARY KEY (Location_ID)
);

CREATE TABLE STAFF (
    Staff_ID INT NOT NULL,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(20) NOT NULL,
    Expertise VARCHAR(100) NOT NULL,
    PRIMARY KEY (Staff_ID)
);

CREATE TABLE VENDORS (
    Vendor_Id INT NOT NULL,
    Company_Name VARCHAR(255) NOT NULL,
    Contact_Person VARCHAR(255) NOT NULL,
    Phone_Number VARCHAR(50),
    Support_Email VARCHAR(100),
    Contract_Number VARCHAR(100) NOT NULL,
    Contract_Expiration DATE,
    PRIMARY KEY (Vendor_Id)
);

-- 2. טבלת האמצע (מקושרת לבסיס)

CREATE TABLE ASSETS (
    Asset_Id INT NOT NULL,
    Asset_Name VARCHAR(255) NOT NULL,
    Asset_Category VARCHAR(100),
    Location_Id INT NOT NULL,
    Vendor_Id INT NOT NULL,          -- הוספתי קישור לספק
    Manufacturer VARCHAR(255),
    Model_Number VARCHAR(255),
    Installation_Date DATE,
    Status VARCHAR(50) DEFAULT 'Active',
    PRIMARY KEY (Asset_Id),
    FOREIGN KEY (Location_Id) REFERENCES LOCATIONS(Location_ID),
    FOREIGN KEY (Vendor_Id) REFERENCES VENDORS(Vendor_Id)
);

-- 3. טבלאות הפעילות (מקושרות לנכסים ולצוות)

CREATE TABLE MAINTENANCE_TICKETS (
    Ticket_ID INT NOT NULL,
    Asset_Id INT NOT NULL,
    Staff_Id INT NOT NULL,           -- הוספתי קישור לטכנאי
    Issue_Description VARCHAR(255) NOT NULL,
    Opened_At DATE NOT NULL,
    Resolved_At DATE,
    Urgency_Level VARCHAR(50) NOT NULL,
    Ticket_Status VARCHAR(50) NOT NULL,
    PRIMARY KEY (Ticket_ID),
    FOREIGN KEY (Asset_Id) REFERENCES ASSETS(Asset_Id),
    FOREIGN KEY (Staff_Id) REFERENCES STAFF(Staff_ID)
);

CREATE TABLE INSPECTION_LOG (
    Log_Id INT NOT NULL,
    Asset_Id INT NOT NULL,
    Staff_Id INT NOT NULL,
    Inspection_Date DATE NOT NULL,   -- הוספתי את תאריך הבדיקה
    Inspection_Result VARCHAR(100) NOT NULL,
    Technician_Result VARCHAR(100) NOT NULL,
    Technician_Notes TEXT NOT NULL,
    Tools_Used VARCHAR(100) NOT NULL,
    PRIMARY KEY (Log_Id),
    FOREIGN KEY (Asset_Id) REFERENCES ASSETS(Asset_Id),
    FOREIGN KEY (Staff_Id) REFERENCES STAFF(Staff_ID)
);



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