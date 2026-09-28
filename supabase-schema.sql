-- ================================================================
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
INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES ('U15GK22BCA018', '15/08/2004', 'Rahul Patil', 'BCA (Bachelor of Computer Applications)', '6th Sem', '98451 22334');
INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES ('U15GK23BCM042', '05/12/2005', 'Pooja Hegde', 'B.COM (Bachelor of Commerce)', '4th Sem', '94821 44556');
INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES ('U15GK23BBA015', '20/03/2003', 'Darshan Hiremath', 'BBA (Bachelor of Business Admin)', '4th Sem', '99001 77889');
INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES ('U15GK22BA009', '12/06/2004', 'Sneha Kulkarni', 'BA (Bachelor of Arts)', '6th Sem', '98801 55667');

-- Seed Food Counters
INSERT INTO counters (id, name, counter_number, wait_mins, serving_token, status, rush_level) VALUES (1, 'South Indian & Dosa Grill', 'Counter 1', 6, '#KLE-142', 'Active', 'Moderate');
INSERT INTO counters (id, name, counter_number, wait_mins, serving_token, status, rush_level) VALUES (2, 'Hot Meals, Thalis & Biryani', 'Counter 2', 4, '#KLE-139', 'Smooth', 'Low');
INSERT INTO counters (id, name, counter_number, wait_mins, serving_token, status, rush_level) VALUES (3, 'Maggi, Sandwiches & Chaat Bar', 'Counter 3', 9, '#KLE-145', 'High Rush', 'Busy');
INSERT INTO counters (id, name, counter_number, wait_mins, serving_token, status, rush_level) VALUES (4, 'Filter Kaapi & Cold Drinks', 'Counter 4', 2, '#KLE-148', 'Instant', 'Low');

