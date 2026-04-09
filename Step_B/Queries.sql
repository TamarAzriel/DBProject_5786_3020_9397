-- ==========================================
-- שלב ב: שאילתות SELECT (8 שאילתות)
-- ==========================================

/* שאילתה 1 (כפולה): טכנאים שסגרו מעל 5 תקלות דחופות בשנת 2025.
הסבר יעילות: צורה א' (JOIN) עדיפה כי בסיס הנתונים מבצע אופטימיזציה לחיבור טבלאות בבת אחת.
*/
-- צורה א' (JOIN)
SELECT S.First_Name, S.Last_Name, S.Phone_Number, COUNT(T.Ticket_ID) AS Total_Closed
FROM STAFF S
JOIN MAINTENANCE_TICKETS T ON S.Staff_ID = T.Staff_ID
WHERE T.Ticket_Status = 'Closed' AND EXTRACT(YEAR FROM T.Opened_At) = 2025
GROUP BY S.Staff_ID, S.First_Name, S.Last_Name, S.Phone_Number
HAVING COUNT(T.Ticket_ID) > 5;

-- צורה ב' (Subquery)
SELECT First_Name, Last_Name, Phone_Number
FROM STAFF
WHERE Staff_ID IN (
    SELECT Staff_ID 
    FROM MAINTENANCE_TICKETS
    WHERE Ticket_Status = 'Closed' AND EXTRACT(YEAR FROM Opened_At) = 2025
    GROUP BY Staff_ID 
    HAVING COUNT(Ticket_ID) > 5
);

/* שאילתה 2 (כפולה): נכסים במיקומים ציבוריים (Public).
הסבר יעילות: צורה ב' (EXISTS) יכולה להיות מהירה יותר בטבלאות ענק כי היא עוצרת בחיפוש הראשון.
*/
-- צורה א' (JOIN)
SELECT DISTINCT A.Asset_Name, A.Manufacturer
FROM ASSETS A
JOIN LOCATIONS L ON A.Location_ID = L.Location_ID
WHERE L.Access_Level = 'Public';

-- צורה ב' (EXISTS)
SELECT Asset_Name, Manufacturer
FROM ASSETS A
WHERE EXISTS (
    SELECT 1 
    FROM LOCATIONS L 
    WHERE L.Location_ID = A.Location_Id AND L.Access_Level = 'Public'
);

/* שאילתה 3 (כפולה): ספקים של ציוד עם תקלות קריטיות פתוחות.
*/
-- צורה א' (JOIN)
SELECT DISTINCT V.Company_Name, V.Contact_Person
FROM VENDORS V
JOIN ASSETS A ON V.Vendor_ID = A.Vendor_ID
JOIN MAINTENANCE_TICKETS T ON A.Asset_ID = T.Asset_ID
WHERE T.Ticket_Status = 'Open' AND T.Urgency_Level = 'Urgent';

-- צורה ב' (Nested IN)
SELECT Company_Name, Contact_Person 
FROM VENDORS 
WHERE Vendor_ID IN (
    SELECT Vendor_ID 
    FROM ASSETS 
    WHERE Asset_ID IN (
        SELECT Asset_ID 
        FROM MAINTENANCE_TICKETS 
        WHERE Ticket_Status = 'Open' AND Urgency_Level = 'Urgent'
    )
);

/* שאילתה 4 (כפולה): תקלות שנסגרו באותו היום שנפתחו.
*/
-- צורה א' (DATEDIFF)
SELECT Issue_Description, Opened_At, Resolved_At
FROM MAINTENANCE_TICKETS
WHERE Resolved_At - Opened_At = 0;

-- צורה ב' (Comparison)
SELECT Issue_Description, Opened_At, Resolved_At
FROM MAINTENANCE_TICKETS
WHERE Opened_At = Resolved_At;
-- ==========================================
-- 4 שאילתות SELECT מורכבות נוספות (בודדות)
-- ==========================================

/* שאילתה 5: סיכום תקלות לפי חודש ושנה (פירוק תאריכים).
מציג כמה תקלות נפתחו בכל חודש, ממוין מהחדש לישן.
*/
SELECT EXTRACT(YEAR FROM Opened_At) AS Year, EXTRACT(MONTH FROM Opened_At) AS Month, COUNT(*) AS Total_Tickets
FROM MAINTENANCE_TICKETS
GROUP BY EXTRACT(YEAR FROM Opened_At), EXTRACT(MONTH FROM Opened_At)
ORDER BY Year DESC, Month DESC;

