-- יצירת טבלאות HotelHR2
CREATE TABLE departments (
    departmentid SERIAL PRIMARY KEY,
    departmentname VARCHAR(100) NOT NULL
);

CREATE TABLE jobroles (
    roleid SERIAL PRIMARY KEY,
    roletitle VARCHAR(100) NOT NULL,
    departmentid INTEGER REFERENCES departments(departmentid),
    basesalary NUMERIC(10,2) DEFAULT 0.00
);

CREATE TABLE employees (
    employeeid SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    departmentid INTEGER REFERENCES departments(departmentid),
    roleid INTEGER REFERENCES jobroles(roleid),
    hiredate DATE DEFAULT CURRENT_DATE,
    employmentstatus VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE shifts (
    shiftid SERIAL PRIMARY KEY,
    shifttype VARCHAR(50) NOT NULL,
    starttime TIME NOT NULL,
    endtime TIME NOT NULL,
    isnightshift BOOLEAN DEFAULT false
);

CREATE TABLE employeeschedules (
    scheduleid SERIAL PRIMARY KEY,
    employeeid INTEGER REFERENCES employees(employeeid),
    shiftid INTEGER REFERENCES shifts(shiftid),
    shiftdate DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled'
);

CREATE TABLE attendancelogs (
    logid SERIAL PRIMARY KEY,
    employeeid INTEGER REFERENCES employees(employeeid),
    clockin TIMESTAMP NOT NULL,
    clockout TIMESTAMP,
    status VARCHAR(20)
);

CREATE TABLE employeeabsences (
    employeeid INTEGER REFERENCES employees(employeeid),
    startdate DATE NOT NULL,
    enddate DATE NOT NULL,
    absencetype VARCHAR(50),
    isapproved BOOLEAN DEFAULT false
);

-- קישור בין המערכות
ALTER TABLE STAFF ADD COLUMN employeeid INTEGER;

UPDATE STAFF SET employeeid = 1 WHERE Staff_ID = 1;
UPDATE STAFF SET employeeid = 2 WHERE Staff_ID = 2;
UPDATE STAFF SET employeeid = 3 WHERE Staff_ID = 3;
UPDATE STAFF SET employeeid = 4 WHERE Staff_ID = 4;
UPDATE STAFF SET employeeid = 5 WHERE Staff_ID = 5;