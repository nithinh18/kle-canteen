# 🌿 KLE Canteen — Full Stack Campus Dining & Kitchen Management System

> **College**: KLE Society's College of BCA, Gokak  
> **Campus Courses**: BCA, B.COM, BBA, BA  
> **Location**: Near Byalikata, Gokak, Karnataka - 591307  
> **Dietary Standard**: 100% Pure Vegetarian  
> **Currency**: Indian Rupees (₹)  
> **Architecture**: Full Stack (Node.js + Express + WebSocket + Native SQLite Database + Vanilla JS Frontend)

---

## 🌟 Full Stack & Supabase Cloud Architecture

```
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│     🎓 STUDENT PORTAL (index.html)     │       │    👨‍🍳 CANTEEN PORTAL (canteen.html)    │
│  • 100% Pure Veg Menu Browsing in ₹  │       │  • Staff PIN Security Gate (PIN: 1916)│
│  • Student USN + DOB Login            │       │  • 4-Column Live KDS Kanban Board     │
│  • Tray / Cart & Instant Checkout     │       │  • Live Menu & Price Manager (+/- ₹5) │
│  • Live 3-Stage Cooking Progress      │       │  • Dish Addition, Deletion & Stock    │
└──────────────────┬────────────────────┘       └───────────────────┬───────────────────┘
                   │                                                │
                   ▼                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE CLOUD DATABASE & REALTIME BUS                          │
│               (PostgreSQL + Row Level Security + Realtime Publications)               │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ • students     • menu_items (Live Sync)     • orders (Live KDS)     • counters        │
└──────────────────────────────────┬────────────────────────────────────────────────────┘
                                   │ (Automatic Zero-Config Local Fallback)
                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                   LOCAL FULL STACK ENGINE (EXPRESS + NATIVE SQLITE)                   │
│                     (server/server.js + data/kle_canteen.db on Port 8080)             │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Highlights & Capabilities

### 1. 🎓 Student Side Portal
- **Mandatory Student Authentication**:
  - **Username**: Student University USN (e.g. `U15GK22BCA018`)
  - **Password**: Date of Birth in `DD/MM/YYYY` format (e.g. `15/08/2004`)
  - Pre-seeded student demo accounts for all Gokak courses:
    - **BCA**: `Rahul Patil` (`U15GK22BCA018` / `15/08/2004`)
    - **B.COM**: `Pooja Hegde` (`U15GK23BCM042` / `05/12/2005`)
    - **BBA**: `Darshan Hiremath` (`U15GK23BBA015` / `20/03/2003`)
    - **BA**: `Sneha Kulkarni` (`U15GK22BA009` / `12/06/2004`)
- **100% Pure Veg Menu Browsing**:
  - 27+ freshly made pure vegetarian dishes categorized across Breakfast, Meals & Thalis, Fast Food & Maggi, Snacks & Chaat, Beverages, and Desserts (including famous **Gokak Karadant** & Girmit).
  - Search, price sorting, calorie count, dietary badges, and dish customization.
- **Cart & Tray Checkout**:
  - Instant calculations with student subsidies in Indian Rupees (₹).
  - Generates token `#KLE-XXX` and stores order permanently in SQLite.
- **Live 3-Step Cooking Progress Tracker**:
  - `Step 1`: **Order Received**
  - `Step 2`: **Cooking in Kitchen 🔥**
  - `Step 3`: **Ready for Pickup 🔔** (Automatic audio chime alert!)

---

### 2. 👨‍🍳 Canteen Side (Kitchen Display System & Menu Manager)
- **Live Kitchen Display System (KDS Kanban Board)**:
  - 4 Dynamic Columns: **Received Orders** ➔ **Cooking Now 🔥** ➔ **Ready for Pickup 🔔** ➔ **Picked Up / Handed Over ✅**.
  - One-click status advancement buttons update the order in SQLite and immediately broadcast via WebSocket to the student's screen.
- **Live Canteen Menu & Price Manager**:
  - **Add New Food Items**: Enter Name, Category, Price (₹), Prep Time, Calories, Tag Badge, and Description.
  - **Update Dishes & Prices**: Edit any dish details or change its price.
  - **Quick Price Adjusters**: Instant `-₹5`, `-₹1`, `+₹1`, `+₹5` buttons on every dish card for rapid price adjustment!
  - **Delete / Remove Dishes**: Confirm and remove any dish from both kitchen and student views.
  - **Stock Toggle**: Mark items as `In Stock` or `Sold Out`.
  - **Reset Default Menu**: Restore initial Gokak campus pure veg menu with 1 click.
  - **Real-Time Cross-Portal Sync**: Any addition, price adjustment, or deletion made in the Canteen portal immediately updates the Student menu across all devices and tabs without page reloads!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server health, campus info & WebSocket path |
| `POST` | `/api/auth/login` | Authenticate student via USN & DOB |
| `GET` | `/api/auth/students` | Get registered Gokak campus student accounts |
| `GET` | `/api/menu` | Fetch all pure veg items from SQLite |
| `GET` | `/api/menu/:id` | Fetch specific dish details |
| `POST` | `/api/menu` | Add new food item to SQLite & broadcast |
| `PUT` | `/api/menu/:id` | Update dish details & price in SQLite & broadcast |
| `DELETE` | `/api/menu/:id` | Delete dish from SQLite & broadcast |
| `PATCH` | `/api/menu/:id/stock` | Toggle dish stock (In Stock / Sold Out) |
| `POST` | `/api/menu/reset` | Reset menu to initial pure veg defaults |
| `GET` | `/api/orders` | Fetch active & recent kitchen orders |
| `POST` | `/api/orders` | Place order, assign token `#KLE-XXX`, persist in SQLite |
| `PATCH` | `/api/orders/:id/status` | Advance cooking status (`pending` -> `cooking` -> `ready` -> `completed`) |
| `GET` | `/api/counters` | Fetch counter wait times & called tokens |
| `PATCH` | `/api/counters/:id` | Adjust counter wait time |
| `GET` | `/api/reviews` | Fetch student reviews & campus buzz |
| `POST` | `/api/reviews` | Submit new student review to SQLite |