/* שאילתה 6: טכנאים שלא פתחו אף תקלה בחודש האחרון (קינון עם NOT EXISTS).
*/
SELECT First_Name, Last_Name, Expertise
FROM STAFF S
WHERE NOT EXISTS (
    SELECT 1 FROM MAINTENANCE_TICKETS T 
    WHERE T.Staff_ID = S.Staff_ID 
    AND T.Opened_At > CURRENT_DATE - INTERVAL '1 month'
);

/* שאילתה 7: רשימת נכסים שעברו בדיקות שנכשלו (Inspection Log).
שימוש ב-3 טבלאות: Assets, Staff, Inspection_Log.
*/
SELECT A.Asset_Name, A.Manufacturer, S.First_Name, S.Last_Name, COUNT(I.Log_Id) AS Failed_Inspections
FROM ASSETS A
JOIN INSPECTION_LOG I ON A.Asset_ID = I.Asset_ID
JOIN STAFF S ON I.Staff_ID = S.Staff_ID
WHERE I.Inspection_Result = 'Fail'
GROUP BY A.Asset_ID, A.Asset_Name, A.Manufacturer, S.First_Name, S.Last_Name
HAVING COUNT(I.Log_Id) > 0
ORDER BY Failed_Inspections DESC;

/* שאילתה 8: דוח תקלות דחופות כולל מיקום מפורט (קומה ואזור).
מציג רק תקלות בסטטוס 'Open' ממוין לפי קומה.
*/
SELECT T.Issue_Description, T.Urgency_Level, L.Area_Name, L.Floor_Number
FROM MAINTENANCE_TICKETS T
JOIN ASSETS A ON T.Asset_ID = A.Asset_ID
JOIN LOCATIONS L ON A.Location_ID = L.Location_ID
WHERE T.Ticket_Status = 'Open' AND T.Urgency_Level IN ('High', 'Urgent')
ORDER BY L.Floor_Number ASC;
-- ==========================================================
-- חלק 2: שאילתות UPDATE (3 שאילתות לא טריוויאליות)
-- ==========================================================

/* UPDATE 1: העלאת דחיפות לתקלות ישנות שלא טופלו.
כל תקלה שנפתחה לפני שבועיים ועדיין פתוחה הופכת ל-'Urgent'. */
UPDATE MAINTENANCE_TICKETS
SET Urgency_Level = 'Urgent'
WHERE Ticket_Status = 'Open' AND Opened_At < CURRENT_DATE - INTERVAL '14 days';

/* UPDATE 2: סימון נכסים שדורשים תיקון לפי יומן הבדיקות.
מוסיף הערה לשם הנכס אם הוא נכשל בבדיקה האחרונה. */
UPDATE ASSETS
SET Asset_Name = CONCAT(Asset_Name, ' - NEEDS REPAIR')
WHERE Asset_ID IN (
    SELECT Asset_ID FROM INSPECTION_LOG WHERE Inspection_Result = 'Fail'
);

/* UPDATE 3: עדכון תאריך סגירה אוטומטי.
מעדכן את תאריך הסגירה להיום עבור כל התקלה שהסטטוס שלה שונה ל-'Closed' אך התאריך נשאר ריק. */
UPDATE MAINTENANCE_TICKETS
SET Resolved_At = CURRENT_DATE
WHERE Ticket_Status = 'Closed' AND Resolved_At IS NULL;

-- ==========================================================
-- חלק 3: שאילתות DELETE (3 שאילתות לא טריוויאליות)
-- ==========================================================

/* DELETE 1: מחיקת יומני בדיקה ישנים מאוד (לפני 2024) שעברו בהצלחה. */
DELETE FROM INSPECTION_LOG
WHERE Inspection_Result = 'Pass' AND Inspection_Date < '2024-01-01';

/* DELETE 2: מחיקת מיקומים במלון שאין בהם אף נכס (Locations ללא Assets). */
DELETE FROM LOCATIONS
WHERE Location_ID NOT IN (SELECT DISTINCT Location_ID FROM ASSETS);

/* DELETE 3: מחיקת ספקים שלא סיפקו אף נכס למלון (Vendors ללא Assets). */
DELETE FROM VENDORS
WHERE Vendor_ID NOT IN (SELECT DISTINCT Vendor_ID FROM ASSETS WHERE Vendor_ID IS NOT NULL);