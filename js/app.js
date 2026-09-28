/**
 * KLE CANTEEN - FULL APPLICATION SCRIPT
 * Dual Portals: Student Portal (Order & Track) & Canteen Kitchen Portal (KDS & Dispatch)
 * Includes: USN+DOB Auth, Live Cooking Status Synchronization, Kitchen Dispatch,
 * Sound Synthesizer, Confetti, Menu Sorting, Stock Management.
 */

// Application State
const AppState = {
  currentPortal: 'student', // 'student' or 'canteen'
  currentUser: JSON.parse(localStorage.getItem('kle_student_user')) || null,
  kitchenOrders: JSON.parse(localStorage.getItem('kle_kitchen_orders')) || SEED_KITCHEN_ORDERS,
  soldOutItems: JSON.parse(localStorage.getItem('kle_soldout_items')) || [],
  menuItems: JSON.parse(localStorage.getItem('kle_custom_menu')) || [...MENU_ITEMS],
  cart: JSON.parse(localStorage.getItem('kle_canteen_cart')) || [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'recommended',
  appliedPromo: null,
  orderType: 'pickup',
  soundEnabled: true,
  currentModalItem: null,
  activeToken: JSON.parse(localStorage.getItem('kle_active_token')) || null,
  reviews: JSON.parse(localStorage.getItem('kle_user_reviews')) || INITIAL_REVIEWS
};

// --- AUDIO SYNTHESIZER (Micro-interactions without external files) ---
class SoundController {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playPop() {
    if (!AppState.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playSuccess() {
    if (!AppState.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } catch (e) {}
  }

  playKitchenBell() {
    if (!AppState.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.15); // G6
      gain2.gain.setValueAtTime(0.18, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.4);
    } catch (e) {}
  }
}

const soundManager = new SoundController();

// --- FULL STACK BACKEND API & WEBSOCKET CLIENT ---
const API = {
  async getMenu() {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Could not fetch menu, using local cache:', e);
    }
    return null;
  },
  async createMenuItem(data) {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to create item:', e);
    }
    return null;
  },
  async updateMenuItem(id, updates) {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to update item:', e);
    }
    return null;
  },
  async deleteMenuItem(id) {
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to delete item:', e);
    }
    return null;
  },
  async toggleStock(id) {
    try {
      const res = await fetch(`/api/menu/${id}/stock`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to toggle stock:', e);
    }
    return null;
  },
  async resetMenu() {
    try {
      const res = await fetch('/api/menu/reset', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to reset menu:', e);
    }
    return null;
  },
  async getOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to fetch orders:', e);
    }
    return null;
  },
  async createOrder(orderData) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to create order:', e);
    }
    return null;
  },
  async updateOrderStatus(id, status) {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to update order status:', e);
    }
    return null;
  },
  async login(usn, dob) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usn, dob })
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Invalid credentials' };
    } catch (e) {
      return null;
    }
  },
  async getCounters() {
    try {
      const res = await fetch('/api/counters');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to get counters:', e);
    }
    return null;
  },
  async updateCounterWait(id, waitMins) {
    try {
      const res = await fetch(`/api/counters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitMins })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to update counter wait time:', e);
    }
    return null;
  },
  async getReviews() {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to get reviews:', e);
    }
    return null;
  },
  async createReview(rev) {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rev)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] Failed to submit review:', e);
    }
    return null;
  }
};

let wsClient = null;
let wsReconnectTimer = null;

function setupLiveWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  function updateStatusUI(online) {
    const badge = document.getElementById('backendStatusBadge');
    const dot = document.getElementById('backendStatusDot');
    const text = document.getElementById('backendStatusText');
    if (!badge || !dot || !text) return;

    if (online) {
      badge.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
      dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
      text.textContent = "Full Stack Live";
    } else {
      badge.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
      dot.className = "w-2 h-2 rounded-full bg-amber-500";
      text.textContent = "Reconnecting...";
    }
  }

  try {
    wsClient = new WebSocket(wsUrl);

    wsClient.onopen = () => {
      console.log('⚡ Connected to KLE Canteen Live WebSocket Server');
      updateStatusUI(true);
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    };

    wsClient.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerWebSocketMessage(msg);
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    wsClient.onclose = () => {
      updateStatusUI(false);
      wsReconnectTimer = setTimeout(setupLiveWebSocket, 3000);
    };

    wsClient.onerror = () => {
      updateStatusUI(false);
    };
  } catch (e) {
    updateStatusUI(false);
  }
}

function handleServerWebSocketMessage(msg) {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'MENU_UPDATED':
    case 'MENU_RESET':
      if (msg.payload && msg.payload.items) {
        AppState.menuItems = msg.payload.items;
      } else if (msg.payload && msg.payload.item) {
        const item = msg.payload.item;
        const idx = AppState.menuItems.findIndex(i => i.id === item.id);
        if (msg.payload.action === 'delete') {
          AppState.menuItems = AppState.menuItems.filter(i => i.id !== msg.payload.id);
        } else if (idx !== -1) {
          AppState.menuItems[idx] = item;
        } else {
          AppState.menuItems.unshift(item);
        }
      } else {
        API.getMenu().then(m => {
          if (m) {
            AppState.menuItems = m;
            localStorage.setItem('kle_custom_menu', JSON.stringify(m));
            renderMenu();
            renderCanteenMenuManager();
            renderKitchenStockManager();
          }
        });
      }
      localStorage.setItem('kle_custom_menu', JSON.stringify(AppState.menuItems));
      renderMenu();
      renderCanteenMenuManager();
      renderKitchenStockManager();
      break;

    case 'ORDER_CREATED':
      const newOrder = msg.payload;
      if (newOrder && !AppState.kitchenOrders.some(o => o.id === newOrder.id)) {
        AppState.kitchenOrders.unshift(newOrder);
        localStorage.setItem('kle_kitchen_orders', JSON.stringify(AppState.kitchenOrders));
        renderKitchenBoard();
        renderMyOrdersList();
        if (AppState.currentPortal === 'canteen') {
          soundManager.playKitchenBell();
          showToast(`🔔 New Order ${newOrder.token} received from ${newOrder.studentName}!`, 'info');
        }
      }
      break;

    case 'ORDER_STATUS_CHANGED':
      const { id, status, order } = msg.payload;
      const targetOrder = AppState.kitchenOrders.find(o => o.id === id);
      if (targetOrder) {
        targetOrder.status = status;
      } else if (order) {
        AppState.kitchenOrders.unshift(order);
      }
      localStorage.setItem('kle_kitchen_orders', JSON.stringify(AppState.kitchenOrders));
      renderKitchenBoard();
      renderMyOrdersList();

      if (AppState.activeToken && (AppState.activeToken.id === id || (order && AppState.activeToken.token === order.token))) {
        AppState.activeToken.status = status;
        localStorage.setItem('kle_active_token', JSON.stringify(AppState.activeToken));
        checkExistingToken();

        if (status === 'cooking') {
          soundManager.playPop();
          showToast(`🔥 Kitchen is now cooking your order ${AppState.activeToken.token}!`, 'info');
        } else if (status === 'ready') {
          soundManager.playKitchenBell();
          showToast(`🔔 Order ${AppState.activeToken.token} is READY for pickup at ${targetOrder ? targetOrder.counter : 'Counter'}!`, 'success');
        }
      }
      break;

    case 'COUNTER_UPDATED':
      if (msg.payload && Array.isArray(msg.payload)) {
        msg.payload.forEach((c, idx) => {
          if (COUNTER_STATUSES[idx]) {
            COUNTER_STATUSES[idx].waitMins = c.waitMins;
            COUNTER_STATUSES[idx].servingToken = c.servingToken;
          }
        });
        renderCounters();
        renderKitchenCounters();
      }
      break;
  }
}

async function loadInitialFullStackData() {
  setupLiveWebSocket();

  // Load menu from backend Supabase / SQLite
  let menu = null;
  if (typeof SupabaseService !== 'undefined') {
    menu = await SupabaseService.getMenu();
  } else {
    menu = await API.getMenu();
  }
  if (menu && menu.length > 0) {
    AppState.menuItems = menu;
    localStorage.setItem('kle_custom_menu', JSON.stringify(menu));
    renderMenu();
    if (typeof renderCanteenMenuManager === 'function') renderCanteenMenuManager();
    if (typeof renderKitchenStockManager === 'function') renderKitchenStockManager();
  }

  // Load orders from backend Supabase / SQLite
  let orders = null;
  if (typeof SupabaseService !== 'undefined') {
    orders = await SupabaseService.getOrders();
  } else {
    orders = await API.getOrders();
  }
  if (orders && orders.length > 0) {
    AppState.kitchenOrders = orders;
    localStorage.setItem('kle_kitchen_orders', JSON.stringify(orders));
    if (typeof renderKitchenBoard === 'function') renderKitchenBoard();
    renderMyOrdersList();
  }

  // Load counters from backend SQLite
  const counters = await API.getCounters();
  if (counters && counters.length > 0) {
    counters.forEach((c, idx) => {
      if (COUNTER_STATUSES[idx]) {
        COUNTER_STATUSES[idx].waitMins = c.waitMins;
        COUNTER_STATUSES[idx].servingToken = c.servingToken;
      }
    });
    renderCounters();
    renderKitchenCounters();
  }

  // Load reviews from backend SQLite / Supabase
  const reviews = await API.getReviews();
  if (reviews && reviews.length > 0) {
    AppState.reviews = reviews;
    localStorage.setItem('kle_user_reviews', JSON.stringify(reviews));
    renderReviews();
  }

  // Setup Supabase Realtime Listeners for instant Student updates
  if (typeof SupabaseService !== 'undefined') {
    SupabaseService.setupRealtimeListeners({
      onMenuChange: async () => {
        console.log('⚡ Supabase Realtime: Menu changed in Canteen, updating Student Menu...');
        const updatedMenu = await SupabaseService.getMenu();
        if (updatedMenu && updatedMenu.length > 0) {
          AppState.menuItems = updatedMenu;
          localStorage.setItem('kle_custom_menu', JSON.stringify(updatedMenu));
          renderMenu();
          showToast('🔔 Menu & Prices updated live from Canteen Kitchen!', 'info');
        }
      },
      onOrderChange: (payload) => {
        if (payload && payload.new) {
          const updatedOrder = payload.new;
          if (AppState.activeToken && (AppState.activeToken.id === updatedOrder.id || AppState.activeToken.token === updatedOrder.token)) {
            AppState.activeToken.status = updatedOrder.status;
            localStorage.setItem('kle_active_token', JSON.stringify(AppState.activeToken));
            checkExistingToken();
            renderMyOrdersList();
            if (updatedOrder.status === 'cooking') {
              soundManager.playPop();
              showToast(`🔥 Kitchen is now cooking your order ${updatedOrder.token}!`, 'info');
            } else if (updatedOrder.status === 'ready') {
              soundManager.playKitchenBell();
              showToast(`🔔 Order ${updatedOrder.token} is READY for pickup at ${updatedOrder.counter}!`, 'success');
            }
          }
        }
      }
    });
  }
}

// --- INITIALIZATION (STUDENT PORTAL ONLY) ---
document.addEventListener('DOMContentLoaded', () => {
  renderCombos();
  renderCounters();
  renderMenu();
  renderReviews();
  updateCartUI();
  updateStudentAuthUI();
  setupEventListeners();
  startLiveRushUpdates();
  setupCampusActivityToasts();
  checkExistingToken();
  setupStorageSync();
  loadInitialFullStackData();
  lucide.createIcons();

  // If student is not logged in, show a gentle toast guidance
  if (!AppState.currentUser) {
    setTimeout(() => {
      showToast('👋 Welcome to KLE Canteen! Click "Student Login" to use your USN.', 'info');
    }, 1500);
  }
});

// --- PORTAL SWITCHING (STUDENT SIDE VS CANTEEN KITCHEN SIDE) ---
function switchPortal(portalName) {
  AppState.currentPortal = portalName;
  const studentBtn = document.getElementById('navStudentPortalBtn');
  const canteenBtn = document.getElementById('navCanteenPortalBtn');
  const studentContainer = document.getElementById('studentSideContainer');
  const canteenContainer = document.getElementById('canteenSideContainer');
  const studentNavLinks = document.getElementById('studentNavLinks');

  if (portalName === 'student') {
    studentBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-white text-orange-600 shadow-sm";
    canteenBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900";
    studentContainer.classList.remove('hidden');
    canteenContainer.classList.add('hidden');
    if (studentNavLinks) studentNavLinks.classList.remove('hidden');
    showToast('Switched to Student Ordering Portal', 'info');
  } else {
    canteenBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-white text-orange-600 shadow-sm";
    studentBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900";
    studentContainer.classList.add('hidden');
    canteenContainer.classList.remove('hidden');
    if (studentNavLinks) studentNavLinks.classList.add('hidden');
    renderKitchenBoard();
    renderKitchenCounters();
    renderKitchenStockManager();
    renderCanteenMenuManager();
    showToast('Switched to Canteen Kitchen Display (KDS)', 'success');
  }

  soundManager.playPop();
  lucide.createIcons();
}

// --- STUDENT AUTHENTICATION (USN + DOB) ---
function updateStudentAuthUI() {
  const container = document.getElementById('studentAuthContainer');
  if (!container) return;

  if (AppState.currentUser) {
    const studentOrders = AppState.kitchenOrders.filter(o => o.usn === AppState.currentUser.usn && o.status !== 'completed');
    const hasActiveOrder = studentOrders.length > 0;

    container.innerHTML = `
      <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
        <div class="text-right hidden sm:block">
          <span class="block text-xs font-bold text-slate-900 leading-tight">${AppState.currentUser.name}</span>
          <span class="block text-[10px] text-slate-500 font-mono">${AppState.currentUser.usn}</span>
        </div>
        <button onclick="openMyOrdersModal()" class="relative p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition" title="My Active Orders">
          <i data-lucide="receipt" class="w-4 h-4"></i>
          ${hasActiveOrder ? '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 -right-1 live-dot ring-2 ring-white"></span>' : ''}
        </button>
        <button onclick="handleStudentLogout()" class="p-2 text-slate-400 hover:text-rose-600 transition" title="Logout Student">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    // Pre-fill checkout drawer with student details
    const nameInput = document.getElementById('studentNameInput');
    const rollInput = document.getElementById('studentRollInput');
    if (nameInput) nameInput.value = AppState.currentUser.name;
    if (rollInput) rollInput.value = AppState.currentUser.usn;
  } else {
    container.innerHTML = `
      <button onclick="openStudentLoginModal()" class="px-3.5 py-2 rounded-2xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95">
        <i data-lucide="graduation-cap" class="w-4 h-4 text-orange-600"></i>
        <span>Student Login</span>
      </button>
    `;
  }

  lucide.createIcons();
}

function openStudentLoginModal() {
  const modal = document.getElementById('studentLoginModal');
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
  lucide.createIcons();
}

function closeStudentLoginModal() {
  const modal = document.getElementById('studentLoginModal');
  if (modal) modal.classList.add('hidden');
}

function fillDemoStudent(usn, dob) {
  const usnInput = document.getElementById('loginUSNInput');
  const dobInput = document.getElementById('loginDOBInput');
  if (usnInput) usnInput.value = usn;
  if (dobInput) dobInput.value = dob;
  soundManager.playPop();
}

async function handleStudentLogin(e) {
  e.preventDefault();
  const usnInput = document.getElementById('loginUSNInput');
  const dobInput = document.getElementById('loginDOBInput');
  const usn = usnInput.value.toUpperCase().trim();
  const dob = dobInput.value.trim();

  if (!usn || !dob) {
    showToast('Please enter both your USN and Date of Birth!', 'warning');
    return;
  }

  // Attempt backend Supabase / API login first
  let loginRes = null;
  if (typeof SupabaseService !== 'undefined') {
    loginRes = await SupabaseService.loginStudent(usn, dob);
  } else {
    loginRes = await API.login(usn, dob);
  }
  if (loginRes && loginRes.user) {
    AppState.currentUser = loginRes.user;
    localStorage.setItem('kle_student_user', JSON.stringify(loginRes.user));
    if (loginRes.token) localStorage.setItem('kle_auth_token', loginRes.token);
    updateStudentAuthUI();
    closeStudentLoginModal();
    soundManager.playSuccess();
    showToast(`Welcome ${loginRes.user.name}! (${loginRes.user.branch || 'KLE Gokak Student'})`, 'success');
    return;
  } else if (loginRes && loginRes.error) {
    showToast(loginRes.error, 'error');
    return;
  }

  // Local fallback if offline
  let matchedStudent = REGISTERED_STUDENTS.find(s => s.usn === usn);
  if (matchedStudent) {
    if (matchedStudent.dob !== dob) {
      showToast(`Invalid DOB for ${usn}! For demo try: ${matchedStudent.dob}`, 'error');
      return;
    }
  } else {
    matchedStudent = {
      usn: usn,
      dob: dob,
      name: `Student (${usn})`,
      branch: "KLE Gokak Student",
      semester: "Current Sem",
      phone: "Campus Card"
    };
  }

  AppState.currentUser = matchedStudent;
  localStorage.setItem('kle_student_user', JSON.stringify(matchedStudent));
  updateStudentAuthUI();
  closeStudentLoginModal();
  soundManager.playSuccess();
  showToast(`Welcome ${matchedStudent.name}! You are logged in.`, 'success');
}

function handleStudentLogout() {
  AppState.currentUser = null;
  localStorage.removeItem('kle_student_user');
  updateStudentAuthUI();
  soundManager.playPop();
  showToast('Logged out of Student Account', 'info');
}

// --- STUDENT MY ORDERS & LIVE COOKING STATUS MODAL ---
function openMyOrdersModal() {
  if (!AppState.currentUser) {
    openStudentLoginModal();
    return;
  }
  const modal = document.getElementById('studentOrdersModal');
  renderMyOrdersList();
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
  lucide.createIcons();
}

function closeMyOrdersModal() {
  const modal = document.getElementById('studentOrdersModal');
  if (modal) modal.classList.add('hidden');
}

function renderMyOrdersList() {
  const container = document.getElementById('studentOrdersList');
  if (!container) return;

  if (!AppState.currentUser) {
    container.innerHTML = '<p class="text-xs text-slate-500 text-center py-6">Please log in to view your orders.</p>';
    return;
  }

  const userOrders = AppState.kitchenOrders.filter(o => o.usn === AppState.currentUser.usn);

  if (userOrders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
        <i data-lucide="receipt" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700 text-sm">No Active Orders Yet</h4>
        <p class="text-xs text-slate-500 mt-1 mb-4">You haven't placed any orders with USN ${AppState.currentUser.usn} today.</p>
        <button onclick="closeMyOrdersModal(); location.href='#canteen-menu';" class="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold">
          Explore Menu & Order
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = userOrders.map(order => {
    let statusStep = 1;
    let statusText = "1. Order Received in Queue";
    let statusBg = "bg-orange-100 text-orange-800 border-orange-200";

    if (order.status === 'cooking') {
      statusStep = 2;
      statusText = "2. Currently Cooking on Grill/Tawa 🔥";
      statusBg = "bg-amber-100 text-amber-800 border-amber-200";
    } else if (order.status === 'ready') {
      statusStep = 3;
      statusText = "3. READY FOR PICKUP! 🔔";
      statusBg = "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse";
    } else if (order.status === 'completed') {
      statusStep = 4;
      statusText = "4. Completed & Handed Over ✅";
      statusBg = "bg-slate-100 text-slate-700 border-slate-200";
    }

    return `
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-black text-slate-900">${order.token}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBg}">
                ${statusText}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${order.counter} • Ordered at ${order.timestamp}</p>
          </div>
          <span class="text-lg font-black text-orange-600">₹${order.total}</span>
        </div>

        <!-- 3-Step Live Cooking Progress Bar -->
        <div class="space-y-1">
          <div class="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500">
            <span class="${statusStep >= 1 ? 'text-orange-600 font-extrabold' : ''}">1. Received</span>
            <span class="${statusStep >= 2 ? 'text-amber-600 font-extrabold' : ''}">2. Cooking 🔥</span>
            <span class="${statusStep >= 3 ? 'text-emerald-600 font-extrabold' : ''}">3. Ready 🔔</span>
          </div>
          <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div class="h-full bg-orange-500 transition-all duration-500 ${statusStep >= 1 ? 'w-1/3' : 'w-0'}"></div>
            <div class="h-full bg-amber-500 transition-all duration-500 ${statusStep >= 2 ? 'w-1/3' : 'w-0'}"></div>
            <div class="h-full bg-emerald-500 transition-all duration-500 ${statusStep >= 3 ? 'w-1/3' : 'w-0'}"></div>
          </div>
        </div>

        <!-- Ordered Items Summary -->
        <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
          ${order.items.map(i => `
            <div class="flex justify-between">
              <span class="text-slate-700">${i.quantity}x ${i.name}</span>
              <span class="font-bold text-slate-900">₹${i.price * i.quantity}</span>
            </div>
          `).join('')}
        </div>

        <div class="flex justify-end pt-1">
          <button onclick="reopenActiveTokenModal()" class="text-xs font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
            <span>View Token Slip & QR</span>
          </button>
        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// --- CANTEEN KITCHEN DISPLAY SYSTEM (KDS) & ORDER MANAGEMENT ---
function saveKitchenOrders() {
  localStorage.setItem('kle_kitchen_orders', JSON.stringify(AppState.kitchenOrders));
}

function renderKitchenBoard() {
  const pendingOrders = AppState.kitchenOrders.filter(o => o.status === 'pending');
  const cookingOrders = AppState.kitchenOrders.filter(o => o.status === 'cooking');
  const readyOrders = AppState.kitchenOrders.filter(o => o.status === 'ready');
  const completedOrders = AppState.kitchenOrders.filter(o => o.status === 'completed');

  // Update Metrics
  const metricPending = document.getElementById('metricPendingCount');
  const metricCooking = document.getElementById('metricCookingCount');
  const metricReady = document.getElementById('metricReadyCount');
  const metricRevenue = document.getElementById('metricTotalRevenue');
  const navKitchenBadge = document.getElementById('navKitchenBadge');
  const totalLiveBadge = document.getElementById('kitchenTotalLiveOrdersBadge');

  if (metricPending) metricPending.textContent = pendingOrders.length;
  if (metricCooking) metricCooking.textContent = cookingOrders.length;
  if (metricReady) metricReady.textContent = readyOrders.length;
  if (navKitchenBadge) navKitchenBadge.textContent = pendingOrders.length + cookingOrders.length;
  if (totalLiveBadge) totalLiveBadge.textContent = `${pendingOrders.length + cookingOrders.length + readyOrders.length} Live Orders`;

  const totalRev = AppState.kitchenOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  if (metricRevenue) metricRevenue.textContent = `₹${totalRev}`;

  // Column Counts
  const colPendingCount = document.getElementById('colCountPending');
  const colCookingCount = document.getElementById('colCountCooking');
  const colReadyCount = document.getElementById('colCountReady');
  const colCompletedCount = document.getElementById('colCountCompleted');

  if (colPendingCount) colPendingCount.textContent = pendingOrders.length;
  if (colCookingCount) colCookingCount.textContent = cookingOrders.length;
  if (colReadyCount) colReadyCount.textContent = readyOrders.length;
  if (colCompletedCount) colCompletedCount.textContent = completedOrders.length;

  // Render Columns
  renderKitchenColumn('kdsColPending', pendingOrders, 'pending');
  renderKitchenColumn('kdsColCooking', cookingOrders, 'cooking');
  renderKitchenColumn('kdsColReady', readyOrders, 'ready');
  renderKitchenColumn('kdsColCompleted', completedOrders, 'completed');

  lucide.createIcons();
}

function renderKitchenColumn(containerId, orders, statusType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="h-36 flex flex-col items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-2xl p-4">
        <span>No orders here</span>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    let borderClass = `status-border-${statusType}`;
    let actionBtnHtml = '';

    if (statusType === 'pending') {
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'cooking')" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="flame" class="w-3.5 h-3.5"></i>
          <span>Start Cooking</span>
        </button>
      `;
    } else if (statusType === 'cooking') {
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'ready')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
          <span>Mark Ready for Pickup</span>
        </button>
      `;
    } else if (statusType === 'ready') {
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'completed')" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
          <span>Hand Over & Complete</span>
        </button>
      `;
    } else {
      actionBtnHtml = `
        <span class="block text-center text-[10px] text-slate-400 font-bold">
          Completed • ₹${order.total}
        </span>
      `;
    }

    return `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm kds-card ${borderClass} space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-base font-black text-slate-900 block">${order.token}</span>
            <span class="text-[11px] font-bold text-slate-600">${order.studentName}</span>
            <span class="text-[10px] text-slate-400 font-mono block">${order.usn}</span>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-slate-400 block">${order.timestamp}</span>
            <span class="text-xs font-black text-orange-600">₹${order.total}</span>
          </div>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">${order.counter}</span>
          ${order.items.map(item => `
            <div class="flex justify-between font-medium text-slate-800">
              <span><strong>${item.quantity}x</strong> ${item.name}</span>
              <span class="text-slate-400 text-[11px]">₹${item.price * item.quantity}</span>
            </div>
            ${item.customizations && item.customizations.length > 0 ? `
              <p class="text-[10px] text-orange-600 italic pl-3">+ ${item.customizations.map(c => c.name).join(', ')}</p>
            ` : ''}
          `).join('')}
        </div>

        ${actionBtnHtml}
      </div>
    `;
  }).join('');
}