---

## ⚡ WebSocket Real-Time Events (`ws://localhost:8080/ws`)

| Event Type | Payload | Trigger |
| :--- | :--- | :--- |
| `CONNECTED` | Welcome & timestamp | On client connection |
| `MENU_UPDATED` | `{ action, item, id }` | Dish created, price updated, deleted, or stock toggled |
| `MENU_RESET` | `{ items }` | Menu restored to default Gokak pure veg dishes |
| `ORDER_CREATED` | Order object | Student places new order |
| `ORDER_STATUS_CHANGED` | `{ id, status, order }` | Chef starts cooking or marks order ready |
| `COUNTER_UPDATED` | Counters array | Counter wait time adjusted |

---

## 🗄️ Database Schema (`data/kle_canteen.db`)

Built using Node.js native `DatabaseSync` (`node:sqlite`) with zero external native compilation dependencies:

```sql
-- Students table
CREATE TABLE students (
  usn TEXT PRIMARY KEY,
  dob TEXT NOT NULL,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT,
  phone TEXT
);

-- Pure Veg Menu table
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  rating REAL DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 1,
  prep_time TEXT,
  calories TEXT,
  is_veg INTEGER DEFAULT 1,
  is_spicy INTEGER DEFAULT 0,
  badge TEXT,
  description TEXT,
  image TEXT,
  counter TEXT,
  in_stock INTEGER DEFAULT 1,
  customizations_json TEXT
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  usn TEXT,
  student_name TEXT,
  branch TEXT,
  counter TEXT,
  status TEXT NOT NULL,
  timestamp TEXT,
  prep_minutes INTEGER DEFAULT 5,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Counters table
CREATE TABLE counters (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  wait_mins INTEGER DEFAULT 5,
  serving_token TEXT,
  status TEXT DEFAULT 'Open'
);

-- Reviews table
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  date TEXT,
  comment TEXT NOT NULL,
  avatar TEXT
);
```

---

## 🏃‍♂️ How to Run the Full Stack Application

### Prerequisites:
- **Node.js**: v18+ (tested on Node.js v24.18.0)
- **npm**: v9+

### Start the Server:
```bash
npm start
```
*or*
```bash
node server/server.js
```

### Accessing the Web Application:
- Student Portal URL: **[http://localhost:8080/index.html](http://localhost:8080/index.html)**
- Canteen Staff Portal URL: **[http://localhost:8080/canteen.html](http://localhost:8080/canteen.html)**
- Staff Security PIN: `1916` or `KLE@GOKAK`
- WebSocket Endpoint: `ws://localhost:8080/ws`
- Health Endpoint: `http://localhost:8080/api/health`

---

## ⚡ Supabase Database Setup (3 Quick Steps)

The project includes ready-to-run PostgreSQL scripts configured with Row Level Security (RLS) and Realtime change broadcasts:

1. **Open Supabase SQL Editor**:
   - Go to your Supabase Project Dashboard (`https://supabase.com/dashboard/project/<your-project>`).
   - Click **SQL Editor** on the left menu.
2. **Execute `supabase-schema.sql`**:
   - Copy the entire contents of [`supabase-schema.sql`](supabase-schema.sql).
   - Paste into the SQL Editor and click **Run**.
   - This creates tables (`students`, `menu_items`, `orders`, `counters`, `reviews`), configures public `anon` policies, enables Supabase Realtime for `menu_items` & `orders`, and seeds all 27 Gokak dishes and student logins.
3. **Connect in Website UI**:
   - Open either `index.html` or `canteen.html`.
   - Click the **"Connect Supabase"** badge in the navigation bar.
   - Paste your **Project URL** (`https://<project-ref>.supabase.co`) and **anon public key**.
   - Click **Save & Connect**. The badge turns green (`⚡ Supabase Connected`) and all data syncs live via Supabase Realtime!

---

## 📁 Directory Structure

```
Project/
├── server/
│   ├── database.js          # SQLite schema, queries & seed initialization
│   └── server.js            # Express REST API, WebSocket server & static files
├── data/
│   └── kle_canteen.db       # Persistent SQLite database file
├── js/
│   ├── data.js              # Gokak campus info, 27 pure veg items & seed logins
│   ├── app.js               # Student Portal logic, cart in ₹ & cooking tracker
│   ├── canteen.js           # Canteen Portal logic, KDS Kanban & price manager
│   └── supabase-config.js   # Supabase JS SDK client & dual-mode sync adapter
├── css/
│   └── styles.css           # Modern Tailwind-compatible styling & animations
├── index.html               # 🎓 Student Ordering Portal (100% Pure Veg, ₹)
├── canteen.html             # 👨‍🍳 Canteen Kitchen Display & Price Manager Portal
├── supabase-schema.sql      # Supabase PostgreSQL schema, RLS & Realtime publication
├── package.json             # Node.js dependencies & scripts
└── README.md                # Documentation & architecture guide
```
