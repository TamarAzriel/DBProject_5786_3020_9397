-- ==========================================
-- שלב ב: אילוצים (Constraints) - Hotel Maintenance
-- ==========================================

-- 1. אילוץ בדיקת תאריכים: וודוא שתאריך הסיום אינו לפני תאריך הפתיחה
ALTER TABLE MAINTENANCE_TICKETS
ADD CONSTRAINT chk_ticket_dates 
CHECK (Resolved_At IS NULL OR Resolved_At >= Opened_At);

-- 2. אילוץ טווח קומות: מניעת הכנסת מספר קומה לא הגיוני (למשל מתחת למינוס 2)
ALTER TABLE LOCATIONS
ADD CONSTRAINT chk_floor_range 
CHECK (Floor_Number >= -2 AND Floor_Number <= 50);

-- 3. אילוץ ערכים מוגדרים: הגבלת הסטטוס לערכים ספציפיים בלבד
ALTER TABLE MAINTENANCE_TICKETS
ADD CONSTRAINT chk_status_values 
CHECK (Ticket_Status IN ('Open', 'In Progress', 'Closed', 'Cancelled'));

-- 4. אילוץ דחיפות: וודוא שרמת הדחיפות תקינה
ALTER TABLE MAINTENANCE_TICKETS
ADD CONSTRAINT chk_urgency_level 
CHECK (Urgency_Level IN ('Low', 'Medium', 'High', 'Urgent'));