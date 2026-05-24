-- א. יצירת פונקציית הטריגר
CREATE OR REPLACE FUNCTION log_resolved_ticket_func()
RETURNS TRIGGER AS $$
DECLARE
    v_next_log_id INT;
BEGIN
    -- 1. אלמנט: הסתעפות (IF) שמוודא שהטריגר יפעל רק כאשר הסטטוס באמת השתנה ל-'Resolved'
    IF NEW.Ticket_Status = 'Resolved' AND OLD.Ticket_Status IS DISTINCT FROM NEW.Ticket_Status THEN
        
        -- שליפת ה-ID הבא עבור טבלת הלוג (מציאת המקסימום + 1)
        SELECT COALESCE(MAX(Log_Id), 0) + 1 INTO v_next_log_id FROM INSPECTION_LOG;
        
        -- 2. אלמנט: פקודת DML (INSERT) לטבלת הלוגים כתוצאה מהעדכון
        INSERT INTO INSPECTION_LOG (
            Log_Id, Asset_Id, Staff_Id, Inspection_Date, 
            Inspection_Result, Technician_Result, Technician_Notes, Tools_Used
        ) VALUES (
            v_next_log_id,
            NEW.Asset_Id,
            NEW.Staff_Id,
            CURRENT_DATE,
            'System Certified',
            'Success',
            'בדיקה אוטומטית: הפנייה נסגרה בהצלחה. מזהה פנייה: ' || NEW.Ticket_ID,
            'Automated System'
        );
    END IF;
    
    -- בטריגר מסוג AFTER תמיד מחזירים את NEW
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ב. הצהרת הטריגר וקישורו לטבלה בזמן UPDATE (חובה לפי הדרישות)
CREATE OR REPLACE TRIGGER trg_after_ticket_resolved
AFTER UPDATE ON MAINTENANCE_TICKETS
FOR EACH ROW
EXECUTE FUNCTION log_resolved_ticket_func();