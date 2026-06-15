-- Corrected versions of two Step_D routines that fail to compile on PostgreSQL.
-- The Step_D folder is left untouched; this file is applied to the live DB only.
--
-- Fix 1: sp_reassign_overdue_tickets.sql
--   The FOR-loop variable v_ticket was never declared. PL/pgSQL requires the
--   loop variable of a query FOR-loop to be declared as RECORD.
--
-- Fix 2: fn_calculate_location_days.sql
--   "e_location_not_found EXCEPTION;" is Oracle PL/SQL syntax. PostgreSQL has
--   no EXCEPTION variable type — the custom error is raised directly instead.

CREATE OR REPLACE PROCEDURE reassign_overdue_tickets()
AS $$
DECLARE
    v_ticket RECORD; -- FIX: explicit RECORD declaration for the FOR loop
    v_expert_id INT;
    v_updated_count INT := 0;
BEGIN
    FOR v_ticket IN 
        SELECT t.Ticket_ID, a.Asset_Category, t.Opened_At
        FROM MAINTENANCE_TICKETS t
        JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
        WHERE t.Ticket_Status = 'Open' 
          AND t.Opened_At < CURRENT_DATE - 3
    LOOP
        SELECT Staff_ID INTO v_expert_id
        FROM STAFF
        WHERE Expertise = v_ticket.Asset_Category
        LIMIT 1;

        IF v_expert_id IS NOT NULL THEN
            UPDATE MAINTENANCE_TICKETS
            SET Staff_Id = v_expert_id,
                Urgency_Level = 'High'
            WHERE Ticket_ID = v_ticket.Ticket_ID;
            
            v_updated_count := v_updated_count + 1;
        ELSE
            RAISE NOTICE 'התראה: לא נמצא טכנאי עם מומחיות מתאימה (%) עבור פנייה %', 
                         v_ticket.Asset_Category, v_ticket.Ticket_ID;
        END IF;
    END LOOP;

    RAISE NOTICE 'הפרוצדורה הסתיימה בהצלחה. שויכו מחדש % פניות תחזוקה.', v_updated_count;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'שגיאה פרוצדורלית בעת שיוך מחדש של פניות: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION calculate_location_maintenance_days(p_location_id INT)
RETURNS INT AS $$
DECLARE
    ticket_cursor CURSOR FOR 
        SELECT t.Opened_At, t.Resolved_At, t.Ticket_Status
        FROM MAINTENANCE_TICKETS t
        JOIN ASSETS a ON t.Asset_Id = a.Asset_Id
        WHERE a.Location_Id = p_location_id;
        
    v_ticket_record RECORD;
    v_total_days INT := 0;
    v_location_exists INT;
    v_days_spent INT;
BEGIN
    SELECT COUNT(*) INTO v_location_exists 
    FROM LOCATIONS 
    WHERE Location_ID = p_location_id;
    
    -- FIX: raise the custom error directly instead of an Oracle-style
    -- EXCEPTION variable, preserving the original message.
    IF v_location_exists = 0 THEN
        RAISE EXCEPTION 'שגיאה בפונקציה: המיקום עם מזהה % אינו קיים במלון.', p_location_id;
    END IF;
    
    OPEN ticket_cursor;
    
    LOOP
        FETCH ticket_cursor INTO v_ticket_record;
        EXIT WHEN NOT FOUND;
        
        IF v_ticket_record.Resolved_At IS NOT NULL THEN
            v_days_spent := v_ticket_record.Resolved_At - v_ticket_record.Opened_At;
        ELSE
            v_days_spent := CURRENT_DATE - v_ticket_record.Opened_At;
        END IF;
        
        v_total_days := v_total_days + v_days_spent;
    END LOOP;
    
    CLOSE ticket_cursor;
    
    RETURN v_total_days;
END;
$$ LANGUAGE plpgsql;
