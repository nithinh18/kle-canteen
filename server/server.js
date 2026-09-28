/**
 * KLE CANTEEN - FULL STACK SERVER
 * Node.js + Express + WebSocket + SQLite Architecture
 * Serving: KLE Society's College of BCA, Gokak
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');

const db = require('./database.js');
const { CAMPUS_INFO, PROMO_CODES } = require('../js/data.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Serve frontend static files
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// HTTP server and WebSocket server
const server = http.createServer(app);
let wss = null;

if (!process.env.VERCEL) {
  try {
    wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
      console.log(`[WebSocket] New client connected from ${req.socket.remoteAddress}`);

      // Send initial welcome & connection ping
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: {
          message: "Connected to KLE Canteen Live Server",
          campus: CAMPUS_INFO.collegeName,
          time: new Date().toISOString()
        }
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected.');
      });
    });
  } catch (e) {
    console.warn('[WebSocket Init Warning]:', e.message);
  }
}

// Active WebSocket Clients and Broadcast helper
function broadcast(type, payload) {
  if (!wss || !wss.clients) return;
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  let count = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      count++;
    }
  });
  console.log(`[WebSocket] Broadcasted "${type}" to ${count} active clients.`);
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'KLE Canteen',
    college: CAMPUS_INFO.collegeName,
    location: CAMPUS_INFO.location,
    courses: CAMPUS_INFO.courses,
    serverTime: new Date().toISOString(),
    websocketPath: '/ws'
  });
});

// Campus Information
app.get('/api/campus', (req, res) => {
  res.json({
    ...CAMPUS_INFO,
    promoCodes: PROMO_CODES
  });
});

// ------------------------------------------
// 1. AUTHENTICATION (USN + DOB)
// ------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { usn, dob } = req.body;
  if (!usn || !dob) {
    return res.status(400).json({ error: 'USN Number and Date of Birth (DOB) are required.' });
  }

  const student = await db.getStudentByCredentials(usn, dob);
  if (!student) {
    return res.status(401).json({ error: 'Invalid USN or Password (DOB).' });
  }

  res.json({
    success: true,
    user: student,
    token: `jwt-kle-${Buffer.from(student.usn).toString('base64')}`
  });
});

app.get('/api/auth/students', async (req, res) => {
  const students = await db.getAllStudents();
  res.json(students);
});

// ------------------------------------------
// 2. MENU ITEMS (100% PURE VEG CRUD)
// ------------------------------------------
app.get('/api/menu', async (req, res) => {
  const items = await db.getAllMenuItems();
  res.json(items);
});

app.get('/api/menu/:id', async (req, res) => {
  const item = await db.getMenuItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.post('/api/menu', async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Item name, price (in ₹), and category are required.' });
  }

  const newItem = await db.createMenuItem(req.body);
  broadcast('MENU_UPDATED', { action: 'create', item: newItem });
  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/menu/:id', async (req, res) => {
  const updated = await db.updateMenuItem(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Item not found' });
  }

  broadcast('MENU_UPDATED', { action: 'update', item: updated });
  res.json({ success: true, item: updated });
});

app.delete('/api/menu/:id', async (req, res) => {
  const success = await db.deleteMenuItem(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Item not found' });
  }

  broadcast('MENU_UPDATED', { action: 'delete', id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

app.patch('/api/menu/:id/stock', async (req, res) => {
  const updated = await db.toggleItemStock(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Item not found' });
  }

  broadcast('MENU_UPDATED', { action: 'stock_toggle', item: updated });
  res.json({ success: true, item: updated });
});

app.post('/api/menu/reset', async (req, res) => {
  const resetItems = await db.resetDefaultMenu();
  broadcast('MENU_RESET', { items: resetItems });
  res.json({ success: true, items: resetItems });
});

// ------------------------------------------
// 3. ORDERS (KITCHEN & STUDENT ORDER TRACKING)
// ------------------------------------------
app.get('/api/orders', async (req, res) => {
  const orders = await db.getAllOrders();
  res.json(orders);
});

app.get('/api/orders/my/:usn', async (req, res) => {
  const orders = await db.getOrdersByUsn(req.params.usn);
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { items, total } = req.body;
  if (!items || !items.length || total === undefined) {
    return res.status(400).json({ error: 'Order must contain items and a total amount.' });
  }

  const order = await db.createOrder(req.body);
  broadcast('ORDER_CREATED', order);
  res.status(201).json({ success: true, order });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status || !['pending', 'cooking', 'ready', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required: pending, cooking, ready, or completed.' });
  }

  const updatedOrder = await db.updateOrderStatus(req.params.id, status);
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }

  broadcast('ORDER_STATUS_CHANGED', { id: req.params.id, status, order: updatedOrder });
  res.json({ success: true, order: updatedOrder });
});

// ------------------------------------------
// 4. COUNTERS & LIVE WAIT TIMES
// ------------------------------------------
app.get('/api/counters', async (req, res) => {
  const counters = await db.getAllCounters();
  res.json(counters);
});

app.patch('/api/counters/:id', async (req, res) => {
  const { waitMins } = req.body;
  if (waitMins === undefined) {
    return res.status(400).json({ error: 'waitMins is required' });
  }

  const counters = await db.updateCounterWaitTime(Number(req.params.id), Number(waitMins));
  broadcast('COUNTER_UPDATED', counters);
  res.json({ success: true, counters });
});

// ------------------------------------------
// 5. REVIEWS & FEEDBACK
// ------------------------------------------
app.get('/api/reviews', async (req, res) => {
  const reviews = await db.getAllReviews();
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const { name, comment, rating, role } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ error: 'Name and comment are required.' });
  }

  const reviews = await db.createReview({ name, comment, rating, role });
  broadcast('REVIEW_ADDED', reviews);
  res.status(201).json({ success: true, reviews });
});

// Default fallback route to serve index.html for SPA (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Full Stack Server (when not running as Vercel serverless function)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log('================================================================');
    console.log(`🚀 KLE Canteen Full Stack Server Running!`);
    console.log(`📍 Campus: ${CAMPUS_INFO.collegeName} (${CAMPUS_INFO.location})`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`🗄️ Database: SQLite (data/kle_canteen.db)`);
    console.log('================================================================');
  });
}

module.exports = app;
