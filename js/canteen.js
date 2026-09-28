/**
 * KLE CANTEEN - CANTEEN KITCHEN & MANAGEMENT PORTAL SCRIPT
 * Dedicated to Canteen Staff, Chefs & Management
 * College: KLE Society's College of BCA, Gokak
 * Powered by Supabase Backend Database + Realtime Sync
 */

const CanteenState = {
  orders: [],
  menuItems: [],
  counters: typeof COUNTER_STATUSES !== 'undefined' ? [...COUNTER_STATUSES] : [],
  soldOutItems: JSON.parse(localStorage.getItem('kle_soldout_items')) || [],
  isUnlocked: sessionStorage.getItem('kle_staff_unlocked') === 'true',
  soundEnabled: true
};

// Staff Passcode / PIN validation
const VALID_STAFF_PINS = ['1916', '7788', 'KLE@GOKAK', '1234'];

// Audio Synthesizer
class CanteenSoundController {
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
  playKitchenBell() {
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
    } catch (e) {}
  }
}

const soundManager = new CanteenSoundController();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  checkStaffGate();
  await loadCanteenData();
  setupCanteenWebSocket();

  // Setup Supabase Realtime Listeners
  if (typeof SupabaseService !== 'undefined') {
    SupabaseService.setupRealtimeListeners({
      onMenuChange: async () => {
        console.log('⚡ Supabase Realtime: Menu changed, refreshing...');
        CanteenState.menuItems = await SupabaseService.getMenu();
        renderCanteenMenuManager();
        renderKitchenStockManager();
        showToast('Live Menu updated from Supabase!', 'info');
      },
      onOrderChange: async () => {
        console.log('⚡ Supabase Realtime: Orders changed, refreshing...');
        CanteenState.orders = await SupabaseService.getOrders();
        renderKitchenBoard();
        soundManager.playKitchenBell();
        showToast('Live Kitchen Orders updated!', 'info');
      }
    });
  }

  if (window.lucide) lucide.createIcons();
});

// Staff Authentication Gate
function checkStaffGate() {
  const pinModal = document.getElementById('staffPinModal');
  if (!CanteenState.isUnlocked) {
    if (pinModal) pinModal.classList.remove('hidden');
  } else {
    if (pinModal) pinModal.classList.add('hidden');
  }
}

function handleStaffPinSubmit(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('staffPinInput');
  const enteredPin = pinInput ? pinInput.value.trim() : '';

  if (VALID_STAFF_PINS.includes(enteredPin) || enteredPin === '1916') {
    CanteenState.isUnlocked = true;
    sessionStorage.setItem('kle_staff_unlocked', 'true');
    const pinModal = document.getElementById('staffPinModal');
    if (pinModal) pinModal.classList.add('hidden');
    soundManager.playKitchenBell();
    showToast('Staff Access Granted. Welcome, Chef!', 'success');
  } else {
    showToast('Invalid Staff Passcode! Try default PIN: 1916', 'error');
  }
}

function lockStaffPortal() {
  CanteenState.isUnlocked = false;
  sessionStorage.removeItem('kle_staff_unlocked');
  checkStaffGate();
  showToast('Canteen Portal locked.', 'info');
}

// Load data from Supabase / API
async function loadCanteenData() {
  try {
    if (typeof SupabaseService !== 'undefined') {
      CanteenState.menuItems = await SupabaseService.getMenu();
      CanteenState.orders = await SupabaseService.getOrders();
    } else {
      CanteenState.menuItems = JSON.parse(localStorage.getItem('kle_custom_menu')) || MENU_ITEMS;
      CanteenState.orders = JSON.parse(localStorage.getItem('kle_kitchen_orders')) || SEED_KITCHEN_ORDERS;
    }
  } catch (e) {
    CanteenState.menuItems = JSON.parse(localStorage.getItem('kle_custom_menu')) || MENU_ITEMS;
    CanteenState.orders = JSON.parse(localStorage.getItem('kle_kitchen_orders')) || SEED_KITCHEN_ORDERS;
  }

  renderKitchenBoard();
  renderKitchenCounters();
  renderKitchenStockManager();
  renderCanteenMenuManager();
}

// WebSocket connection for local full stack fallback
function setupCanteenWebSocket() {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ORDER_CREATED') {
          CanteenState.orders.unshift(msg.payload);
          renderKitchenBoard();
          soundManager.playKitchenBell();
          showToast(`🔔 New Student Order: ${msg.payload.token} (${msg.payload.studentName})`, 'success');
        } else if (msg.type === 'MENU_UPDATED') {
          loadCanteenData();
        }
      } catch (e) {}
    };
  } catch (e) {}
}

