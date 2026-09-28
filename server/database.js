/**
 * KLE CANTEEN - FULL STACK DATABASE MODULE
 * Primary: Supabase Cloud PostgreSQL Database
 * Direct Connection: postgresql://postgres:Nitinh@2026@db.mxvshngbumpdqqgaulbd.supabase.co:5432/postgres
 * Project URL: https://mxvshngbumpdqqgaulbd.supabase.co
 * Local Fallback: Persistent SQLite Database (node:sqlite)
 * College: KLE Society's College of BCA, Gokak
 */

require('dotenv').config();
const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const {
  MENU_ITEMS,
  REGISTERED_STUDENTS,
  SEED_KITCHEN_ORDERS,
  COUNTER_STATUSES,
  INITIAL_REVIEWS
} = require('../js/data.js');

// 1. LOCAL SQLITE INITIALIZATION (Fallback & Offline Storage)
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'kle_canteen.db');
const sqlite = new DatabaseSync(DB_PATH);

// 2. SUPABASE POSTGRESQL POOL INITIALIZATION
const SUPABASE_CONFIG = {
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Nitinh@2026',
  host: process.env.PGHOST || 'db.mxvshngbumpdqqgaulbd.supabase.co',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

let pgPool = null;
let isPostgresConnected = false;

try {
  pgPool = new Pool(SUPABASE_CONFIG);
  pgPool.on('error', (err) => {
    console.warn('[Supabase PG Pool Error]', err.message);
  });
} catch (e) {
  console.warn('[Supabase PG Init Error]', e.message);
}

// Formatters
function formatMenuItemRow(row) {
  if (!row) return null;
  let customizations = [];
  if (row.customizations) {
    customizations = typeof row.customizations === 'string' ? JSON.parse(row.customizations) : row.customizations;
  } else if (row.customizations_json) {
    customizations = JSON.parse(row.customizations_json);
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    rating: Number(row.rating || 4.8),
    reviewsCount: Number(row.reviews_count || row.reviewsCount || 1),
    prepTime: row.prep_time || row.prepTime || '5 mins',
    calories: row.calories || '250 kcal',
    isVeg: Boolean(row.is_veg !== undefined ? row.is_veg : row.isVeg),
    isSpicy: Boolean(row.is_spicy !== undefined ? row.is_spicy : row.isSpicy),
    badge: row.badge,
    description: row.description,
    image: row.image,
    counter: row.counter || 'Counter 1 (Main Food Counter)',
    inStock: Boolean(row.in_stock !== undefined ? row.in_stock : row.inStock),
    customizations: customizations
  };
}

function formatOrderRow(row) {
  if (!row) return null;
  let items = [];
  if (row.items) {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
  } else if (row.items_json) {
    items = JSON.parse(row.items_json);
  }

  return {
    id: row.id,
    token: row.token,
    usn: row.usn,
    studentName: row.student_name || row.studentName,
    branch: row.branch,
    counter: row.counter,
    status: row.status,
    timestamp: row.timestamp,
    prepMinutes: Number(row.prep_minutes || row.prepMinutes || 5),
    items: items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    total: Number(row.total),
    paymentMethod: row.payment_method || row.paymentMethod || 'UPI',
    createdAt: row.created_at || row.createdAt
  };
}

// Initialize Local SQLite Tables & Seed
function initSqlite() {
  sqlite.exec('PRAGMA foreign_keys = ON;');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS students (
      usn TEXT PRIMARY KEY,
      dob TEXT NOT NULL,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      semester TEXT,
      phone TEXT
    );
    CREATE TABLE IF NOT EXISTS menu_items (
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
    CREATE TABLE IF NOT EXISTS orders (
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
    CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      wait_mins INTEGER DEFAULT 5,
      serving_token TEXT,
      status TEXT DEFAULT 'Open'
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      date TEXT,
      comment TEXT NOT NULL,
      avatar TEXT
    );
  `);

  // Seed SQLite if empty
  const itemCount = sqlite.prepare('SELECT COUNT(*) as count FROM menu_items').get().count;
  if (itemCount === 0) {
    const insertItem = sqlite.prepare(`
      INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    MENU_ITEMS.forEach(item => {
      insertItem.run(
        item.id, item.name, item.category, item.price, item.rating, item.reviewsCount,
        item.prepTime, item.calories, item.isVeg ? 1 : 0, item.isSpicy ? 1 : 0,
        item.badge, item.description, item.image, item.counter, item.inStock ? 1 : 0,
        JSON.stringify(item.customizations || [])
      );
    });
  }

  const studentCount = sqlite.prepare('SELECT COUNT(*) as count FROM students').get().count;
  if (studentCount === 0) {
    const insertStudent = sqlite.prepare(`INSERT INTO students (usn, dob, name, branch, semester, phone) VALUES (?, ?, ?, ?, ?, ?)`);
    REGISTERED_STUDENTS.forEach(s => insertStudent.run(s.usn, s.dob, s.name, s.branch, s.semester, s.phone));
  }
}

async function initDatabase() {
  initSqlite();

  // Test Supabase PostgreSQL connection
  if (pgPool) {
    try {
      const res = await pgPool.query('SELECT NOW() as now, COUNT(*) as menu_count FROM menu_items');
      isPostgresConnected = true;
      console.log('⚡ Connected to Supabase Cloud Database (PostgreSQL 17.6)!');
      console.log(`🗄️ Supabase menu_items count: ${res.rows[0].menu_count}`);
      return true;
    } catch (e) {
      console.warn('⚠️ Supabase PG connection failed, operating with SQLite fallback:', e.message);
      isPostgresConnected = false;
      return false;
    }
  }
  return false;
}

// ------------------------------------------
// AUTHENTICATION & STUDENTS
// ------------------------------------------
async function getStudentByCredentials(usn, dob) {
  const normalizedUsn = usn.trim().toUpperCase();
  const normalizedDob = dob.trim();

  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM students WHERE UPPER(usn) = $1 AND dob = $2', [normalizedUsn, normalizedDob]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (e) {
      console.warn('[PG getStudentByCredentials error]', e.message);
    }
  }

  // SQLite fallback
  const row = sqlite.prepare('SELECT * FROM students WHERE UPPER(usn) = ? AND dob = ?').get(normalizedUsn, normalizedDob);
  if (row) return row;

  // Registered student fallback
  const matched = REGISTERED_STUDENTS.find(s => s.usn.toUpperCase() === normalizedUsn && s.dob === normalizedDob);
  if (matched) return matched;

  // Auto-create for demo testing
  return {
    usn: normalizedUsn,
    dob: normalizedDob,
    name: `Student (${normalizedUsn})`,
    branch: 'BCA (Bachelor of Computer Applications)',
    semester: 'Current Sem',
    phone: '98450 00000'
  };
}

