DO $$
DECLARE
    -- משתנים לטיפול ב-Ref Cursor שיוחזר מהפונקציה
    v_urgent_tickets_cursor REFCURSOR;
    
    -- משתני רשומה זמניים לצורך שליפת הנתונים מהקרסור
    v_ticket_id INT;
    v_asset_name VARCHAR(255);
    v_description VARCHAR(255);
    v_technician_name VARCHAR(255);
    v_opened_date DATE;
    
    v_counter INT := 0;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'הפעלה חיונית: מתחיל הרצת תוכנית ראשית מספר 2';
    RAISE NOTICE '==================================================';

    -- 1. זימון פרוצדורה מספר 2: עיבוד נתוני בדיקות פגומות וקניסת ספקים בהתאם
    RAISE NOTICE 'שלב א: מריץ פרוצדורה לעדכון ספקים שנכשלו בבדיקות (סטטוס Failed)...';
    CALL process_vendor_failures('Failed');
    
    RAISE NOTICE '--------------------------------------------------';

    -- 2. זימון פונקציה מספר 2: קבלת מצביע (Ref Cursor) עבור פניות דחופות ברמה 'High'
    RAISE NOTICE 'שלב ב: קורא לפונקציה לקבלת Ref Cursor עבור פניות פתוחות ברמת דחיפות High...';
    v_urgent_tickets_cursor := get_urgent_tickets_cursor('High');

    RAISE NOTICE 'שלב ג: מתחיל סריקה והדפסה של הפניות מתוך ה-Ref Cursor שהתקבל:';
    RAISE NOTICE '--------------------------------------------------';
    
    -- לולאת FETCH ידנית לסריקת ה-Ref Cursor הדינמי שנפתח בפונקציה
    LOOP
        FETCH v_urgent_tickets_cursor INTO v_ticket_id, v_asset_name, v_description, v_technician_name, v_opened_date;
        EXIT WHEN NOT FOUND; -- תנאי יציאה מהלולאה כאשר נגמרות השורות בקרסור
        
        v_counter := v_counter + 1;
        RAISE NOTICE 'פנייה דחופה מס'' % | נכס: % | תיאור תקלה: % | טכנאי אחראי: % | תאריך פתיחה: %',
                     v_ticket_id, v_asset_name, v_description, v_technician_name, v_opened_date;
    END LOOP;

    -- סגירה חובה של ה-Ref Cursor שקיבלנו מהפונקציה
    CLOSE v_urgent_tickets_cursor;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'סיכום נתונים: סך הכל נמצאו וסרוקו % פניות דחופות בתוך ה-Ref Cursor.', v_counter;
    RAISE NOTICE '==================================================';
END $$;