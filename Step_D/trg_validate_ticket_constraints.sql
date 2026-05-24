-- א. יצירת פונקציית הטריגר
CREATE OR REPLACE FUNCTION validate_ticket_constraints_func()
RETURNS TRIGGER AS $$
DECLARE
    v_asset_status VARCHAR(50);
BEGIN
    -- 1. אלמנט: בדיקת שלמות נתונים והקפצת שגיאה (Exception) במקרה של תאריכים לא הגיוניים
    IF NEW.Resolved_At IS NOT NULL AND NEW.Resolved_At < NEW.Opened_At THEN
        RAISE EXCEPTION 'שגיאה בקלט: תאריך סגירת הפנייה (%) אינו יכול להיות מוקדם מתאריך פתיחתה (%).', 
                        NEW.Resolved_At, NEW.Opened_At;
    END IF;

    -- שליפת הסטטוס הנוכחי של הנכס מטבלת ASSETS
    SELECT Status INTO v_asset_status
    FROM ASSETS
    WHERE Asset_Id = NEW.Asset_Id;

    -- 2. אלמנט: הסתעפות מורכבת לבדיקת סטטוס הנכס מול דחיפות הפנייה
    IF NEW.Urgency_Level = 'Urgent' AND v_asset_status = 'Under Review' THEN
        -- 3. אלמנט: Exception מותאם אישית לחסימת הפעולה בבסיס הנתונים
        RAISE EXCEPTION 'חסימת מערכת: לא ניתן לפתוח פנייה דחופה עבור נכס שנמצא בבדיקת ספק (Under Review).';
    END IF;

    -- בטריגר מסוג BEFORE מחזירים את NEW כדי לאפשר את כתיבת השורה
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ב. הצהרת הטריגר וקישורו לטבלה לפני INSERT או UPDATE
CREATE OR REPLACE TRIGGER trg_before_ticket_save
BEFORE INSERT OR UPDATE ON MAINTENANCE_TICKETS
FOR EACH ROW
EXECUTE FUNCTION validate_ticket_constraints_func();