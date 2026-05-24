CREATE OR REPLACE PROCEDURE process_vendor_failures(p_failed_status_text VARCHAR)
AS $$
DECLARE
    -- 1. אלמנט: Explicit Cursor עם פרמטר קלט (מזהה ספקים וכמות כשלים בבדיקות)
    vendor_cursor CURSOR(p_status VARCHAR) FOR
        SELECT v.Vendor_Id, v.Company_Name, COUNT(l.Log_Id) AS fail_count
        FROM VENDORS v
        JOIN ASSETS a ON v.Vendor_Id = a.Vendor_Id
        JOIN INSPECTION_LOG l ON a.Asset_Id = l.Asset_Id
        WHERE l.Inspection_Result = p_status
        GROUP BY v.Vendor_Id, v.Company_Name;

    -- 2. אלמנט: Record (משתנה רשומה התואם למבנה השורות של הקרסור)
    v_vendor_rec RECORD;
    
    -- הגדרת תאריך קנס: קיצור החוזה ל-30 יום מהיום
    v_penalty_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
    -- בדיקת תקינות קלט בסיסית
    IF p_failed_status_text IS NULL OR p_failed_status_text = '' THEN
        RAISE EXCEPTION 'שגיאה: סטטוס הכישלון שסופק לפרוצדורה ריק או לא תקין.';
    END IF;

    -- פתיחת הקרסור המפורש והעברת הפרמטר שקיבלנו בפרוצדורה
    OPEN vendor_cursor(p_failed_status_text);
    
    -- 3. אלמנט: לולאה (LOOP) ידנית למעבר על תוצאות הקרסור המורכב
    LOOP
        FETCH vendor_cursor INTO v_vendor_rec;
        EXIT WHEN NOT FOUND; -- תנאי יציאה מהלולאה
        
        -- 4. אלמנט: הסתעפות מורכבת (IF - ELSIF) על פי חומרת הכשלים של הספק
        IF v_vendor_rec.fail_count >= 5 THEN
            -- מקרה חמור: ספק עם 5 כשלים ומעלה - מקצרים לו את החוזה ומקפיאים את כל הנכסים שלו במלון
            
            -- פקודת DML ראשונה: עדכון תאריך פקיעת החוזה של הספק בקובץ ה-VENDORS
            UPDATE VENDORS
            SET Contract_Expiration = v_penalty_date
            WHERE Vendor_Id = v_vendor_rec.Vendor_Id;
            
            -- פקודת DML שנייה: הקפאת כל הנכסים של אותו ספק לסטטוס 'Under Review'
            UPDATE ASSETS
            SET Status = 'Under Review'
            WHERE Vendor_Id = v_vendor_rec.Vendor_Id;
            
            RAISE NOTICE 'ספק גרוע: חוזה החברה % (מזהה %) קוצר עקב % כשלים, ונכסיה הוקפאו.', 
                         v_vendor_rec.Company_Name, v_vendor_rec.Vendor_Id, v_vendor_rec.fail_count;
                         
        ELSIF v_vendor_rec.fail_count >= 2 THEN
            -- מקרה בינוני: ספק עם 2 עד 4 כשלים - רק משנים את סטטוס הנכסים הספציפיים שלו שדורשים טיפול
            UPDATE ASSETS
            SET Status = 'Requires Action'
            WHERE Vendor_Id = v_vendor_rec.Vendor_Id;
              
            RAISE NOTICE 'התראה למערכת: ספק % צבר % כשלים. סטטוס נכסיו עודכן ל-Requires Action.', 
                         v_vendor_rec.Company_Name, v_vendor_rec.fail_count;
        END IF;
        
    END LOOP;
    
    -- סגירת הקרסור בסיום הלולאה
    CLOSE vendor_cursor;

EXCEPTION
    -- 5. אלמנט: Exception Handling לניהול שגיאות ריצה בלתי צפויות
    WHEN OTHERS THEN
        RAISE EXCEPTION 'התרחשה שגיאה פרוצדורלית בעיבוד כשלונות הספקים: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;