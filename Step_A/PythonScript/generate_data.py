import random
from datetime import datetime, timedelta

# --- Configuration & Mock Data Pools ---
# Lists used to randomly populate asset and ticket fields
asset_types = ["Air Conditioner", "Elevator", "Water Pump", "Fridge", "Generator", "Projector", "Smart TV"]
categories = ["HVAC", "Transport", "Plumbing", "Kitchen", "Power", "AV", "Electronics"]
brands = ["Samsung", "LG", "Electra", "Bosch", "Carrier", "Mitsubishi"]
issues = ["Leaking water", "Not turning on", "Making noise", "Low performance", "General maintenance"]
priorities = ["Low", "Medium", "High", "Urgent"]
statuses = ["Open", "In Progress", "Closed"]

# --- 1. Generate Assets SQL Script (20,000 Records) ---
# Creates a SQL file to populate the ASSETS table
with open("insert_assets_20k.sql", "w", encoding="utf-8") as f:
    for i in range(1, 20001):
        name = random.choice(asset_types)
        cat = random.choice(categories)
        loc_id = random.randint(1, 500)      # Randomly assign to a location ID
        vendor_id = random.randint(1, 500)   # Randomly assign to a vendor ID
        brand = random.choice(brands)
        
        # Generate a dummy model number (e.g., SN-452)
        model = f"{random.choice(['SN', 'GT'])}-{random.randint(100, 999)}"
        
        # Generate a random installation date between 2020 and 2024
        install_date = f"202{random.randint(0, 4)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        
        # Construct the SQL INSERT statement
        sql = (f"INSERT INTO ASSETS (Asset_Id, Asset_Name, Asset_Category, Location_Id, Vendor_Id, Manufacturer, Model_Number, Installation_Date, Status) "
               f"VALUES ({i}, '{name}', '{cat}', {loc_id}, {vendor_id}, '{brand}', '{model}', '{install_date}', 'Active');\n")
        f.write(sql)

# --- 2. Generate Maintenance Tickets SQL Script (20,000 Records) ---
# Creates a SQL file to populate the MAINTENANCE_TICKETS table
with open("insert_tickets_20k.sql", "w", encoding="utf-8") as f:
    for i in range(1, 20001):
        asset_id = random.randint(1, 20000)  # Reference a valid asset from the 20k generated above
        staff_id = random.randint(1, 500)    # Randomly assign to a staff member
        
        issue = random.choice(issues)
        priority = random.choice(priorities)
        status = random.choice(statuses)
        
        # Generate a random opening date within the year 2025
        opened_date = datetime(2025, random.randint(1, 12), random.randint(1, 28))
        opened_str = opened_date.strftime('%Y-%m-%d')
        
        # Logic for Resolution Date: Only 'Closed' tickets should have a resolution date
        if status == "Closed":
            # Set resolution date between 1 to 14 days after the opening date
            resolved_date = opened_date + timedelta(days=random.randint(1, 14))
            resolved_str = f"'{resolved_date.strftime('%Y-%m-%d')}'"
        else:
            resolved_str = "NULL"
            
        # Construct the SQL INSERT statement
        sql = f"INSERT INTO MAINTENANCE_TICKETS (Ticket_ID, Asset_Id, Staff_Id, Issue_Description, Opened_At, Resolved_At, Urgency_Level, Ticket_Status) " \
              f"VALUES ({i}, {asset_id}, {staff_id}, '{issue}', '{opened_str}', {resolved_str}, '{priority}', '{status}');\n"
        f.write(sql)

print("Success: 20,000 Assets and 20,000 Tickets generated. Scripts are ready for import.")