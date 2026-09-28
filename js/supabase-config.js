/**
 * KLE CANTEEN - SUPABASE CONFIGURATION & SERVICE LAYER
 * Seamlessly integrates Supabase PostgreSQL Database with Realtime replication
 * Supports Live Supabase Cloud Connection + Instant Local Fallback
 */

const SUPABASE_DEFAULT = {
  url: localStorage.getItem('kle_supabase_url') || 'https://mxvshngbumpdqqgaulbd.supabase.co',
  anonKey: localStorage.getItem('kle_supabase_anon_key') || ''
};

let supabaseClient = null;

function isSupabaseConfigured() {
  const url = localStorage.getItem('kle_supabase_url');
  const key = localStorage.getItem('kle_supabase_anon_key');
  return !!(url && key && url.includes('supabase.co'));
}

function initSupabase() {
  if (isSupabaseConfigured() && window.supabase) {
    try {
      const url = localStorage.getItem('kle_supabase_url');
      const key = localStorage.getItem('kle_supabase_anon_key');
      supabaseClient = window.supabase.createClient(url, key);
      console.log('⚡ Connected to Supabase Cloud Project:', url);
      updateSupabaseBadge(true, 'Supabase Cloud Live');
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      updateSupabaseBadge(false, 'Local Database Mode');
      return null;
    }
  } else {
    updateSupabaseBadge(false, 'Local Database Mode');
    return null;
  }
}

function updateSupabaseBadge(isCloud, label) {
  const badge = document.getElementById('supabaseStatusBadge');
  const text = document.getElementById('supabaseStatusText');
  const dot = document.getElementById('supabaseStatusDot');
  if (!badge || !text) return;

  if (isCloud) {
    badge.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-100 transition";
    if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
    text.textContent = label || "Supabase Connected";
  } else {
    badge.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm cursor-pointer hover:bg-amber-100 transition";
    if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-500";
    text.textContent = label || "Connect Supabase";
  }
}

// Unified Supabase Data Service
const SupabaseService = {
  // --- MENU ITEMS ---
  async getMenu() {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category,
            price: Number(d.price),
            rating: Number(d.rating),
            reviewsCount: Number(d.reviews_count),
            prepTime: d.prep_time,
            calories: d.calories,
            isVeg: Boolean(d.is_veg),
            isSpicy: Boolean(d.is_spicy),
            badge: d.badge,
            description: d.description,
            image: d.image,
            counter: d.counter,
            inStock: Boolean(d.in_stock),
            customizations: d.customizations || []
          }));
        }
      } catch (e) {
        console.warn('Supabase getMenu error, falling back:', e);
      }
    }

    // Fallback to local server API / localStorage
    try {
      const res = await fetch('/api/menu');
      if (res.ok) return await res.json();
    } catch (e) {}

    return JSON.parse(localStorage.getItem('kle_custom_menu')) || MENU_ITEMS;
  },

  async addMenuItem(item) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const payload = {
          id: item.id || `dish-${Date.now()}`,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          rating: item.rating || 4.8,
          reviews_count: item.reviewsCount || 1,
          prep_time: item.prepTime || '5-10 mins',
          calories: item.calories || '250 kcal',
          is_veg: true,
          badge: item.badge || 'Campus Fresh',
          description: item.description || '',
          image: item.image || '',
          counter: item.counter || 'Counter 1 (Main Food Counter)',
          in_stock: true,
          customizations: item.customizations || []
        };
        const { data, error } = await supabaseClient.from('menu_items').insert([payload]).select().single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase addMenuItem error:', e);
      }
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return item;
  },

  async updateMenuItem(id, updates) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const payload = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.price !== undefined) payload.price = Number(updates.price);
        if (updates.prepTime !== undefined) payload.prep_time = updates.prepTime;
        if (updates.calories !== undefined) payload.calories = updates.calories;
        if (updates.badge !== undefined) payload.badge = updates.badge;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.image !== undefined) payload.image = updates.image;
        if (updates.inStock !== undefined) payload.in_stock = Boolean(updates.inStock);

        const { data, error } = await supabaseClient
          .from('menu_items')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase updateMenuItem error:', e);
      }
    }

    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return null;
  },

  async deleteMenuItem(id) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase deleteMenuItem error:', e);
      }
    }

    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (e) {}

    return true;
  },

  async toggleStock(id, newStockStatus) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('menu_items')
          .update({ in_stock: newStockStatus })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase toggleStock error:', e);
      }
    }

    try {
      const res = await fetch(`/api/menu/${id}/stock`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch (e) {}

    return null;
  },

  // --- ORDERS ---
  async getOrders() {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(o => ({
            id: o.id,
            token: o.token,
            usn: o.usn,
            studentName: o.student_name,
            branch: o.branch,
            counter: o.counter,
            status: o.status,
            timestamp: o.timestamp,
            prepMinutes: Number(o.prep_minutes),
            items: o.items || [],
            subtotal: Number(o.subtotal),
            discount: Number(o.discount),
            total: Number(o.total),
            paymentMethod: o.payment_method,
            createdAt: o.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getOrders error:', e);
      }
    }

    try {
      const res = await fetch('/api/orders');
      if (res.ok) return await res.json();
    } catch (e) {}

    return JSON.parse(localStorage.getItem('kle_kitchen_orders')) || SEED_KITCHEN_ORDERS;
  },

  async createOrder(order) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const payload = {
          id: order.id,
          token: order.token,
          usn: order.usn,
          student_name: order.studentName,
          branch: order.branch,
          counter: order.counter,
          status: order.status || 'pending',
          timestamp: order.timestamp,
          prep_minutes: order.prepMinutes || 5,
          items: order.items || [],
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          total: Number(order.total),
          payment_method: order.paymentMethod || 'UPI'
        };
        const { data, error } = await supabaseClient.from('orders').insert([payload]).select().single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase createOrder error:', e);
      }
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return order;
  },

  async updateOrderStatus(orderId, status) {
    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .update({ status: status })
          .eq('id', orderId)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase updateOrderStatus error:', e);
      }
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return null;
  },

  // --- STUDENT AUTHENTICATION ---
  async loginStudent(usn, dob) {
    const normalizedUsn = usn.trim().toUpperCase();
    const normalizedDob = dob.trim();

    if (isSupabaseConfigured() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .ilike('usn', normalizedUsn)
          .eq('dob', normalizedDob)
          .single();

        if (!error && data) {
          return { success: true, user: data };
        }
      } catch (e) {
        console.warn('Supabase login error:', e);
      }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usn: normalizedUsn, dob: normalizedDob })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Local fallback check
    const matched = REGISTERED_STUDENTS.find(s => s.usn.toUpperCase() === normalizedUsn && s.dob === normalizedDob);
    if (matched) return { success: true, user: matched };

    // Auto-create profile for testing
    return {
      success: true,
      user: {
        usn: normalizedUsn,
        dob: normalizedDob,
        name: `Student (${normalizedUsn})`,
        branch: 'KLE Gokak Campus Student',
        semester: 'Current',
        phone: 'Campus Card'
      }
    };
  },

  // --- REALTIME SUBSCRIPTION (Supabase Realtime Channel) ---
  setupRealtimeListeners(callbacks = {}) {
    if (!isSupabaseConfigured() || !supabaseClient) return null;

    try {
      const channel = supabaseClient
        .channel('kle-canteen-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, payload => {
          console.log('⚡ Supabase Realtime: menu_items change received:', payload);
          if (callbacks.onMenuChange) callbacks.onMenuChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
          console.log('⚡ Supabase Realtime: orders change received:', payload);
          if (callbacks.onOrderChange) callbacks.onOrderChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, payload => {
          console.log('⚡ Supabase Realtime: counters change received:', payload);
          if (callbacks.onCounterChange) callbacks.onCounterChange(payload);
        })
        .subscribe((status) => {
          console.log('⚡ Supabase Channel Subscription Status:', status);
        });

      return channel;
    } catch (e) {
      console.warn('Failed to setup Supabase Realtime listeners:', e);
      return null;
    }
  }
};

