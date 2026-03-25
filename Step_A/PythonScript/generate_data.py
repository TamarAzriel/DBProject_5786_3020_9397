import random
from datetime import datetime, timedelta

# הגדרות כלליות
asset_types = ["Air Conditioner", "Elevator", "Water Pump", "Fridge", "Generator", "Projector", "Smart TV"]
categories = ["HVAC", "Transport", "Plumbing", "Kitchen", "Power", "AV", "Electronics"]
brands = ["Samsung", "LG", "Electra", "Bosch", "Carrier", "Mitsubishi"]
issues = ["Leaking water", "Not turning on", "Making noise", "Low performance", "General maintenance"]
priorities = ["Low", "Medium", "High", "Urgent"]
statuses = ["Open", "In Progress", "Closed"]

# 1. יצירת נכסים (Assets)
with open("insert_assets_20k.sql", "w", encoding="utf-8") as f:
    for i in range(1, 20001):
        name = random.choice(asset_types)
        cat = random.choice(categories)
        loc_id = random.randint(1, 500) 
        vendor_id = random.randint(1, 500)  # <--- הוספתי הגרלת מזהה ספק!
        brand = random.choice(brands)
        model = f"{random.choice(['SN', 'GT'])}-{random.randint(100, 999)}"
        install_date = f"202{random.randint(0, 4)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        
        # הוספתי את Vendor_Id גם לעמודות וגם לערכים שמכניסים
        sql = (f"INSERT INTO ASSETS (Asset_Id, Asset_Name, Asset_Category, Location_Id, Vendor_Id, Manufacturer, Model_Number, Installation_Date, Status) "
               f"VALUES ({i}, '{name}', '{cat}', {loc_id}, {vendor_id}, '{brand}', '{model}', '{install_date}', 'Active');\n")
        f.write(sql)

# 2. יצירת תקלות (Tickets)
with open("insert_tickets_20k.sql", "w", encoding="utf-8") as f:
    for i in range(1, 20001):
        asset_id = random.randint(1, 20000)
        staff_id = random.randint(1, 500) 
        
        issue = random.choice(issues)
        priority = random.choice(priorities)
        status = random.choice(statuses)
        
        opened_date = datetime(2025, random.randint(1, 12), random.randint(1, 28))
        opened_str = opened_date.strftime('%Y-%m-%d')
        
        if status == "Closed":
            resolved_date = opened_date + timedelta(days=random.randint(1, 14))
            resolved_str = f"'{resolved_date.strftime('%Y-%m-%d')}'"
        else:
            resolved_str = "NULL"
            
        sql = f"INSERT INTO MAINTENANCE_TICKETS (Ticket_ID, Asset_Id, Staff_Id, Issue_Description, Opened_At, Resolved_At, Urgency_Level, Ticket_Status) " \
              f"VALUES ({i}, {asset_id}, {staff_id}, '{issue}', '{opened_str}', {resolved_str}, '{priority}', '{status}');\n"
        f.write(sql)

print("Finished! Both files are ready and match the Hotel schema.")