-- Seed Pure Veg Menu Items
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('b1', 'Mysore Masala Dosa', 'breakfast', 65, 4.9, 384, '6 mins', '340 kcal', true, true, 'Student Favorite', 'Golden crispy crepe smeared with fiery red garlic-chilli chutney, spiced potato mash filling, served with fresh coconut chutney & piping hot sambhar.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Pure Ghee","price":15},{"name":"Extra Amul Cheese","price":20},{"name":"Extra Sambhar Bowl","price":0}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('b2', 'Thatte Idli & Crispy Medu Vada Combo', 'breakfast', 55, 4.8, 290, '4 mins', '280 kcal', true, false, 'Bestseller', 'Fluffy plate-sized steamed Thatte Idli paired with a crunchy, golden medu vada dipped in aromatic drumstick sambhar & mint coconut chutney.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Podi & Ghee Drizzle","price":15},{"name":"Extra Vada","price":25}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('b3', 'College Puri Bhaji (3 pcs)', 'breakfast', 60, 4.7, 215, '7 mins', '410 kcal', true, false, 'Morning Rush', 'Puffed golden wheat puris served with tempered potato-onion bhaji, tangy pickle, and spiced sliced green chillies.', 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra 2 Puris","price":25},{"name":"Extra Bhaji Bowl","price":20}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('b4', 'Classic Bun Maska & Irani Chai', 'breakfast', 45, 4.9, 420, '3 mins', '260 kcal', true, false, 'Campus Heritage', 'Ultra-soft bakery bun loaded with whipped Amul salted butter and sweet tutti-frutti, paired with a cutting hot spiced Irani tea.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"With Mixed Fruit Jam","price":10},{"name":"Double Butter","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('b5', 'Kanda Poha with Sev & Lemon', 'breakfast', 40, 4.6, 160, '3 mins', '220 kcal', true, false, 'Light & Healthy', 'Flattened rice tempered with mustard seeds, curry leaves, crunchy peanuts, and green chillies, topped with Ratlami sev and fresh coriander.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Sev & Peanuts","price":10}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m1', 'KLE Royal South Indian Thali', 'meals', 95, 4.9, 650, '5 mins', '620 kcal', true, false, 'Chef''s Special', 'Unlimited Sona Masoori steamed rice, Karnataka style Sambar, Pepper Rasam, 2 Seasonal Dry Sabzis, Curd, Papad, Pickle & sweet Semiya Payasam.', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Add 2 Hot Chapatis","price":20},{"name":"Extra Cup Curd","price":15},{"name":"Add Roasted Papad","price":10}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m2', 'Special Veg Dum Biryani with Raita', 'meals', 110, 4.8, 512, '8 mins', '550 kcal', true, true, 'Top Rated', 'Fragrant long-grain aged Basmati rice slow-cooked in handi with marinated paneer cubes, fresh veggies, saffron milk, served with boondi raita & salan.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Paneer Cubes","price":30},{"name":"Extra Spicy Salan","price":10},{"name":"Add Boondi Raita","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m3', 'Paneer Butter Masala with 3 Butter Rotis', 'meals', 125, 4.9, 430, '9 mins', '590 kcal', true, false, 'Student Saver', 'Soft malai paneer simmered in rich creamy tomato cashew gravy, finished with kasuri methi & butter, served with 3 fluffy tawa butter rotis & onion salad.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Swap Rotis for Jeera Rice","price":15},{"name":"Extra Butter Roti (1 pc)","price":12},{"name":"Extra Gravy","price":35}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m4', 'Punjabi Chole Bhature (2 Giant Bhaturas)', 'meals', 90, 4.8, 395, '8 mins', '680 kcal', true, true, 'Weekend Special', 'Spiced Amritsari dark chickpea curry loaded with authentic spices, paired with 2 giant balloon-puffed bhaturas, pickled amla, and sirka onions.', 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Bhatura (1 pc)","price":30},{"name":"Extra Chole Portion","price":35}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m5', 'Royal Kaju Paneer Dum Biryani Feast', 'meals', 130, 4.9, 680, '7 mins', '580 kcal', true, true, 'Chef''s Handi Feast', 'Fragrant saffron basmati rice layered with golden roasted cashews, marinated malai paneer cubes, caramelized onions, served with chilled boondi raita & spiced mirchi ka salan.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Roasted Cashews","price":25},{"name":"Extra Paneer Cubes","price":30},{"name":"Extra Boondi Raita Bowl","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('m6', 'Crispy Gobi Manchurian & Veg Hakka Noodles Combo', 'meals', 95, 4.8, 420, '6 mins', '490 kcal', true, true, 'Desi Chinese Favorite', 'Wok-tossed noodles with shredded bell peppers, cabbage, spring onions, paired with crispy cauliflower florets glazed in dark soy, garlic, and ginger sauce.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Schezwan Dip","price":10},{"name":"Extra Manchurian Gravy","price":20}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('f1', 'KLE Special Cheese Tadka Maggi', 'fastfood', 65, 4.9, 920, '5 mins', '380 kcal', true, true, 'Campus Legend', 'Double 2-minute noodles tossed in spicy butter garlic tadka, capsicum, sweet corn, and submerged under a blanket of melted mozzarella & cheddar cheese.', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Cheese Burst","price":20},{"name":"Add Butter Sautéed Corn","price":15},{"name":"Extra Butter & Peri-Peri Tadka","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('f2', 'Jumbo Paneer Tikka Grilled Sandwich', 'fastfood', 85, 4.8, 460, '7 mins', '450 kcal', true, true, 'Top Snack', '3-layer sandwich stuffed with tandoori spiced paneer cubes, capsicum, mint chutney, cheese slice, toasted crisp with salted butter and served with chips.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Add Extra Cheese Slice","price":20},{"name":"Add French Fries on Side","price":35}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('f3', 'Crispy Peri-Peri French Fries Basket', 'fastfood', 60, 4.7, 380, '4 mins', '310 kcal', true, true, 'Quick Crunch', 'Golden crinkle-cut potatoes fried to perfection, tossed in African peri-peri spice dust, served with garlic mayo dip and tomato ketchup.', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Cheesy Jalapeno Dip","price":15},{"name":"Double Size Basket","price":40}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('f4', 'Veg Schezwan Crispy Frankie Roll', 'fastfood', 55, 4.6, 275, '5 mins', '340 kcal', true, true, 'On the Go', 'Flaky paratha roll lined with tangy chutney, wrapped around crispy spiced veg patty, onions, chaat masala, and house special Schezwan glaze.', 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Add Grated Cheese","price":15},{"name":"Add Paneer Cubes","price":25}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('s1', 'Hot Samosa Pav with Thecha (2 Pcs)', 'snacks', 35, 4.9, 610, '2 mins', '320 kcal', true, true, 'Budget King', 'Freshly fried spiced potato samosas tucked inside ladi pavs, smeared with green mint chutney, sweet dates dip, and fiery Kolhapuri garlic thecha.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Fried Green Chilli","price":0},{"name":"Add Cheese Slice","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('s2', 'Butter Pav Bhaji (Double Butter)', 'snacks', 80, 4.8, 440, '6 mins', '490 kcal', true, true, 'Bestseller', 'Mumbai street style mashed vegetable bhaji cooked with aromatic spices, topped with melting butter cubes, served with 2 toasted pavs, onion & lime.', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Pair of Butter Pav (2 pcs)","price":20},{"name":"Extra Cheese Topping","price":20}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('s3', 'Dahi Papdi Chaat with Sev', 'snacks', 55, 4.7, 220, '3 mins', '280 kcal', true, false, 'Cool & Tangy', 'Crisp wheat papdis topped with diced boiled potatoes, chilled sweetened yogurt, tangy tamarind chutney, mint dip, and a generous crunch of fine sev.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Dahi & Chutney","price":10}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('s4', 'Crisp Onion Pakoda with Cutting Chai', 'snacks', 50, 4.8, 360, '5 mins', '350 kcal', true, false, 'Monsoon Mood', 'Crunchy golden gram flour fritters studded with sliced onions, carom seeds, and green chillies, served with fresh coconut chutney and hot tea.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Chutney","price":0}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('v1', 'KLE Signature South Indian Filter Kaapi', 'beverages', 25, 5, 1150, '2 mins', '90 kcal', true, false, 'Must Try', 'Frothy, strong Chicory-infused Arabica decoction blended with full-cream hot milk, poured from heights into traditional brass dabarah and tumbler.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Strong Decoction","price":5},{"name":"Sugar Free (Diabetic Friendly)","price":0}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('v2', 'Thick Cold Coffee with Vanilla Ice Cream', 'beverages', 55, 4.9, 840, '3 mins', '280 kcal', true, false, 'Student Essential', 'Rich blended espresso coffee shake drizzled with Hershey''s chocolate syrup and crowned with a scoop of creamy vanilla ice cream.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Add Extra Choco Fudge","price":15},{"name":"Extra Scoop Ice Cream","price":20}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('v3', 'Alphonso Mango Lassi (Thick & Chilled)', 'beverages', 50, 4.8, 390, '3 mins', '210 kcal', true, false, 'Refreshing', 'Thick hand-churned fresh yogurt blended with pure Alphonso mango pulp, a hint of cardamom, garnished with chopped pistachios & saffron.', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Topped with Dry Fruits","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('v4', 'Adrak Elaichi Cutting Chai (2 Glasses)', 'beverages', 30, 4.9, 970, '2 mins', '85 kcal', true, false, 'Campus Ritual', 'Slow-simmered Assam tea leaves crushed with fresh spicy ginger, green cardamom pods, and sweetened milk. Served piping hot in glasses.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Less Sweet","price":0},{"name":"Extra Ginger Zing","price":0}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('v5', 'Fresh Mint Lemonade Cooler', 'beverages', 35, 4.7, 195, '2 mins', '60 kcal', true, false, 'Summer Savior', 'Freshly squeezed lemon juice, muddled fresh mint leaves, roasted cumin powder, black salt, and ice cold soda/water for instant hydration.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Made with Chilled Soda","price":10}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('d1', 'Hot Gulab Jamun with Vanilla Ice Cream', 'desserts', 45, 4.9, 530, '2 mins', '310 kcal', true, false, 'Sweet Tooth', 'Two melt-in-mouth mawa gulab jamuns dunked in rose-cardamom saffron sugar syrup, served piping hot alongside a chilled scoop of vanilla ice cream.', 'https://images.unsplash.com/photo-1667206565158-b63e8a4d455b?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra 1 Gulab Jamun","price":15}]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('d2', 'Ghee Mysore Pak (Special Soft)', 'desserts', 40, 4.8, 280, '1 min', '290 kcal', true, false, 'Karnataka Pride', 'Rich traditional melt-in-mouth gram flour sweet prepared with copious amounts of pure desi cow ghee. Fragrant, golden, and deeply satisfying.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[]'::JSONB);
INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations) VALUES ('d3', 'Sizzling Chocolate Brownie with Fudge', 'desserts', 85, 4.9, 470, '4 mins', '430 kcal', true, false, 'Celebration', 'Warm Belgian chocolate walnut brownie served on a hot sizzling cast iron skillet, topped with cold vanilla scoop and bubbling hot chocolate fudge.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 'Counter 1 (Main Food Counter)', true, '[{"name":"Extra Choco Chips","price":15},{"name":"Extra Ice Cream Scoop","price":20}]'::JSONB);

-- Seed Campus Reviews
INSERT INTO reviews (id, name, role, rating, date, comment, avatar) VALUES ('r1', 'Rahul Patil', 'BCA, 6th Sem', 5, 'Yesterday', 'The Mysore Masala Dosa is elite! The pre-ordering feature saved me today during the 15-minute break between BCA Labs. Food was piping hot when I reached Counter 1.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80');
INSERT INTO reviews (id, name, role, rating, date, comment, avatar) VALUES ('r2', 'Sneha Kulkarni', 'BA, 6th Sem', 5, '2 days ago', 'KLE Special Filter Kaapi at ₹25 is the only thing keeping our batch awake in morning lectures. Also love that they maintain 100% hygiene and clean tables.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80');
INSERT INTO reviews (id, name, role, rating, date, comment, avatar) VALUES ('r3', 'Darshan Hiremath', 'BBA, 4th Sem', 5, '3 days ago', 'Unlimited South Indian Thali for ₹95 with payasam is hands down the best meal in Gokak campus! Fresh, tasty, and easy on the wallet.', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80');
INSERT INTO reviews (id, name, role, rating, date, comment, avatar) VALUES ('r4', 'Pooja Hegde', 'B.COM, 4th Sem', 5, 'Last week', 'Cheese Tadka Maggi + Cold coffee combo during exams week was a lifesaver. UPI payment and live token queue makes it super smooth.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80');
