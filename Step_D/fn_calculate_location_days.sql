CREATE OR REPLACE FUNCTION calculate_location_maintenance_days(p_location_id INT)
RETURNS INT AS $$
DECLARE
    -- 1. אלמנט: Explicit Cursor (קרסור מפורש המקשר בין הנכסים לתקלות במיקום המבוקש)
    ticket_cursor CURSOR FOR 
        SELECT t.Opened_At, t.Resolved_At, t.Ticket_Status
        FROM MAINTENANCE_TICKETS t
        JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
        WHERE a.Location_Id = p_location_id;
        
    -- 2. אלמנט: Record (משתנה רשומה שיחזיק בכל פעם שורה מהקרסור)
    v_ticket_record RECORD;
    
    v_total_days INT := 0;
    v_location_exists INT;
    v_days_spent INT;
    
    -- 3. אלמנט: Exception (הגדרת חריגה מותאמת אישית למקרה שהמיקום לא קיים)
    e_location_not_found EXCEPTION;
BEGIN
    -- בדיקה מוקדמת: האם המיקום בכלל קיים בטבלת המיקומים?
    SELECT COUNT(*) INTO v_location_exists 
    FROM LOCATIONS 
    WHERE Location_ID = p_location_id;
    
    -- 4. אלמנט: הסתעפות (IF) לזריקת שגיאה אם המיקום לא נמצא
    IF v_location_exists = 0 THEN
        RAISE e_location_not_found;
    END IF;
    
    -- פתיחת הקרסור המפורש
    OPEN ticket_cursor;
    
    -- 5. אלמנט: לולאה (LOOP) ידנית שמראה שליטה מלאה במנגנון ה-Fetch
    LOOP
        -- שליפת השורה הנוכחית לתוך הרשומה
        FETCH ticket_cursor INTO v_ticket_record;
        EXIT WHEN NOT FOUND; -- תנאי יציאה מהלולאה כשנגמרים הנתונים
        
        -- 6. אלמנט: הסתעפות מורכבת (IF-ELSE)
        -- אם התקלה נסגרה (Resolved_At אינו נול), נחשב את ההפרש. 
        -- אם היא עדיין פתוחה, נחשב את הימים שעברו מאז שנפתחה ועד היום (CURRENT_DATE)
        IF v_ticket_record.Resolved_At IS NOT NULL THEN
            v_days_spent := v_ticket_record.Resolved_At - v_ticket_record.Opened_At;
        ELSE
            v_days_spent := CURRENT_DATE - v_ticket_record.Opened_At;
        END IF;
        
        -- צבירת ימי העבודה
        v_total_days := v_total_days + v_days_spent;
    END LOOP;
    
    -- סגירת הקרסור
    CLOSE ticket_cursor;
    
    -- החזרת התוצאה הסופית
    RETURN v_total_days;

EXCEPTION
    -- 7. אלמנט: Exception Handling (תפיסת החריגות וטיפול בהן)
    WHEN e_location_not_found THEN
        RAISE EXCEPTION 'שגיאה בפונקציה: המיקום עם מזהה % אינו קיים במלון.', p_location_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'התרחשה שגיאה בלתי צפויה: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;