function updateOrderStatus(orderId, nextStatus) {
  const order = AppState.kitchenOrders.find(o => o.id === orderId);
  if (!order) return;

  order.status = nextStatus;
  saveKitchenOrders();
  renderKitchenBoard();
  renderMyOrdersList();

  // If this matches current user's active token
  if (AppState.activeToken && (AppState.activeToken.id === orderId || AppState.activeToken.token === order.token)) {
    AppState.activeToken.status = nextStatus;
    localStorage.setItem('kle_active_token', JSON.stringify(AppState.activeToken));
    checkExistingToken();
  }

  if (nextStatus === 'cooking') {
    showToast(`Order ${order.token} marked as COOKING 🔥`, 'warning');
    soundManager.playPop();
  } else if (nextStatus === 'ready') {
    showToast(`🔔 Token ${order.token} is READY FOR PICKUP at ${order.counter}!`, 'success');
    soundManager.playKitchenBell();
  } else if (nextStatus === 'completed') {
    showToast(`Order ${order.token} handed over!`, 'info');
    soundManager.playPop();
  }

  // Sync with Full Stack SQLite Backend
  API.updateOrderStatus(orderId, nextStatus);

  updateStudentAuthUI();
}

function simulateIncomingOrder() {
  const randomStudent = REGISTERED_STUDENTS[Math.floor(Math.random() * REGISTERED_STUDENTS.length)];
  const randomDish = AppState.menuItems[Math.floor(Math.random() * AppState.menuItems.length)];
  const tokenNum = `#KLE-${Math.floor(150 + Math.random() * 800)}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder = {
    id: orderId,
    token: tokenNum,
    usn: randomStudent.usn,
    studentName: randomStudent.name,
    roll: randomStudent.usn,
    branch: randomStudent.branch,
    counter: "Counter 1 (South Indian & Dosa)",
    status: "pending",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      { name: randomDish.name, quantity: 1, price: randomDish.price, customizations: [] }
    ],
    subtotal: randomDish.price,
    discount: 0,
    total: randomDish.price,
    paymentMethod: "UPI (Google Pay)"
  };

  AppState.kitchenOrders.unshift(newOrder);
  saveKitchenOrders();
  renderKitchenBoard();
  soundManager.playKitchenBell();
  showToast(`📥 New Student Order Received: ${newOrder.token} (${newOrder.studentName})`, 'success');
}

// --- CHEF COUNTER CONTROLS ---
function renderKitchenCounters() {
  const container = document.getElementById('kitchenCountersGrid');
  if (!container) return;

  container.innerHTML = COUNTER_STATUSES.map((counter, idx) => `
    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">${counter.counterNumber}</span>
        <select onchange="updateCounterRush(${idx}, this.value)" class="text-xs font-bold rounded-lg px-2 py-1 bg-white border border-slate-200">
          <option value="Low" ${counter.rushLevel === 'Low' ? 'selected' : ''}>🟢 Smooth (Low)</option>
          <option value="Moderate" ${counter.rushLevel === 'Moderate' ? 'selected' : ''}>🟡 Moderate</option>
          <option value="Busy" ${counter.rushLevel === 'Busy' ? 'selected' : ''}>🔴 High Rush</option>
        </select>
      </div>

      <h4 class="text-sm font-bold text-slate-800">${counter.name}</h4>

      <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
        <div>
          <span class="text-[10px] text-slate-400 block font-bold">Wait Time</span>
          <span class="text-xs font-black text-slate-900">~${counter.waitMins} mins</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="adjustCounterWait(${idx}, -1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold">-</button>
          <button onclick="adjustCounterWait(${idx}, 1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateCounterRush(counterIdx, newRush) {
  COUNTER_STATUSES[counterIdx].rushLevel = newRush;
  renderCounters(); // Update student side
  showToast(`${COUNTER_STATUSES[counterIdx].counterNumber} rush updated to ${newRush}`, 'info');
}

