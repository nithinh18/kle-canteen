const fs = require('fs');
const path = require('path');
const { MENU_ITEMS, REGISTERED_STUDENTS, COUNTER_STATUSES, INITIAL_REVIEWS } = require('../js/data.js');

let sql = `-- ================================================================
-- KLE CANTEEN - SUPABASE DATABASE SCHEMA & INITIAL SEED DATA
-- College: KLE Society's College of BCA, Gokak
-- Courses: BCA, B.COM, BBA, BA
-- Location: Near Byalikata, Gokak
-- Dietary Standard: 100% Pure Vegetarian
-- Currency: Indian Rupees (₹)
-- ================================================================

-- 1. DROP EXISTING TABLES (IF RE-INITIALIZING)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS counters CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- 2. CREATE TABLES
CREATE TABLE students (
  usn TEXT PRIMARY KEY,
  dob TEXT NOT NULL,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 1,
  prep_time TEXT,
  calories TEXT,
  is_veg BOOLEAN DEFAULT TRUE,
  is_spicy BOOLEAN DEFAULT FALSE,
  badge TEXT,
  description TEXT,
  image TEXT,
  counter TEXT DEFAULT 'Counter 1 (Main Food Counter)',
  in_stock BOOLEAN DEFAULT TRUE,
  customizations JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  usn TEXT,
  student_name TEXT,
  branch TEXT,
  counter TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'cooking', 'ready', 'completed'
  timestamp TEXT,
  prep_minutes INTEGER DEFAULT 5,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  counter_number TEXT NOT NULL,
  wait_mins INTEGER DEFAULT 5,
  serving_token TEXT DEFAULT '#KLE-100',
  status TEXT DEFAULT 'Active',
  rush_level TEXT DEFAULT 'Moderate'
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  date TEXT,
  comment TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read and write on students" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read and write on menu_items" ON menu_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read and write on orders" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read and write on counters" ON counters FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read and write on reviews" ON reviews FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE counters;

-- 5. SEED DATA
-- Seed Gokak Campus Students (BCA, B.COM, BBA, BA)
`;

REGISTERED_STUDENTS.forEach(s => {
  sql += `INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES ('${s.usn}', '${s.dob}', '${s.name.replace(/'/g, "''")}', '${s.branch.replace(/'/g, "''")}', '${s.semester}', '${s.phone}');\n`;
});

sql += `\n-- Seed Food Counters\n`;
COUNTER_STATUSES.forEach((c, idx) => {
  sql += `INSERT INTO counters (id, name, counter_number, wait_mins, serving_token, status, rush_level) VALUES (${idx + 1}, '${c.name.replace(/'/g, "''")}', '${c.counterNumber}', ${c.waitMins}, '${c.servingToken}', '${c.status}', '${c.rushLevel || 'Moderate'}');\n`;
});

sql += `\n-- Seed Pure Veg Menu Items\n`;
MENU_ITEMS.forEach(m => {
  const customs = JSON.stringify(m.customizations || []).replace(/'/g, "''");
  const desc = (m.description || '').replace(/'/g, "''");
  const badge = (m.badge || 'Pure Veg').replace(/'/g, "''");
  const name = m.name.replace(/'/g, "''");
  sql += `INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('${m.id}', '${name}', '${m.category}', ${m.price}, ${m.rating || 4.8}, ${m.reviewsCount || 10}, '${m.prepTime || '5 mins'}', '${m.calories || '250 kcal'}', true, ${m.isSpicy ? 'true' : 'false'}, '${badge}', '${desc}', '${m.image}', '${m.counter || 'Counter 1 (Main Food Counter)'}', true, '${customs}'::JSONB);\n`;
});

sql += `\n-- Seed Campus Reviews\n`;
INITIAL_REVIEWS.forEach(r => {
  sql += `INSERT INTO reviews (id, name, role, rating, date, comment, avatar) VALUES ('${r.id}', '${r.name.replace(/'/g, "''")}', '${r.role.replace(/'/g, "''")}', ${r.rating}, '${r.date}', '${r.comment.replace(/'/g, "''")}', '${r.avatar}');\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'supabase-schema.sql'), sql, 'utf8');
console.log('supabase-schema.sql generated successfully.');