async function getAllStudents() {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM students ORDER BY usn ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (e) {
      console.warn('[PG getAllStudents error]', e.message);
    }
  }
  return sqlite.prepare('SELECT * FROM students ORDER BY usn ASC').all();
}

// ------------------------------------------
// MENU ITEMS (CRUD)
// ------------------------------------------
async function getAllMenuItems() {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM menu_items ORDER BY created_at ASC');
      if (res.rows.length > 0) {
        return res.rows.map(formatMenuItemRow);
      }
    } catch (e) {
      console.warn('[PG getAllMenuItems error]', e.message);
    }
  }

  const rows = sqlite.prepare('SELECT * FROM menu_items ORDER BY rowid ASC').all();
  return rows.map(formatMenuItemRow);
}

async function getMenuItemById(id) {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
      if (res.rows.length > 0) return formatMenuItemRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG getMenuItemById error]', e.message);
    }
  }

  const row = sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  return formatMenuItemRow(row);
}

async function createMenuItem(item) {
  const id = item.id || `dish-${Date.now()}`;
  const price = Math.round(Number(item.price));
  const rating = Number(item.rating || 4.8);
  const reviewsCount = Number(item.reviewsCount || 1);
  const prepTime = item.prepTime || '5-10 mins';
  const calories = item.calories || '260 kcal';
  const badge = item.badge || 'Campus Special';
  const description = item.description || `Freshly prepared pure vegetarian ${item.name} at KLE Gokak Canteen.`;
  const image = item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
  const counter = item.counter || 'Counter 1 (Main Food Counter)';
  const customizations = item.customizations || [];

  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query(`
        INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        id, item.name, item.category, price, rating, reviewsCount, prepTime, calories,
        true, Boolean(item.isSpicy), badge, description, image, counter, true, JSON.stringify(customizations)
      ]);
      if (res.rows.length > 0) return formatMenuItemRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG createMenuItem error]', e.message);
    }
  }

  // SQLite fallback
  sqlite.prepare(`
    INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, item.name, item.category, price, rating, reviewsCount, prepTime, calories, 1, item.isSpicy ? 1 : 0, badge, description, image, counter, 1, JSON.stringify(customizations));

  return getMenuItemById(id);
}