function adjustCounterWait(counterIdx, delta) {
  COUNTER_STATUSES[counterIdx].waitMins = Math.max(1, COUNTER_STATUSES[counterIdx].waitMins + delta);
  renderKitchenCounters();
  renderCounters(); // Update student side
}

// --- CHEF MENU STOCK CONTROLS ---
function renderKitchenStockManager() {
  const container = document.getElementById('kitchenStockGrid');
  if (!container) return;

  const coreDishes = AppState.menuItems.slice(0, 10); // Top 10 popular dishes
  container.innerHTML = coreDishes.map(dish => {
    const isSoldOut = AppState.soldOutItems.includes(dish.id);
    return `
      <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div class="min-w-0 pr-2">
          <h5 class="text-xs font-bold text-slate-900 truncate">${dish.name}</h5>
          <span class="text-[10px] text-slate-500 font-bold">₹${dish.price}</span>
        </div>
        <button 
          onclick="toggleItemStock('${dish.id}')"
          class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition ${isSoldOut ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'}"
        >
          ${isSoldOut ? 'Sold Out' : 'In Stock'}
        </button>
      </div>
    `;
  }).join('');
}

function toggleItemStock(dishId) {
  if (AppState.soldOutItems.includes(dishId)) {
    AppState.soldOutItems = AppState.soldOutItems.filter(id => id !== dishId);
  } else {
    AppState.soldOutItems.push(dishId);
  }
  localStorage.setItem('kle_soldout_items', JSON.stringify(AppState.soldOutItems));
  renderKitchenStockManager();
  renderCanteenMenuManager();
  renderMenu();
  soundManager.playPop();
  showToast('Menu stock updated!', 'info');
  API.toggleStock(dishId);
}

