CREATE OR REPLACE PROCEDURE reassign_overdue_tickets()
AS $$
DECLARE
    -- משתנה להחזקת מזהה הטכנאי המומחה שנמצא
    v_expert_id INT;
    v_updated_count INT := 0;
BEGIN
    -- 1. אלמנט: Implicit Cursor + לולאה (מעבר אוטומטי על כל הפניות הפתוחות שחורגות מ-3 ימים)
    FOR v_ticket IN 
        SELECT t.Ticket_ID, a.Asset_Category, t.Opened_At
        FROM MAINTENANCE_TICKETS t
        JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
        WHERE t.Ticket_Status = 'Open' 
          AND t.Opened_At < CURRENT_DATE - 3
    LOOP
        
        -- חיפוש טכנאי פנוי שמתמחה בדיוק בקטגוריה של הנכס המקולקל
        SELECT Staff_ID INTO v_expert_id
        FROM STAFF
        WHERE Expertise = v_ticket.Asset_Category
        LIMIT 1;

        -- 2. אלמנט: הסתעפות (IF-ELSE) לבדיקה האם נמצא טכנאי מתאים
        IF v_expert_id IS NOT NULL THEN
            
            -- 3. אלמנט: פקודת DML (עדכון טבלת המשימות בטכנאי החדש ושדרוג הדחיפות)
            UPDATE MAINTENANCE_TICKETS
            SET Staff_Id = v_expert_id,
                Urgency_Level = 'High'
            WHERE Ticket_ID = v_ticket.Ticket_ID;
            
            -- קידום המונה
            v_updated_count := v_updated_count + 1;
        ELSE
            -- במידה ולא נמצא מומחה מתאים, נדפיס הודעה למערכת (Notice)
            RAISE NOTICE 'התראה: לא נמצא טכנאי עם מומחיות מתאימה (%) עבור פנייה %', 
                         v_ticket.Asset_Category, v_ticket.Ticket_ID;
        END IF;
        
    END LOOP;

    -- הדפסת סיכום הפעולה
    RAISE NOTICE 'הפרוצדורה הסתיימה בהצלחה. שויכו מחדש % פניות תחזוקה.', v_updated_count;

EXCEPTION
    -- 4. אלמנט: Exception Handling (תפיסת שגיאות כלליות של בסיס הנתונים וניהולן)
    WHEN OTHERS THEN
        RAISE EXCEPTION 'שגיאה פרוצדורלית בעת שיוך מחדש של פניות: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;