async function updateMenuItem(id, updates) {
  if (isPostgresConnected && pgPool) {
    try {
      const fields = [];
      const values = [];
      let idx = 1;

      if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
      if (updates.category !== undefined) { fields.push(`category = $${idx++}`); values.push(updates.category); }
      if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(updates.price)); }
      if (updates.prepTime !== undefined) { fields.push(`prep_time = $${idx++}`); values.push(updates.prepTime); }
      if (updates.calories !== undefined) { fields.push(`calories = $${idx++}`); values.push(updates.calories); }
      if (updates.badge !== undefined) { fields.push(`badge = $${idx++}`); values.push(updates.badge); }
      if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
      if (updates.image !== undefined) { fields.push(`image = $${idx++}`); values.push(updates.image); }
      if (updates.inStock !== undefined) { fields.push(`in_stock = $${idx++}`); values.push(Boolean(updates.inStock)); }

      if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const res = await pgPool.query(query, values);
        if (res.rows.length > 0) return formatMenuItemRow(res.rows[0]);
      }
    } catch (e) {
      console.warn('[PG updateMenuItem error]', e.message);
    }
  }

  // SQLite fallback
  const existing = await getMenuItemById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  sqlite.prepare(`
    UPDATE menu_items SET name = ?, category = ?, price = ?, prep_time = ?, calories = ?, badge = ?, description = ?, image = ?, in_stock = ? WHERE id = ?
  `).run(
    merged.name, merged.category, Number(merged.price), merged.prepTime, merged.calories,
    merged.badge, merged.description, merged.image, merged.inStock ? 1 : 0, id
  );

  return getMenuItemById(id);
}

async function deleteMenuItem(id) {
  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    } catch (e) {
      console.warn('[PG deleteMenuItem error]', e.message);
    }
  }
  sqlite.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  return true;
}

async function toggleItemStock(id) {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('UPDATE menu_items SET in_stock = NOT in_stock WHERE id = $1 RETURNING *', [id]);
      if (res.rows.length > 0) return formatMenuItemRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG toggleItemStock error]', e.message);
    }
  }

  const existing = await getMenuItemById(id);
  if (!existing) return null;
  const newStock = existing.inStock ? 0 : 1;
  sqlite.prepare('UPDATE menu_items SET in_stock = ? WHERE id = ?').run(newStock, id);
  return getMenuItemById(id);
}

async function resetDefaultMenu() {
  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query('DELETE FROM menu_items');
      for (const item of MENU_ITEMS) {
        await pgPool.query(`
          INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          item.id, item.name, item.category, item.price, item.rating, item.reviewsCount,
          item.prepTime, item.calories, true, Boolean(item.isSpicy), item.badge,
          item.description, item.image, item.counter, true, JSON.stringify(item.customizations || [])
        ]);
      }
      return getAllMenuItems();
    } catch (e) {
      console.warn('[PG resetDefaultMenu error]', e.message);
    }
  }

  sqlite.prepare('DELETE FROM menu_items').run();
  const insertItem = sqlite.prepare(`
    INSERT INTO menu_items (id, name, category, price, rating, reviews_count, prep_time, calories, is_veg, is_spicy, badge, description, image, counter, in_stock, customizations_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  MENU_ITEMS.forEach(item => {
    insertItem.run(
      item.id, item.name, item.category, item.price, item.rating, item.reviewsCount,
      item.prepTime, item.calories, 1, item.isSpicy ? 1 : 0, item.badge, item.description,
      item.image, item.counter, 1, JSON.stringify(item.customizations || [])
    );
  });
  return getAllMenuItems();
}

// ------------------------------------------
// ORDERS (KITCHEN & DISPATCH)
// ------------------------------------------
async function getAllOrders() {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM orders ORDER BY created_at DESC');
      if (res.rows.length > 0) return res.rows.map(formatOrderRow);
    } catch (e) {
      console.warn('[PG getAllOrders error]', e.message);
    }
  }

  const rows = sqlite.prepare('SELECT * FROM orders ORDER BY created_at DESC, rowid DESC').all();
  return rows.map(formatOrderRow);
}

async function getOrdersByUsn(usn) {
  const normUsn = usn.toUpperCase().trim();
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM orders WHERE UPPER(usn) = $1 ORDER BY created_at DESC', [normUsn]);
      return res.rows.map(formatOrderRow);
    } catch (e) {
      console.warn('[PG getOrdersByUsn error]', e.message);
    }
  }

  const rows = sqlite.prepare('SELECT * FROM orders WHERE UPPER(usn) = ? ORDER BY created_at DESC').all(normUsn);
  return rows.map(formatOrderRow);
}

async function getOrderById(id) {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (res.rows.length > 0) return formatOrderRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG getOrderById error]', e.message);
    }
  }

  const row = sqlite.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return formatOrderRow(row);
}