// --- CANTEEN MENU & PRICE MANAGEMENT (FULL CRUD & REAL-TIME SYNC) ---
const CATEGORY_DEFAULT_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  meals: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  fastfood: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  beverages: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  desserts: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
};

function saveMenuItems() {
  localStorage.setItem('kle_custom_menu', JSON.stringify(AppState.menuItems));
  renderCanteenMenuManager();
  renderMenu();
  renderKitchenStockManager();
}

function renderCanteenMenuManager() {
  const container = document.getElementById('canteenItemsManageGrid');
  const countBadge = document.getElementById('canteenManagerCount');
  if (!container) return;

  const searchInput = document.getElementById('canteenManagerSearch');
  const catInput = document.getElementById('canteenManagerCategory');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedCat = catInput ? catInput.value : 'all';

  let items = [...AppState.menuItems];

  if (selectedCat !== 'all') {
    items = items.filter(i => i.category === selectedCat);
  }

  if (query) {
    items = items.filter(i => 
      i.name.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      (i.badge && i.badge.toLowerCase().includes(query)) ||
      String(i.price).includes(query)
    );
  }

  if (countBadge) {
    countBadge.textContent = `${items.length} Dishes`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <div class="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <i data-lucide="utensils" class="w-7 h-7"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800 mb-1">No items found matching filter</h4>
        <p class="text-xs text-slate-500 mb-4">Try clearing your search or add a new food item to the menu.</p>
        <button onclick="openAddItemModal()" class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition">
          + Add New Food Item
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(dish => {
    const isSoldOut = AppState.soldOutItems.includes(dish.id);
    const categoryName = dish.category.charAt(0).toUpperCase() + dish.category.slice(1);

    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group relative ${isSoldOut ? 'bg-slate-50/80 border-slate-300' : ''}">
        
        <!-- Top Image & Quick Badges -->
        <div class="relative h-36 bg-slate-100 overflow-hidden">
          <img 
            src="${dish.image}" 
            alt="${dish.name}" 
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

          <!-- Pure Veg Dot & Category -->
          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span class="veg-indicator shadow-sm" title="100% Pure Vegetarian"></span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
              ${categoryName}
            </span>
          </div>

          <!-- Stock Pill -->
          <div class="absolute top-2.5 right-2.5">
            <button 
              onclick="toggleItemStock('${dish.id}')"
              class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${isSoldOut ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}"
              title="Click to toggle In Stock / Sold Out"
            >
              ${isSoldOut ? '● Sold Out' : '● In Stock'}
            </button>
          </div>

          <!-- Tag & Prep time -->
          <div class="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-medium">
            <span class="truncate max-w-[130px] font-bold text-amber-300">
              ${dish.badge || 'Pure Veg'}
            </span>
            <span class="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px]">
              <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
              ${dish.prepTime}
            </span>
          </div>
        </div>

        <!-- Body Details -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-1 mb-1">
              <h4 class="font-heading font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors" title="${dish.name}">
                ${dish.name}
              </h4>
            </div>
            <p class="text-slate-500 text-[11px] line-clamp-2 leading-relaxed mb-3">
              ${dish.description || 'Freshly prepared pure vegetarian dish at KLE Gokak Canteen.'}
            </p>
          </div>

          <!-- Price & Instant Quick Adjustment -->
          <div class="pt-3 border-t border-slate-100 mb-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selling Price</span>
              <div class="flex items-center gap-1">
                <span class="text-lg font-black text-slate-900">₹${dish.price}</span>
              </div>
            </div>

            <!-- Fast Price Increments (- ₹5 / + ₹5) -->
            <div class="flex items-center justify-between gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span class="text-[10px] font-semibold text-slate-500 pl-1">Quick Adj:</span>
              <div class="flex items-center gap-1">
                <button 
                  onclick="quickAdjustPrice('${dish.id}', -5)"
                  class="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-bold text-xs transition active:scale-95 text-slate-700 shadow-sm"
                  title="Decrease price by ₹5"
                >
                  -₹5
                </button>
                <button 
                  onclick="quickAdjustPrice('${dish.id}', -1)"
                  class="px-1.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-bold text-xs transition active:scale-95 text-slate-700 shadow-sm"
                  title="Decrease price by ₹1"
                >
                  -₹1
                </button>
                <button 
                  onclick="quickAdjustPrice('${dish.id}', 1)"
                  class="px-1.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-bold text-xs transition active:scale-95 text-slate-700 shadow-sm"
                  title="Increase price by ₹1"
                >
                  +₹1
                </button>
                <button 
                  onclick="quickAdjustPrice('${dish.id}', 5)"
                  class="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-bold text-xs transition active:scale-95 text-slate-700 shadow-sm"
                  title="Increase price by ₹5"
                >
                  +₹5
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons: Edit & Delete -->
          <div class="flex items-center gap-2">
            <button 
              onclick="openEditItemModal('${dish.id}')"
              class="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Edit / Price</span>
            </button>

            <button 
              onclick="handleDeleteItem('${dish.id}')"
              class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center active:scale-95"
              title="Remove item from menu"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function openAddItemModal() {
  const form = document.getElementById('addItemForm');
  if (form) form.reset();
  const modal = document.getElementById('addItemModal');
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
}

function closeAddItemModal() {
  const modal = document.getElementById('addItemModal');
  if (modal) modal.classList.add('hidden');
}

function handleCreateItem(e) {
  e.preventDefault();

  const name = document.getElementById('addNameInput').value.trim();
  const price = parseFloat(document.getElementById('addPriceInput').value);
  const category = document.getElementById('addCategoryInput').value;
  const prepTime = document.getElementById('addPrepTimeInput').value.trim() || '5-10 mins';
  const calories = document.getElementById('addCaloriesInput').value.trim() || '260 kcal';
  const badge = document.getElementById('addBadgeInput').value.trim() || 'Campus Fresh';
  const description = document.getElementById('addDescInput').value.trim() || `Freshly prepared pure vegetarian ${name} at KLE Gokak Canteen.`;
  let image = document.getElementById('addImageInput').value.trim();

  if (!name || isNaN(price) || price <= 0) {
    showToast('Please provide a valid dish name and price in Rupees (₹)!', 'warning');
    return;
  }

  if (!image) {
    image = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.snacks;
  }

  const newId = `dish-${Date.now()}`;
  const newItem = {
    id: newId,
    name: name,
    category: category,
    price: Math.round(price),
    rating: 4.8,
    reviewsCount: 1,
    prepTime: prepTime,
    calories: calories,
    badge: badge,
    description: description,
    image: image,
    isVeg: true,
    inStock: true,
    counter: "Counter 1 (Main Food Counter)",
    customizations: [
      { name: "Extra Chutney / Sauce", price: 5 },
      { name: "Extra Butter / Ghee", price: 10 }
    ]
  };

  AppState.menuItems.unshift(newItem);
  saveMenuItems();
  API.createMenuItem(newItem);
  closeAddItemModal();
  showToast(`✨ Added "${name}" at ₹${newItem.price} to KLE Canteen Menu!`, 'success');
  soundManager.playSuccess();
}

function openEditItemModal(dishId) {
  const dish = AppState.menuItems.find(i => i.id === dishId);
  if (!dish) {
    showToast('Item not found!', 'error');
    return;
  }

  document.getElementById('editItemIdInput').value = dish.id;
  document.getElementById('editNameInput').value = dish.name;
  document.getElementById('editPriceInput').value = dish.price;
  document.getElementById('editCategoryInput').value = dish.category;
  document.getElementById('editPrepTimeInput').value = dish.prepTime || '5 mins';
  document.getElementById('editBadgeInput').value = dish.badge || '';
  document.getElementById('editDescInput').value = dish.description || '';
  document.getElementById('editImageInput').value = dish.image || '';

  const modalNameSpan = document.getElementById('editModalItemName');
  if (modalNameSpan) modalNameSpan.textContent = dish.name;

  const modal = document.getElementById('editItemModal');
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
}

function closeEditItemModal() {
  const modal = document.getElementById('editItemModal');
  if (modal) modal.classList.add('hidden');
}

function handleSaveEditItem(e) {
  e.preventDefault();

  const dishId = document.getElementById('editItemIdInput').value;
  const dish = AppState.menuItems.find(i => i.id === dishId);
  if (!dish) {
    showToast('Item not found!', 'error');
    return;
  }

  const newName = document.getElementById('editNameInput').value.trim();
  const newPrice = parseFloat(document.getElementById('editPriceInput').value);
  const newCat = document.getElementById('editCategoryInput').value;
  const newPrep = document.getElementById('editPrepTimeInput').value.trim();
  const newBadge = document.getElementById('editBadgeInput').value.trim();
  const newDesc = document.getElementById('editDescInput').value.trim();
  const newImg = document.getElementById('editImageInput').value.trim();

  if (!newName || isNaN(newPrice) || newPrice <= 0) {
    showToast('Please enter a valid dish name and price in ₹!', 'warning');
    return;
  }

  dish.name = newName;
  dish.price = Math.round(newPrice);
  dish.category = newCat;
  if (newPrep) dish.prepTime = newPrep;
  dish.badge = newBadge;
  dish.description = newDesc;
  if (newImg) dish.image = newImg;

  // Also update cart if this item was in the student cart
  AppState.cart.forEach(cartItem => {
    if (cartItem.id === dishId) {
      cartItem.name = newName;
      cartItem.basePrice = dish.price;
      const customTotal = (cartItem.customizations || []).reduce((sum, c) => sum + (c.price || 0), 0);
      cartItem.price = dish.price + customTotal;
    }
  });
  localStorage.setItem('kle_canteen_cart', JSON.stringify(AppState.cart));
  updateCartUI();

  saveMenuItems();
  API.updateMenuItem(dishId, dish);
  closeEditItemModal();
  showToast(`✅ Updated "${dish.name}" (₹${dish.price}) across Canteen & Student side!`, 'success');
  soundManager.playSuccess();
}

function handleDeleteItem(dishId) {
  const dish = AppState.menuItems.find(i => i.id === dishId);
  if (!dish) return;

  const confirmed = confirm(`Are you sure you want to remove "${dish.name}" from the KLE Canteen menu?\n\nThis will immediately remove it from the Student Portal as well.`);
  if (!confirmed) return;

  AppState.menuItems = AppState.menuItems.filter(i => i.id !== dishId);
  AppState.soldOutItems = AppState.soldOutItems.filter(id => id !== dishId);
  localStorage.setItem('kle_soldout_items', JSON.stringify(AppState.soldOutItems));

  // Remove from student cart if present
  AppState.cart = AppState.cart.filter(c => c.id !== dishId);
  localStorage.setItem('kle_canteen_cart', JSON.stringify(AppState.cart));
  updateCartUI();

  saveMenuItems();
  API.deleteMenuItem(dishId);
  showToast(`🗑️ Removed "${dish.name}" from menu.`, 'info');
  soundManager.playPop();
}

function quickAdjustPrice(dishId, delta) {
  const dish = AppState.menuItems.find(i => i.id === dishId);
  if (!dish) return;

  const updatedPrice = Math.max(5, dish.price + delta);
  dish.price = updatedPrice;

  // Update cart prices
  AppState.cart.forEach(cartItem => {
    if (cartItem.id === dishId) {
      cartItem.basePrice = updatedPrice;
      const customTotal = (cartItem.customizations || []).reduce((sum, c) => sum + (c.price || 0), 0);
      cartItem.price = updatedPrice + customTotal;
    }
  });
  localStorage.setItem('kle_canteen_cart', JSON.stringify(AppState.cart));
  updateCartUI();

  saveMenuItems();
  API.updateMenuItem(dishId, { price: updatedPrice });
  showToast(`Price for "${dish.name}" set to ₹${dish.price}`, 'info');
  soundManager.playPop();
}

function restoreDefaultMenu() {
  const confirmed = confirm('Reset all items back to default KLE Gokak Pure Veg menu? Any custom items added will be reset.');
  if (!confirmed) return;

  AppState.menuItems = JSON.parse(JSON.stringify(MENU_ITEMS));
  saveMenuItems();
  API.resetMenu();
  showToast('Menu reset to default KLE Gokak Canteen pure veg items!', 'info');
  soundManager.playSuccess();
}

// --- CROSS-TAB STORAGE SYNC ---
function setupStorageSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'kle_kitchen_orders') {
      AppState.kitchenOrders = JSON.parse(e.newValue) || [];
      renderKitchenBoard();
      renderMyOrdersList();
      updateStudentAuthUI();
    } else if (e.key === 'kle_soldout_items') {
      AppState.soldOutItems = JSON.parse(e.newValue) || [];
      renderMenu();
      renderKitchenStockManager();
      renderCanteenMenuManager();
    } else if (e.key === 'kle_custom_menu') {
      AppState.menuItems = JSON.parse(e.newValue) || [...MENU_ITEMS];
      renderMenu();
      renderKitchenStockManager();
      renderCanteenMenuManager();
    }
  });
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Category tabs
  const categoryButtons = document.querySelectorAll('.cat-tab-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => {
        b.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700', 'hover:bg-orange-50');
      });
      btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-orange-50');
      btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');
      
      AppState.activeCategory = btn.dataset.category;
      renderMenu();
      soundManager.playPop();
    });
  });

  // Menu Sorting
  const sortSelect = document.getElementById('menuSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      renderMenu();
      soundManager.playPop();
    });
  }

  // Live Search
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.toLowerCase().trim();
      renderMenu();
    });
  }

  // Student Login Form Submit
  const loginForm = document.getElementById('studentLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleStudentLogin);
  }

  // Cart Drawer open/close
  const cartTrigger = document.getElementById('cartTriggerBtn');
  const cartMobileTrigger = document.getElementById('cartMobileTriggerBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartBackdrop = document.getElementById('cartBackdrop');

  const openCart = () => {
    cartDrawer.classList.remove('translate-x-full');
    cartBackdrop.classList.remove('hidden');
    soundManager.playPop();
  };

  const closeCart = () => {
    cartDrawer.classList.add('translate-x-full');
    cartBackdrop.classList.add('hidden');
  };

  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartMobileTrigger) cartMobileTrigger.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Promo code apply
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoInput = document.getElementById('promoCodeInput');
  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoInput.value.toUpperCase().trim();
      if (PROMO_CODES[code]) {
        AppState.appliedPromo = { code, ...PROMO_CODES[code] };
        showToast(`Promo Applied: ${PROMO_CODES[code].label}`, 'success');
        updateCartUI();
        soundManager.playPop();
      } else {
        showToast('Invalid Coupon Code! Try KLESTUDENT', 'error');
      }
    });
  }

  // Sound toggle button
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      AppState.soundEnabled = !AppState.soundEnabled;
      soundToggleBtn.innerHTML = AppState.soundEnabled 
        ? '<i data-lucide="volume-2" class="w-3.5 h-3.5 text-emerald-600"></i><span>Sound: ON</span>' 
        : '<i data-lucide="volume-x" class="w-3.5 h-3.5 text-slate-400"></i><span>Sound: OFF</span>';
      lucide.createIcons();
    });
  }

  // Token tracker input
  const trackTokenBtn = document.getElementById('trackTokenBtn');
  const tokenTrackerInput = document.getElementById('tokenTrackerInput');
  if (trackTokenBtn && tokenTrackerInput) {
    trackTokenBtn.addEventListener('click', () => {
      const token = tokenTrackerInput.value.toUpperCase().trim();
      if (!token) return;
      lookupTokenStatus(token);
    });
  }

  // Review submission
  const reviewForm = document.getElementById('addReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleReviewSubmit();
    });
  }
}

