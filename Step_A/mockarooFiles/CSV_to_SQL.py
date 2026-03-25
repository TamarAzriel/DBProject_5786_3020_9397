import csv
import os

def convert_csv_to_sql(csv_file, table_name, output_file):
    # בודק אם הקובץ קיים לפני שמתחילים
    if not os.path.exists(csv_file):
        print(f"❌ שגיאה: הקובץ {csv_file} לא נמצא בתיקייה!")
        return

    with open(csv_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        with open(output_file, mode='w', encoding='utf-8') as out:
            out.write(f"-- Data for table {table_name}\n")
            
            for row in reader:
                columns = ', '.join(row.keys())
                
                values = []
                for val in row.values():
                    if val is None or val == "":
                        values.append("NULL")
                    elif val.isdigit(): # אם זה מספר נקי
                        values.append(val)
                    else: # אם זה טקסט
                        clean_val = val.replace("'", "''") # מטפל בגרשים בתוך שמות
                        values.append(f"'{clean_val}'")
                
                values_str = ', '.join(values)
                sql_line = f"INSERT INTO {table_name} ({columns}) VALUES ({values_str});\n"
                out.write(sql_line)
            
    print(f"✅ הצלחנו! הקובץ {output_file} נוצר בהצלחה.")

# --- הרצה להפרדה של הקבצים ---

# ודאי ששמות הקבצים כאן תואמים בדיוק למה שיש לך בתיקייה (כולל אותיות גדולות/קטנות)
convert_csv_to_sql("Step_A/mockarooFiles/LOCATION.csv", "LOCATIONS", "Step_A/mockarooFiles/INSERT_LOCATION.sql")
convert_csv_to_sql("Step_A/mockarooFiles/STAFF.csv", "STAFF", "Step_A/mockarooFiles/INSERT_STAFF.sql")