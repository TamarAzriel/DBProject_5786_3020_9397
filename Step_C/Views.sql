-- מבט 1: מנקודת המבט של מערכת התשתיות
CREATE VIEW asset_full_details AS
SELECT 
    a.Asset_Id,
    a.Asset_Name,
    a.Asset_Category,
    a.Status,
    a.Installation_Date,
    l.Area_Name,
    l.Floor_Number,
    v.Company_Name,
    v.Contract_Expiration
FROM ASSETS a
JOIN LOCATIONS l ON a.Location_Id = l.Location_ID
JOIN VENDORS v ON a.Vendor_Id = v.Vendor_Id;

-- שאילתה 1 על מבט 1: כל הנכסים הפעילים
SELECT * FROM asset_full_details
WHERE Status = 'Active';

-- שאילתה 2 על מבט 1: נכסים שהחוזה פג בשנה הקרובה
SELECT Asset_Name, Company_Name, Contract_Expiration
FROM asset_full_details
WHERE Contract_Expiration < CURRENT_DATE + INTERVAL '1 year';


-- מבט 2: מנקודת המבט של מערכת HR
CREATE VIEW employee_full_details AS
SELECT 
    e.employeeid,
    e.firstname,
    e.lastname,
    e.email,
    e.hiredate,
    e.employmentstatus,
    d.departmentname,
    j.roletitle,
    j.basesalary
FROM employees e
JOIN departments d ON e.departmentid = d.departmentid
JOIN jobroles j ON e.roleid = j.roleid;

-- שאילתה 1 על מבט 2: כל העובדים הפעילים
SELECT * FROM employee_full_details
WHERE employmentstatus = 'Active';

-- שאילתה 2 על מבט 2: עובדים עם משכורת מעל 5000
SELECT firstname, lastname, roletitle, basesalary
FROM employee_full_details
WHERE basesalary > 5000;


-- מבט 3: מבט משולב
CREATE VIEW staff_employee_details AS
SELECT 
    s.Staff_ID,
    s.First_Name,
    s.Last_Name,
    s.Expertise,
    s.employeeid
FROM STAFF s
WHERE s.employeeid IS NOT NULL;

-- שאילתה 1 על מבט 3: כל הטכנאים עם employeeid
SELECT * FROM staff_employee_details;

-- שאילתה 2 על מבט 3: טכנאים לפי expertise
SELECT First_Name, Last_Name, Expertise, employeeid
FROM staff_employee_details
ORDER BY Expertise;