// --- RENDER COMBOS ---
function renderCombos() {
  const container = document.getElementById('combosContainer');
  if (!container) return;

  container.innerHTML = CAMPUS_COMBOS.map(combo => `
    <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
      <div class="absolute -right-12 -top-12 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-200/60 transition-all"></div>
      
      <div>
        <div class="flex items-center justify-between mb-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold text-white ${combo.tagColor} shadow-sm">
            ${combo.tag}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ${combo.savings}
          </span>
        </div>

        <div class="h-44 rounded-2xl overflow-hidden mb-4 relative">
          <img src="${combo.image}" alt="${combo.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
          <div class="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
            ⚡ Quick Combo
          </div>
        </div>

        <h3 class="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">${combo.title}</h3>
        <p class="text-xs font-semibold text-orange-600 mb-2">${combo.subtitle}</p>
        <p class="text-sm text-slate-600 mb-4 bg-orange-50/60 p-2.5 rounded-xl border border-orange-100/80">
          🍱 <span class="font-medium text-slate-800">${combo.items}</span>
        </p>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900">₹${combo.price}</span>
            <span class="text-sm text-slate-400 line-through">₹${combo.originalPrice}</span>
          </div>
          <span class="text-[11px] text-slate-500">Student Saver Price</span>
        </div>
        <button onclick="addComboToCart('${combo.id}')" class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-orange-600/20 active:scale-95 flex items-center gap-1.5 text-sm">
          <span>Add Combo</span>
          <i data-lucide="plus" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// --- RENDER COUNTERS (LIVE RUSH METER) ---
function renderCounters() {
  const container = document.getElementById('countersGrid');
  if (!container) return;

  container.innerHTML = COUNTER_STATUSES.map(counter => {
    let statusBg = 'bg-emerald-500';
    let statusText = 'Smooth Flow';
    if (counter.rushLevel === 'Moderate') {
      statusBg = 'bg-amber-500';
      statusText = 'Moderate Rush';
    } else if (counter.rushLevel === 'Busy') {
      statusBg = 'bg-rose-500';
      statusText = 'Busy Rush';
    }

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-orange-200 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${counter.counterNumber}</span>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${counter.badgeClass}">
            <span class="w-2 h-2 rounded-full ${statusBg} live-dot"></span>
            <span>${statusText}</span>
          </div>
        </div>

        <h4 class="text-base font-bold text-slate-900 mb-1">${counter.name}</h4>
        <p class="text-xs text-slate-500 mb-4 flex items-center gap-1">
          <i data-lucide="user-check" class="w-3.5 h-3.5 text-orange-500"></i>
          <span>Lead: ${counter.currentChef}</span>
        </p>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
          <div>
            <span class="block text-[11px] text-slate-500 font-medium">Est. Wait</span>
            <span class="text-sm font-bold text-slate-900">~${counter.waitMins} mins</span>
          </div>
          <div class="border-l border-slate-200">
            <span class="block text-[11px] text-slate-500 font-medium">Now Calling</span>
            <span class="text-sm font-bold text-orange-600">${counter.servingToken}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function startLiveRushUpdates() {
  setInterval(() => {
    COUNTER_STATUSES.forEach(c => {
      const delta = Math.floor(Math.random() * 3) - 1;
      c.waitMins = Math.max(2, Math.min(14, c.waitMins + delta));
      if (Math.random() > 0.7) {
        const num = parseInt(c.servingToken.replace('#KLE-', '')) + 1;
        c.servingToken = `#KLE-${num}`;
      }
    });
    renderCounters();
  }, 22000);
}