// --- RENDER KITCHEN BOARD (KDS KANBAN) ---
function renderKitchenBoard() {
  const pendingCol = document.getElementById('kdsColPending');
  const cookingCol = document.getElementById('kdsColCooking');
  const readyCol = document.getElementById('kdsColReady');
  const completedCol = document.getElementById('kdsColCompleted');

  if (!pendingCol) return;

  const pending = CanteenState.orders.filter(o => o.status === 'pending');
  const cooking = CanteenState.orders.filter(o => o.status === 'cooking');
  const ready = CanteenState.orders.filter(o => o.status === 'ready');
  const completed = CanteenState.orders.filter(o => o.status === 'completed');

  // Update counts
  const updateBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };
  updateBadge('colCountPending', pending.length);
  updateBadge('colCountCooking', cooking.length);
  updateBadge('colCountReady', ready.length);
  updateBadge('colCountCompleted', completed.length);

  updateBadge('metricPendingCount', pending.length);
  updateBadge('metricCookingCount', cooking.length);
  updateBadge('metricReadyCount', ready.length);

  const totalRevenue = CanteenState.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const revEl = document.getElementById('metricTotalRevenue');
  if (revEl) revEl.textContent = `₹${totalRevenue}`;

  const liveBadge = document.getElementById('kitchenTotalLiveOrdersBadge');
  if (liveBadge) liveBadge.textContent = `${pending.length + cooking.length + ready.length} Live Orders`;

  pendingCol.innerHTML = renderKdsCards(pending, 'pending');
  cookingCol.innerHTML = renderKdsCards(cooking, 'cooking');
  readyCol.innerHTML = renderKdsCards(ready, 'ready');
  completedCol.innerHTML = renderKdsCards(completed, 'completed');

  if (window.lucide) lucide.createIcons();
}