// UI modal to connect Supabase
function openSupabaseModal() {
  let modal = document.getElementById('supabaseConfigModal');
  if (!modal) {
    createSupabaseModalDOM();
    modal = document.getElementById('supabaseConfigModal');
  }
  const urlInput = document.getElementById('inputSupabaseUrl');
  const keyInput = document.getElementById('inputSupabaseKey');
  if (urlInput) urlInput.value = localStorage.getItem('kle_supabase_url') || 'https://mxvshngbumpdqqgaulbd.supabase.co';
  if (keyInput) keyInput.value = localStorage.getItem('kle_supabase_anon_key') || '';
  if (modal) modal.classList.remove('hidden');
}

function closeSupabaseModal() {
  const modal = document.getElementById('supabaseConfigModal');
  if (modal) modal.classList.add('hidden');
}

function saveSupabaseConfig(e) {
  if (e) e.preventDefault();
  const url = document.getElementById('inputSupabaseUrl').value.trim();
  const key = document.getElementById('inputSupabaseKey').value.trim();

  if (url && key) {
    localStorage.setItem('kle_supabase_url', url);
    localStorage.setItem('kle_supabase_anon_key', key);
    initSupabase();
    closeSupabaseModal();
    if (typeof showToast === 'function') {
      showToast('⚡ Connected to Supabase Project! Reloading data...', 'success');
    }
    setTimeout(() => window.location.reload(), 1200);
  } else {
    // Clear config
    localStorage.removeItem('kle_supabase_url');
    localStorage.removeItem('kle_supabase_anon_key');
    initSupabase();
    closeSupabaseModal();
    if (typeof showToast === 'function') {
      showToast('Switched to Local Database Mode.', 'info');
    }
  }
}

function createSupabaseModalDOM() {
  const div = document.createElement('div');
  div.id = 'supabaseConfigModal';
  div.className = 'fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden';
  div.innerHTML = `
    <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 relative">
      <button onclick="closeSupabaseModal()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
          <i data-lucide="database" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="font-heading font-black text-lg text-slate-900">Supabase Backend Database</h3>
          <p class="text-xs text-slate-500">Connect to your Supabase project in 1 step</p>
        </div>
      </div>

      <p class="text-xs text-slate-600 leading-relaxed mb-4">
        Paste your Supabase Project URL & Anon Public Key. The schema file <code class="px-1 py-0.5 bg-slate-100 font-mono text-emerald-700 font-bold rounded">supabase-schema.sql</code> is ready in the project folder to run in your Supabase SQL Editor.
      </p>

      <form onsubmit="saveSupabaseConfig(event)" class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
          <input type="url" id="inputSupabaseUrl" placeholder="https://xyzcompany.supabase.co" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Public Key</label>
          <input type="password" id="inputSupabaseKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white">
        </div>

        <div class="pt-2 flex gap-2.5">
          <button type="button" onclick="closeSupabaseModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition active:scale-95">
            Save & Connect Supabase
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

// Auto init on script load
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