async function createOrder(orderData) {
  const id = orderData.id || `ord-${Date.now()}`;
  const token = orderData.token || `#KLE-${Math.floor(100 + Math.random() * 900)}`;
  const status = orderData.status || 'pending';
  const prepMinutes = Number(orderData.prepMinutes || 5);
  const subtotal = Number(orderData.subtotal || 0);
  const discount = Number(orderData.discount || 0);
  const total = Number(orderData.total || 0);
  const items = orderData.items || [];
  const timestamp = orderData.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query(`
        INSERT INTO orders (id, token, usn, student_name, branch, counter, status, timestamp, prep_minutes, items, subtotal, discount, total, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        id, token, orderData.usn || '', orderData.studentName || 'Student', orderData.branch || 'BCA',
        orderData.counter || 'Counter 1 (South Indian & Dosa)', status, timestamp, prepMinutes,
        JSON.stringify(items), subtotal, discount, total, orderData.paymentMethod || 'UPI'
      ]);
      if (res.rows.length > 0) return formatOrderRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG createOrder error]', e.message);
    }
  }

  // SQLite fallback
  sqlite.prepare(`
    INSERT INTO orders (id, token, usn, student_name, branch, counter, status, timestamp, prep_minutes, items_json, subtotal, discount, total, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, token, orderData.usn || '', orderData.studentName || 'Student', orderData.branch || 'BCA',
    orderData.counter || 'Counter 1', status, timestamp, prepMinutes,
    JSON.stringify(items), subtotal, discount, total, orderData.paymentMethod || 'UPI'
  );

  return getOrderById(id);
}

async function updateOrderStatus(id, status) {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      if (res.rows.length > 0) return formatOrderRow(res.rows[0]);
    } catch (e) {
      console.warn('[PG updateOrderStatus error]', e.message);
    }
  }

  sqlite.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return getOrderById(id);
}

// ------------------------------------------
// COUNTERS
// ------------------------------------------
async function getAllCounters() {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM counters ORDER BY id ASC');
      if (res.rows.length > 0) {
        return res.rows.map(c => ({
          id: c.id,
          name: c.name,
          counterNumber: c.counter_number || `Counter ${c.id}`,
          waitMins: Number(c.wait_mins || 5),
          servingToken: c.serving_token || '#KLE-100',
          status: c.status || 'Active',
          rushLevel: c.rush_level || 'Moderate'
        }));
      }
    } catch (e) {
      console.warn('[PG getAllCounters error]', e.message);
    }
  }

  return sqlite.prepare('SELECT * FROM counters ORDER BY id ASC').all().map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    waitMins: Number(c.wait_mins || 5),
    servingToken: c.serving_token || '#KLE-100',
    status: c.status || 'Open'
  }));
}

async function updateCounterWaitTime(id, waitMins) {
  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query('UPDATE counters SET wait_mins = $1 WHERE id = $2', [waitMins, id]);
      return getAllCounters();
    } catch (e) {
      console.warn('[PG updateCounterWaitTime error]', e.message);
    }
  }

  sqlite.prepare('UPDATE counters SET wait_mins = ? WHERE id = ?').run(waitMins, id);
  return getAllCounters();
}

// ------------------------------------------
// REVIEWS
// ------------------------------------------
async function getAllReviews() {
  if (isPostgresConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM reviews ORDER BY created_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          name: r.name,
          role: r.role,
          rating: Number(r.rating || 5),
          date: r.date,
          comment: r.comment,
          avatar: r.avatar
        }));
      }
    } catch (e) {
      console.warn('[PG getAllReviews error]', e.message);
    }
  }

  return sqlite.prepare('SELECT * FROM reviews ORDER BY rowid DESC').all().map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    rating: Number(r.rating || 5),
    date: r.date,
    comment: r.comment,
    avatar: r.avatar
  }));
}

async function createReview(review) {
  const id = review.id || `rev-${Date.now()}`;
  const date = review.date || 'Today';

  if (isPostgresConnected && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO reviews (id, name, role, rating, date, comment, avatar)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id, review.name, review.role || 'KLE Student', Number(review.rating || 5),
        date, review.comment, review.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
      ]);
      return getAllReviews();
    } catch (e) {
      console.warn('[PG createReview error]', e.message);
    }
  }

  sqlite.prepare(`
    INSERT INTO reviews (id, name, role, rating, date, comment, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, review.name, review.role || 'KLE Student', Number(review.rating || 5),
    date, review.comment, review.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  );

  return getAllReviews();
}

// Auto-run init on load
initDatabase();

module.exports = {
  sqlite,
  pgPool,
  initDatabase,
  getStudentByCredentials,
  getAllStudents,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemStock,
  resetDefaultMenu,
  getAllOrders,
  getOrdersByUsn,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllCounters,
  updateCounterWaitTime,
  getAllReviews,
  createReview
};