function renderKdsCards(orders, statusType) {
  if (orders.length === 0) {
    return `
      <div class="py-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
        No orders in this stage
      </div>
    `;
  }

  return orders.map(order => {
    let actionBtnHtml = '';
    let borderClass = 'border-slate-200';

    if (statusType === 'pending') {
      borderClass = 'border-l-4 border-l-orange-500';
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'cooking')" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="flame" class="w-3.5 h-3.5"></i>
          <span>Start Cooking 🔥</span>
        </button>
      `;
    } else if (statusType === 'cooking') {
      borderClass = 'border-l-4 border-l-amber-500';
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'ready')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
          <span>Mark Ready 🔔</span>
        </button>
      `;
    } else if (statusType === 'ready') {
      borderClass = 'border-l-4 border-l-emerald-500';
      actionBtnHtml = `
        <button onclick="updateOrderStatus('${order.id}', 'completed')" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5 active:scale-95">
          <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
          <span>Hand Over & Complete ✅</span>
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
      <div class="bg-white p-4 rounded-2xl border ${borderClass} shadow-sm space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-base font-black text-slate-900 tracking-tight">${order.token}</span>
            <div class="text-[11px] font-bold text-slate-600 mt-0.5">
              ${order.studentName || 'Student'} <span class="text-slate-400">(${order.usn || 'Campus'})</span>
            </div>
          </div>
          <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
            ${order.timestamp || 'Just now'}
          </span>
        </div>

        <div class="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
          ${(order.items || []).map(item => `
            <div class="flex justify-between items-center text-slate-700">
              <span class="font-bold">${item.quantity}x ${item.name}</span>
              <span class="text-slate-500 text-[11px]">₹${item.price * item.quantity}</span>
            </div>
          `).join('')}
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span class="truncate max-w-[140px] font-semibold">${order.counter || 'Counter 1'}</span>
          <span class="font-black text-slate-900 text-xs">₹${order.total}</span>
        </div>

        <div class="pt-1">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, nextStatus) {
  const order = CanteenState.orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = nextStatus;
  localStorage.setItem('kle_kitchen_orders', JSON.stringify(CanteenState.orders));
  renderKitchenBoard();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.updateOrderStatus(orderId, nextStatus);
  }

  if (nextStatus === 'cooking') {
    soundManager.playPop();
    showToast(`Order ${order.token} marked as COOKING 🔥`, 'warning');
  } else if (nextStatus === 'ready') {
    soundManager.playKitchenBell();
    showToast(`🔔 Token ${order.token} marked READY FOR PICKUP at ${order.counter}!`, 'success');
  } else if (nextStatus === 'completed') {
    soundManager.playPop();
    showToast(`Order ${order.token} handed over! ✅`, 'info');
  }
}

// --- CHEF COUNTER CONTROLS ---
function renderKitchenCounters() {
  const container = document.getElementById('kitchenCountersGrid');
  if (!container) return;

  container.innerHTML = CanteenState.counters.map((counter, idx) => `
    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">${counter.counterNumber || `Counter ${idx + 1}`}</span>
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

  if (window.lucide) lucide.createIcons();
}

function updateCounterRush(idx, rush) {
  CanteenState.counters[idx].rushLevel = rush;
  showToast(`${CanteenState.counters[idx].counterNumber || 'Counter'} rush updated to ${rush}`, 'info');
}

function adjustCounterWait(idx, delta) {
  CanteenState.counters[idx].waitMins = Math.max(1, CanteenState.counters[idx].waitMins + delta);
  renderKitchenCounters();
  showToast(`Wait time set to ${CanteenState.counters[idx].waitMins} mins`, 'info');
}

// --- CHEF MENU STOCK CONTROLS ---
function renderKitchenStockManager() {
  const container = document.getElementById('kitchenStockGrid');
  if (!container) return;

  const coreDishes = CanteenState.menuItems.slice(0, 10);
  container.innerHTML = coreDishes.map(dish => {
    const isSoldOut = !dish.inStock || CanteenState.soldOutItems.includes(dish.id);
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

async function toggleItemStock(dishId) {
  const dish = CanteenState.menuItems.find(d => d.id === dishId);
  if (!dish) return;

  dish.inStock = !dish.inStock;

  if (dish.inStock) {
    CanteenState.soldOutItems = CanteenState.soldOutItems.filter(id => id !== dishId);
  } else {
    if (!CanteenState.soldOutItems.includes(dishId)) CanteenState.soldOutItems.push(dishId);
  }

  localStorage.setItem('kle_soldout_items', JSON.stringify(CanteenState.soldOutItems));
  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));

  renderKitchenStockManager();
  renderCanteenMenuManager();
  soundManager.playPop();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.toggleStock(dishId, dish.inStock);
  }

  showToast(`Stock updated for ${dish.name}`, 'info');
}

// --- CANTEEN MENU & PRICE INVENTORY MANAGER ---
function renderCanteenMenuManager() {
  const container = document.getElementById('canteenItemsManageGrid');
  const countBadge = document.getElementById('canteenManagerCount');
  if (!container) return;

  const searchInput = document.getElementById('canteenManagerSearch');
  const catInput = document.getElementById('canteenManagerCategory');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedCat = catInput ? catInput.value : 'all';

  let items = [...CanteenState.menuItems];

  if (selectedCat !== 'all') {
    items = items.filter(i => i.category === selectedCat);
  }

  if (query) {
    items = items.filter(i => 
      i.name.toLowerCase().includes(query) ||
      (i.description && i.description.toLowerCase().includes(query)) ||
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
        <h4 class="text-base font-bold text-slate-800 mb-1">No items found matching filter</h4>
        <p class="text-xs text-slate-500 mb-4">Try clearing your search or add a new food item.</p>
        <button onclick="openAddItemModal()" class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition">
          + Add New Food Item
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(dish => {
    const isSoldOut = !dish.inStock || CanteenState.soldOutItems.includes(dish.id);
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

          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span class="w-3.5 h-3.5 rounded bg-emerald-600 border border-white flex items-center justify-center p-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
              ${categoryName}
            </span>
          </div>

          <div class="absolute top-2.5 right-2.5">
            <button 
              onclick="toggleItemStock('${dish.id}')"
              class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${isSoldOut ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}"
              title="Click to toggle In Stock / Sold Out"
            >
              ${isSoldOut ? '● Sold Out' : '● In Stock'}
            </button>
          </div>

          <div class="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-medium">
            <span class="truncate max-w-[130px] font-bold text-amber-300">
              ${dish.badge || 'Pure Veg'}
            </span>
            <span class="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px]">
              <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
              ${dish.prepTime || '5 mins'}
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

  if (window.lucide) lucide.createIcons();
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

async function handleCreateItem(e) {
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

  const categoryImages = {
    breakfast: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    meals: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    fastfood: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80',
    snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    beverages: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    desserts: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
  };

  if (!image) {
    image = categoryImages[category] || categoryImages.snacks;
  }

  const newItem = {
    id: `dish-${Date.now()}`,
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
    counter: "Counter 1 (Main Food Counter)"
  };

  CanteenState.menuItems.unshift(newItem);
  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));
  renderCanteenMenuManager();
  renderKitchenStockManager();
  closeAddItemModal();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.addMenuItem(newItem);
  }

  showToast(`✨ Added "${name}" at ₹${newItem.price} to KLE Canteen Menu!`, 'success');
  soundManager.playKitchenBell();
}

function openEditItemModal(dishId) {
  const dish = CanteenState.menuItems.find(i => i.id === dishId);
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

async function handleSaveEditItem(e) {
  e.preventDefault();

  const dishId = document.getElementById('editItemIdInput').value;
  const dish = CanteenState.menuItems.find(i => i.id === dishId);
  if (!dish) return;

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

  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));
  renderCanteenMenuManager();
  renderKitchenStockManager();
  closeEditItemModal();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.updateMenuItem(dishId, dish);
  }

  showToast(`✅ Updated "${dish.name}" (₹${dish.price})!`, 'success');
  soundManager.playKitchenBell();
}

async function handleDeleteItem(dishId) {
  const dish = CanteenState.menuItems.find(i => i.id === dishId);
  if (!dish) return;

  const confirmed = confirm(`Are you sure you want to remove "${dish.name}" from the KLE Canteen menu?\n\nThis will immediately remove it from the Student Portal as well.`);
  if (!confirmed) return;

  CanteenState.menuItems = CanteenState.menuItems.filter(i => i.id !== dishId);
  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));

  renderCanteenMenuManager();
  renderKitchenStockManager();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.deleteMenuItem(dishId);
  }

  showToast(`🗑️ Removed "${dish.name}" from menu.`, 'info');
  soundManager.playPop();
}

