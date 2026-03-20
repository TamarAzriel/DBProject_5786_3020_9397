import random

# הגדרת שמות הטבלאות והנתונים לשימוש בסקריפט
table_assets = "ASSETS"
table_tickets = "MAINTENANCE_TICKETS"

# יצירת קובץ ה-SQL עבור נכסים (Assets)
with open("insert_assets_20k.sql", "w", encoding="utf-8") as f:
    asset_types = ["Air Conditioner", "Elevator", "Water Pump", "Fridge", "Generator"]
    brands = ["Samsung", "LG", "Electra", "Bosch", "Carrier"]
    
    for i in range(1, 20001):
        name = random.choice(asset_types)
        brand = random.choice(brands)
        f.write(f"INSERT INTO {table_assets} (Asset_Id, Asset_Name, Manufacturer, Model_Number) VALUES ({i}, '{name}', '{brand}', 'MOD-{random.randint(100, 999)}');\n")

# יצירת קובץ ה-SQL עבור תקלות (Tickets)
with open("insert_tickets_20k.sql", "w", encoding="utf-8") as f:
    issues = ["Leaking water", "Not turning on", "Making noise", "Low performance", "General maintenance"]
    priorities = ["Low", "Medium", "High", "Urgent"]
    
    for i in range(1, 20001):
        issue = random.choice(issues)
        priority = random.choice(priorities)
        # יצירת תאריך רנדומלי בשנת 2025-2026
        day = random.randint(1, 28)
        month = random.randint(1, 12)
        f.write(f"INSERT INTO {table_tickets} (Ticket_ID, Issue_Description, Urgency_Level, Opened_At) VALUES ({i}, '{issue}', '{priority}', '2025-{month:02d}-{day:02d}');\n")

print("Finished! Created 2 files with 20,000 rows each.")