// --- RENDER MENU ITEMS ---
function renderMenu() {
  const container = document.getElementById('menuGrid');
  const countBadge = document.getElementById('menuCountBadge');
  if (!container) return;

  let items = [...AppState.menuItems];

  // Filter category
  if (AppState.activeCategory !== 'all') {
    items = items.filter(item => item.category === AppState.activeCategory);
  }

  // Filter Search
  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.name.toLowerCase().includes(AppState.searchQuery) ||
      item.description.toLowerCase().includes(AppState.searchQuery) ||
      item.badge.toLowerCase().includes(AppState.searchQuery)
    );
  }

  // Sort items
  if (AppState.sortBy === 'price-asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (AppState.sortBy === 'price-desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (AppState.sortBy === 'rating') {
    items.sort((a, b) => b.rating - a.rating);
  } else if (AppState.sortBy === 'fastest') {
    items.sort((a, b) => parseInt(a.prepTime) - parseInt(b.prepTime));
  }

  if (countBadge) {
    countBadge.textContent = `${items.length} Pure Veg items available`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <div class="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="utensils" class="w-8 h-8"></i>
        </div>
        <h4 class="text-xl font-bold text-slate-800 mb-2">No canteen dishes found!</h4>
        <p class="text-slate-500 text-sm max-w-md mx-auto mb-6">We couldn't find items matching your search. Try searching for Dosa, Maggi, Biryani, or Kaapi.</p>
        <button onclick="resetFilters()" class="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-semibold text-sm shadow hover:bg-orange-700 transition">
          Clear All Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(item => {
    const cartItem = AppState.cart.find(c => c.id === item.id);
    const qty = cartItem ? cartItem.quantity : 0;
    const isSoldOut = AppState.soldOutItems.includes(item.id);

    return `
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm card-hover overflow-hidden flex flex-col justify-between group relative ${isSoldOut ? 'opacity-65' : ''}" id="food-card-${item.id}">
        
        ${isSoldOut ? `
          <div class="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
            <span class="px-4 py-2 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl">
              Sold Out in Kitchen
            </span>
          </div>
        ` : ''}

        <!-- Image & Badges -->
        <div class="relative food-image-wrapper h-52 bg-slate-100">
          <img 
            src="${item.image}" 
            alt="${item.name}" 
            class="w-full h-full object-cover"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
          
          <!-- Dietary Indicator & Badge -->
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span class="veg-indicator shadow-sm" title="100% Pure Vegetarian"></span>
            ${item.badge ? `
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-white/50">
                ${item.badge}
              </span>
            ` : ''}
          </div>

          <!-- Prep time and calories -->
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
            <span class="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
              ${item.prepTime}
            </span>
            <span class="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
              <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-400"></i>
              ${item.calories}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                ${item.name}
              </h3>
              <div class="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-bold shrink-0 border border-amber-200">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                <span>${item.rating}</span>
              </div>
            </div>

            <p class="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
              ${item.description}
            </p>
          </div>

          <!-- Bottom Action & Price -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-2xl font-black text-slate-900">₹${item.price}</span>
              <span class="block text-[10px] text-slate-400 font-medium">Includes taxes</span>
            </div>

            <!-- Add to Cart or Stepper -->
            <div class="flex items-center gap-2">
              ${item.customizations && item.customizations.length > 0 && !isSoldOut ? `
                <button 
                  onclick="openCustomizeModal('${item.id}')"
                  class="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition text-xs font-semibold flex items-center gap-1 border border-slate-200"
                  title="Customize dish"
                >
                  <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
                  <span class="hidden sm:inline">Options</span>
                </button>
              ` : ''}

              ${isSoldOut ? `
                <span class="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">Sold Out</span>
              ` : qty > 0 ? `
                <div class="flex items-center bg-orange-600 text-white rounded-2xl p-1 shadow-md shadow-orange-600/20">
                  <button onclick="decrementItem('${item.id}')" class="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-orange-700 qty-btn">
                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                  </button>
                  <span class="w-7 text-center font-bold text-sm">${qty}</span>
                  <button onclick="incrementItem('${item.id}')" class="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-orange-700 qty-btn">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              ` : `
                <button 
                  onclick="addItemToCart('${item.id}')"
                  class="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-orange-600/20 active:scale-95 flex items-center gap-1.5"
                >
                  <span>Add</span>
                  <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function resetFilters() {
  AppState.activeCategory = 'all';
  AppState.searchQuery = '';
  AppState.sortBy = 'recommended';
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) searchInput.value = '';
  const sortSelect = document.getElementById('menuSortSelect');
  if (sortSelect) sortSelect.value = 'recommended';

  const categoryButtons = document.querySelectorAll('.cat-tab-btn');
  categoryButtons.forEach(btn => {
    if (btn.dataset.category === 'all') {
      btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');
      btn.classList.remove('bg-white', 'text-slate-700');
    } else {
      btn.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
      btn.classList.add('bg-white', 'text-slate-700');
    }
  });

  renderMenu();
}

// --- CART LOGIC ---
function addItemToCart(itemId, selectedCustoms = []) {
  if (!AppState.currentUser) {
    showToast('Please login with your Student USN first!', 'warning');
    openStudentLoginModal();
    return;
  }

  const item = AppState.menuItems.find(i => i.id === itemId);
  if (!item) return;

  const customTotal = selectedCustoms.reduce((sum, c) => sum + c.price, 0);
  const effectivePrice = item.price + customTotal;

  const existing = AppState.cart.find(c => c.id === itemId && JSON.stringify(c.customizations) === JSON.stringify(selectedCustoms));

  if (existing) {
    existing.quantity += 1;
  } else {
    AppState.cart.push({
      id: item.id,
      name: item.name,
      basePrice: item.price,
      price: effectivePrice,
      isVeg: true,
      image: item.image,
      category: item.category,
      customizations: selectedCustoms,
      quantity: 1
    });
  }

  saveCart();
  renderMenu();
  updateCartUI();
  soundManager.playPop();
  triggerCartBounce();
  showToast(`Added ${item.name} to tray!`, 'info');
}

function addComboToCart(comboId) {
  if (!AppState.currentUser) {
    showToast('Please login with your Student USN first!', 'warning');
    openStudentLoginModal();
    return;
  }

  const combo = CAMPUS_COMBOS.find(c => c.id === comboId);
  if (!combo) return;

  const existing = AppState.cart.find(c => c.id === combo.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    AppState.cart.push({
      id: combo.id,
      name: combo.title,
      basePrice: combo.price,
      price: combo.price,
      isVeg: true,
      image: combo.image,
      category: 'combo',
      customizations: [{ name: combo.items, price: 0 }],
      quantity: 1
    });
  }

  saveCart();
  renderMenu();
  updateCartUI();
  soundManager.playPop();
  triggerCartBounce();
  showToast(`Added ${combo.title} to tray!`, 'success');
}

function incrementItem(itemId) {
  const item = AppState.cart.find(c => c.id === itemId);
  if (item) {
    item.quantity += 1;
    saveCart();
    renderMenu();
    updateCartUI();
    soundManager.playPop();
  }
}

function decrementItem(itemId) {
  const index = AppState.cart.findIndex(c => c.id === itemId);
  if (index !== -1) {
    if (AppState.cart[index].quantity > 1) {
      AppState.cart[index].quantity -= 1;
    } else {
      AppState.cart.splice(index, 1);
    }
    saveCart();
    renderMenu();
    updateCartUI();
    soundManager.playPop();
  }
}

function removeCartItem(index) {
  AppState.cart.splice(index, 1);
  saveCart();
  renderMenu();
  updateCartUI();
  soundManager.playPop();
}

function saveCart() {
  localStorage.setItem('kle_canteen_cart', JSON.stringify(AppState.cart));
}

function triggerCartBounce() {
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(b => {
    b.classList.remove('badge-bump');
    void b.offsetWidth;
    b.classList.add('badge-bump');
  });
}

function updateCartUI() {
  const totalCount = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = totalCount;
    b.style.display = totalCount > 0 ? 'flex' : 'none';
  });

  const mobileBar = document.getElementById('mobileCartBar');
  if (mobileBar) {
    if (totalCount > 0) {
      mobileBar.classList.remove('hidden');
      const mobileTotal = document.getElementById('mobileCartTotal');
      const mobileCount = document.getElementById('mobileCartCount');
      if (mobileTotal) mobileTotal.textContent = `₹${subtotal}`;
      if (mobileCount) mobileCount.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''}`;
    } else {
      mobileBar.classList.add('hidden');
    }
  }

  let discount = 0;
  if (AppState.appliedPromo) {
    if (AppState.appliedPromo.discountPercent) {
      discount = Math.min((subtotal * AppState.appliedPromo.discountPercent) / 100, AppState.appliedPromo.maxDiscount || 9999);
    } else if (AppState.appliedPromo.discountFlat && subtotal >= (AppState.appliedPromo.minSpend || 0)) {
      discount = AppState.appliedPromo.discountFlat;
    }
  }

  const grandTotal = Math.max(0, subtotal - discount);

  const container = document.getElementById('cartItemsContainer');
  const emptyState = document.getElementById('emptyCartState');
  const footer = document.getElementById('cartFooter');

  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    container.innerHTML = AppState.cart.map((item, idx) => `
      <div class="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover shrink-0">
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="veg-indicator scale-75"></span>
            <h4 class="text-sm font-bold text-slate-800 truncate">${item.name}</h4>
          </div>
          
          ${item.customizations && item.customizations.length > 0 ? `
            <p class="text-[11px] text-slate-500 truncate">
              + ${item.customizations.map(c => c.name).join(', ')}
            </p>
          ` : ''}

          <div class="flex items-center justify-between mt-2">
            <span class="text-sm font-bold text-slate-900">₹${item.price * item.quantity}</span>
            
            <div class="flex items-center bg-slate-100 rounded-xl p-0.5">
              <button onclick="decrementItem('${item.id}')" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-orange-600 qty-btn">
                <i data-lucide="minus" class="w-3 h-3"></i>
              </button>
              <span class="w-6 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
              <button onclick="incrementItem('${item.id}')" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-orange-600 qty-btn">
                <i data-lucide="plus" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
        </div>

        <button onclick="removeCartItem(${idx})" class="text-slate-300 hover:text-rose-500 p-1 transition" title="Remove item">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');

    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const totalEl = document.getElementById('cartTotal');
    const discountRow = document.getElementById('discountRow');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(0)}`;
    if (discountEl && discountRow) {
      if (discount > 0) {
        discountRow.classList.remove('hidden');
        discountEl.textContent = `-₹${discount.toFixed(0)}`;
      } else {
        discountRow.classList.add('hidden');
      }
    }
  }

  lucide.createIcons();
}

// --- CUSTOMIZE DISH MODAL ---
function openCustomizeModal(itemId) {
  const item = AppState.menuItems.find(i => i.id === itemId);
  if (!item) return;

  AppState.currentModalItem = item;
  const modal = document.getElementById('customizeModal');
  const title = document.getElementById('customModalTitle');
  const basePrice = document.getElementById('customModalBasePrice');
  const optionsList = document.getElementById('customOptionsList');

  if (title) title.textContent = item.name;
  if (basePrice) basePrice.textContent = `Base: ₹${item.price}`;

  if (optionsList && item.customizations) {
    optionsList.innerHTML = item.customizations.map((c, i) => `
      <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-orange-300 bg-white cursor-pointer transition">
        <div class="flex items-center gap-3">
          <input type="checkbox" name="customOption" value="${i}" class="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" onchange="updateCustomModalPrice()">
          <span class="text-sm font-semibold text-slate-800">${c.name}</span>
        </div>
        <span class="text-sm font-bold text-orange-600">${c.price > 0 ? `+₹${c.price}` : 'FREE'}</span>
      </label>
    `).join('');
  }

  updateCustomModalPrice();
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
}

function updateCustomModalPrice() {
  if (!AppState.currentModalItem) return;
  const checkboxes = document.querySelectorAll('input[name="customOption"]:checked');
  let extra = 0;
  checkboxes.forEach(cb => {
    const idx = parseInt(cb.value);
    extra += AppState.currentModalItem.customizations[idx].price;
  });
  const total = AppState.currentModalItem.price + extra;
  const btn = document.getElementById('addCustomizedBtn');
  if (btn) btn.textContent = `Add to Cart • ₹${total}`;
}

function confirmCustomization() {
  if (!AppState.currentModalItem) return;
  const checkboxes = document.querySelectorAll('input[name="customOption"]:checked');
  const selected = [];
  checkboxes.forEach(cb => {
    const idx = parseInt(cb.value);
    selected.push(AppState.currentModalItem.customizations[idx]);
  });

  addItemToCart(AppState.currentModalItem.id, selected);
  closeCustomizeModal();
}

function closeCustomizeModal() {
  const modal = document.getElementById('customizeModal');
  if (modal) modal.classList.add('hidden');
  AppState.currentModalItem = null;
}

// --- ORDER CHECKOUT & SYNCHRONIZED DISPATCH ---
function initiateCheckout() {
  if (!AppState.currentUser) {
    showToast('Please login with your Student USN first!', 'warning');
    openStudentLoginModal();
    return;
  }

  if (AppState.cart.length === 0) {
    showToast('Your tray is empty! Add items first.', 'warning');
    return;
  }

  const studentName = AppState.currentUser.name;
  const studentRoll = AppState.currentUser.usn;

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;
  if (AppState.appliedPromo) {
    if (AppState.appliedPromo.discountPercent) {
      discount = Math.min((subtotal * AppState.appliedPromo.discountPercent) / 100, AppState.appliedPromo.maxDiscount || 9999);
    } else if (AppState.appliedPromo.discountFlat && subtotal >= (AppState.appliedPromo.minSpend || 0)) {
      discount = AppState.appliedPromo.discountFlat;
    }
  }
  const totalAmount = Math.max(0, subtotal - discount);

  const tokenNumber = `#KLE-${Math.floor(100 + Math.random() * 900)}`;

  let pickupCounter = "Counter 1 (South Indian & Dosa)";
  let estMinutes = 6;
  const hasMeals = AppState.cart.some(i => i.category === 'meals');
  const hasFastFood = AppState.cart.some(i => i.category === 'fastfood');
  const hasSnacks = AppState.cart.some(i => i.category === 'snacks');
  const hasDrinks = AppState.cart.some(i => i.category === 'beverages');

  if (hasMeals) {
    pickupCounter = "Counter 2 (Hot Meals & Thalis)";
    estMinutes = 7;
  } else if (hasFastFood || hasSnacks) {
    pickupCounter = "Counter 3 (Maggi & Chaat Corner)";
    estMinutes = 8;
  } else if (hasDrinks && AppState.cart.length === 1) {
    pickupCounter = "Counter 4 (Kaapi & Drinks)";
    estMinutes = 3;
  }

  const orderId = `ord-${Date.now()}`;
  const orderData = {
    id: orderId,
    token: tokenNumber,
    usn: studentRoll,
    studentName: studentName,
    roll: studentRoll,
    branch: AppState.currentUser.branch,
    items: [...AppState.cart],
    subtotal: subtotal,
    discount: discount,
    total: totalAmount,
    counter: pickupCounter,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    prepMinutes: estMinutes,
    status: "pending", // 'pending' -> 'cooking' -> 'ready' -> 'completed'
    paymentMethod: "UPI / Campus Kiosk"
  };

  // Add to active token
  AppState.activeToken = orderData;
  localStorage.setItem('kle_active_token', JSON.stringify(orderData));

  // Add to Kitchen Orders (Instant Live Sync)
  AppState.kitchenOrders.unshift(orderData);
  saveKitchenOrders();
  if (typeof renderKitchenBoard === 'function') renderKitchenBoard();

  // Sync with Full Stack SQLite Backend & Supabase
  if (typeof SupabaseService !== 'undefined') {
    SupabaseService.createOrder(orderData);
  } else {
    API.createOrder(orderData);
  }

  // Reset cart
  AppState.cart = [];
  saveCart();
  updateCartUI();
  renderMenu();
  updateStudentAuthUI();

  // Close Cart Drawer
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  if (cartDrawer) cartDrawer.classList.add('translate-x-full');
  if (cartBackdrop) cartBackdrop.classList.add('hidden');

  soundManager.playSuccess();
  launchConfetti();
  showTokenModal(orderData);
  showToast(`Token ${orderData.token} created & dispatched to kitchen!`, 'success');
}

function showTokenModal(order) {
  const modal = document.getElementById('orderConfirmationModal');
  if (!modal) return;

  document.getElementById('tokenDisplayNumber').textContent = order.token;
  document.getElementById('tokenStudentName').textContent = order.studentName || order.name;
  document.getElementById('tokenStudentRoll').textContent = order.usn || order.roll;
  document.getElementById('tokenCounter').textContent = order.counter;
  document.getElementById('tokenTime').textContent = `${order.date || ''} • ${order.timestamp}`;
  document.getElementById('tokenTotalAmount').textContent = `₹${order.total}`;

  const itemsContainer = document.getElementById('tokenReceiptItems');
  if (itemsContainer) {
    itemsContainer.innerHTML = order.items.map(item => `
      <div class="flex justify-between text-xs py-1 border-b border-dashed border-slate-200">
        <span class="text-slate-700">${item.quantity}x ${item.name}</span>
        <span class="font-bold text-slate-900">₹${item.price * item.quantity}</span>
      </div>
    `).join('');
  }

  startCountdown(order.prepMinutes || 6);
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeTokenModal() {
  const modal = document.getElementById('orderConfirmationModal');
  if (modal) modal.classList.add('hidden');
}

let timerInterval = null;
function startCountdown(minutes) {
  if (timerInterval) clearInterval(timerInterval);
  let totalSeconds = minutes * 60;
  const timerEl = document.getElementById('tokenCountdownTimer');
  
  function updateTimer() {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (totalSeconds <= 0) {
      clearInterval(timerInterval);
      if (timerEl) timerEl.textContent = "READY FOR PICKUP!";
    } else {
      totalSeconds--;
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function checkExistingToken() {
  const badge = document.getElementById('activeTokenBadge');
  if (!badge) return;

  if (AppState.activeToken) {
    badge.classList.remove('hidden');
    const tokenSpan = document.getElementById('activeTokenNumber');
    if (tokenSpan) tokenSpan.textContent = AppState.activeToken.token;
  } else {
    badge.classList.add('hidden');
  }
}

function reopenActiveTokenModal() {
  if (AppState.activeToken) {
    showTokenModal(AppState.activeToken);
    soundManager.playPop();
  }
}

function lookupTokenStatus(tokenNum) {
  const resultDiv = document.getElementById('tokenLookupResult');
  if (!resultDiv) return;

  const foundOrder = AppState.kitchenOrders.find(o => o.token === tokenNum);

  if (foundOrder) {
    let statusClass = "bg-amber-50 border-amber-200 text-amber-900";
    let icon = "clock";
    let statusMsg = `In Kitchen Queue (${foundOrder.counter})`;

    if (foundOrder.status === 'cooking') {
      statusClass = "bg-amber-50 border-amber-300 text-amber-900";
      icon = "flame";
      statusMsg = "Currently Cooking on Chef's Grill / Tawa 🔥";
    } else if (foundOrder.status === 'ready') {
      statusClass = "bg-emerald-50 border-emerald-300 text-emerald-900";
      icon = "bell-ring";
      statusMsg = "READY FOR PICKUP! 🔔 Please collect at counter.";
    } else if (foundOrder.status === 'completed') {
      statusClass = "bg-slate-50 border-slate-200 text-slate-800";
      icon = "check-circle-2";
      statusMsg = "Completed & Handed Over";
    }

    resultDiv.classList.remove('hidden');
    resultDiv.className = `mt-4 p-4 rounded-2xl border text-sm ${statusClass}`;
    resultDiv.innerHTML = `
      <div class="flex items-center gap-2 font-black mb-1">
        <i data-lucide="${icon}" class="w-4 h-4"></i>
        <span>Token ${tokenNum} Status: ${statusMsg}</span>
      </div>
      <p class="text-xs mt-1">Student: <strong>${foundOrder.studentName}</strong> (${foundOrder.usn})</p>
      <p class="text-xs">Assigned Pickup: <strong>${foundOrder.counter}</strong></p>
      <button onclick="reopenActiveTokenModal()" class="mt-2 text-xs font-bold underline">View Token QR Slip</button>
    `;
  } else {
    resultDiv.classList.remove('hidden');
    resultDiv.className = "mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm";
    resultDiv.innerHTML = `
      <div class="flex items-center gap-2 font-bold mb-1">
        <i data-lucide="info" class="w-4 h-4"></i>
        <span>Token ${tokenNum} Not Found</span>
      </div>
      <p class="text-xs text-slate-500">Please verify the token number or order from the menu.</p>
    `;
  }
  lucide.createIcons();
}

function printTokenReceipt() {
  window.print();
}

// --- CONFETTI ANIMATION ---
function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#f59e0b', '#10b981', '#ffffff']
    });
  }
}

// --- STUDENT REVIEWS ---
function renderReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  container.innerHTML = AppState.reviews.map(rev => `
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between card-hover">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img src="${rev.avatar}" alt="${rev.name}" class="w-11 h-11 rounded-full object-cover border-2 border-orange-200" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'">
            <div>
              <h4 class="text-sm font-bold text-slate-900">${rev.name}</h4>
              <p class="text-[11px] text-slate-500 font-medium">${rev.role}</p>
            </div>
          </div>
          <span class="text-[11px] text-slate-400 font-medium">${rev.date}</span>
        </div>

        <div class="flex items-center gap-1 mb-3">
          ${Array(rev.rating).fill(0).map(() => `
            <i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>
          `).join('')}
        </div>

        <p class="text-xs text-slate-600 leading-relaxed italic">
          "${rev.comment}"
        </p>
      </div>

      <div class="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <i data-lucide="badge-check" class="w-3.5 h-3.5"></i>
        <span>Verified KLE Student</span>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function openAddReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.remove('hidden');
  soundManager.playPop();
}

function closeAddReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.add('hidden');
}

function handleReviewSubmit() {
  const name = document.getElementById('revName').value.trim();
  const role = document.getElementById('revBranch').value.trim();
  const rating = parseInt(document.getElementById('revRating').value);
  const comment = document.getElementById('revComment').value.trim();

  if (!name || !role || !comment) {
    showToast('Please fill out all fields!', 'warning');
    return;
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    name: name,
    role: role,
    rating: rating || 5,
    date: 'Just now',
    comment: comment,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
  };

  AppState.reviews.unshift(newReview);
  localStorage.setItem('kle_user_reviews', JSON.stringify(AppState.reviews));

  renderReviews();
  closeAddReviewModal();
  showToast('Thanks for your review! It is now live on campus.', 'success');
  soundManager.playSuccess();
  document.getElementById('addReviewForm').reset();
}

// --- TOAST NOTIFICATIONS & LIVE ACTIVITY ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  let bg = 'bg-slate-900 text-white';
  let icon = 'info';

  if (type === 'success') {
    bg = 'bg-emerald-600 text-white';
    icon = 'check-circle';
  } else if (type === 'warning') {
    bg = 'bg-amber-600 text-white';
    icon = 'alert-triangle';
  } else if (type === 'error') {
    bg = 'bg-rose-600 text-white';
    icon = 'x-circle';
  }

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl ${bg} text-xs font-semibold transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setupCampusActivityToasts() {
  const campusEvents = [
    "⚡ Counter 1: Steaming hot Mysore Masala Dosas ready!",
    "🎓 Sneha (ECE) just collected 2 Filter Kaapis",
    "🔥 Counter 3: Fresh Cheese Tadka Maggi dispatched",
    "☕ Over 380+ cups of Filter Coffee served today!",
    "🥟 Counter 1: Fresh batch of Crispy Medu Vadas out of the fryer"
  ];

  let eventIdx = 0;
  setInterval(() => {
    if (!document.hidden && Math.random() > 0.5 && AppState.currentPortal === 'student') {
      showToast(campusEvents[eventIdx % campusEvents.length], 'info');
      eventIdx++;
    }
  }, 26000);
}