async function quickAdjustPrice(dishId, delta) {
  const dish = CanteenState.menuItems.find(i => i.id === dishId);
  if (!dish) return;

  const updatedPrice = Math.max(5, dish.price + delta);
  dish.price = updatedPrice;

  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));
  renderCanteenMenuManager();
  soundManager.playPop();

  if (typeof SupabaseService !== 'undefined') {
    await SupabaseService.updateMenuItem(dishId, { price: updatedPrice });
  }

  showToast(`Price for "${dish.name}" set to ₹${dish.price}`, 'info');
}

async function restoreDefaultMenu() {
  const confirmed = confirm('Reset all items back to default KLE Gokak Pure Veg menu? Any custom items added will be reset.');
  if (!confirmed) return;

  CanteenState.menuItems = typeof MENU_ITEMS !== 'undefined' ? JSON.parse(JSON.stringify(MENU_ITEMS)) : [];
  localStorage.setItem('kle_custom_menu', JSON.stringify(CanteenState.menuItems));
  renderCanteenMenuManager();
  renderKitchenStockManager();

  if (typeof SupabaseService !== 'undefined') {
    try {
      await fetch('/api/menu/reset', { method: 'POST' });
    } catch (e) {}
  }

  showToast('Menu reset to default KLE Gokak Canteen pure veg items!', 'info');
  soundManager.playKitchenBell();
}

function simulateIncomingOrder() {
  const students = typeof REGISTERED_STUDENTS !== 'undefined' ? REGISTERED_STUDENTS : [
    { name: "Rahul Patil", usn: "U15GK22BCA018", branch: "BCA" }
  ];
  const randomStudent = students[Math.floor(Math.random() * students.length)];
  const dishes = CanteenState.menuItems.length > 0 ? CanteenState.menuItems : [{ name: "Mysore Masala Dosa", price: 65 }];
  const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
  const tokenNum = `#KLE-${Math.floor(150 + Math.random() * 800)}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder = {
    id: orderId,
    token: tokenNum,
    usn: randomStudent.usn,
    studentName: randomStudent.name,
    branch: randomStudent.branch,
    counter: "Counter 1 (South Indian & Dosa)",
    status: "pending",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      { name: randomDish.name, quantity: 1, price: randomDish.price }
    ],
    subtotal: randomDish.price,
    discount: 0,
    total: randomDish.price,
    paymentMethod: "UPI (Google Pay)"
  };

  CanteenState.orders.unshift(newOrder);
  localStorage.setItem('kle_kitchen_orders', JSON.stringify(CanteenState.orders));
  renderKitchenBoard();
  soundManager.playKitchenBell();

  if (typeof SupabaseService !== 'undefined') {
    SupabaseService.createOrder(newOrder);
  }

  showToast(`📥 New Student Order: ${newOrder.token} (${newOrder.studentName})`, 'success');
}

// Toast Notifications
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
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
