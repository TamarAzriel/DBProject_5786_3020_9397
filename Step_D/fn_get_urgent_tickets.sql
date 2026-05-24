CREATE OR REPLACE FUNCTION get_urgent_tickets_cursor(p_urgency_level VARCHAR)
RETURNS REFCURSOR AS $$
DECLARE
    -- אלמנט: הגדרת משתנה מסוג REFCURSOR (מצביע דינמי לשאילתה)
    v_ref_cursor REFCURSOR := 'urgent_tickets_cur';
BEGIN
    -- אלמנט: הסתעפות (IF) לבדיקת תקינות הקלט שמתקבל בפונקציה
    IF p_urgency_level IS NULL OR p_urgency_level = '' THEN
        RAISE EXCEPTION 'שגיאה בפונקציה: רמת הדחיפות שסופקה אינה תקינה או ריקה.';
    END IF;

    -- אלמנט: פתיחת ה-Ref Cursor עבור שאילתה מורכבת המקשרת 3 טבלאות שונות
    OPEN v_ref_cursor FOR
        SELECT t.Ticket_ID, 
               a.Asset_Name, 
               t.Issue_Description, 
               s.First_Name || ' ' || s.Last_Name AS Assigned_Technician, 
               t.Opened_At
        FROM MAINTENANCE_TICKETS t
        JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
        JOIN STAFF s ON t.Staff_Id = s.Staff_ID
        WHERE t.Ticket_Status = 'Open' 
          AND t.Urgency_Level = p_urgency_level;

    -- אלמנט: החזרת ה-Ref Cursor כפי שנדרש בהנחיות
    RETURN v_ref_cursor;
END;
$$ LANGUAGE plpgsql;