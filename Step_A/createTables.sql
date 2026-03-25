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