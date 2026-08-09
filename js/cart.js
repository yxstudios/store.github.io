import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabaseClient = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = 'https://yxstore.linkpc.net';
var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
var appliedDiscount = 0;
var currentPromoCode = null;
var promoCodes = { 'WELCOME10': 0.10, 'ROBLOX20': 0.20, 'VIP50': 0.50 };
var ROBUX_TO_USD = 0.0125;
var paypalRendered = false;

// ============================================
// SISTEMA DE MONEDAS
// ============================================
var CURRENCIES = {
    USD: { symbol: '$', rate: 1, name: 'US Dollar' },
    EUR: { symbol: '€', rate: 0.92, name: 'Euro' },
    PEN: { symbol: 'S/', rate: 3.75, name: 'Sol Peruano' },
    MXN: { symbol: 'MX$', rate: 17.50, name: 'Peso Mexicano' },
    COP: { symbol: 'CO$', rate: 4100, name: 'Peso Colombiano' },
    CLP: { symbol: 'CL$', rate: 920, name: 'Peso Chileno' },
    ARS: { symbol: 'AR$', rate: 850, name: 'Peso Argentino' },
    BRL: { symbol: 'R$', rate: 5.05, name: 'Real Brasileño' },
    GBP: { symbol: '£', rate: 0.79, name: 'Libra Esterlina' },
    JPY: { symbol: '¥', rate: 148, name: 'Yen Japonés' },
    CAD: { symbol: 'CA$', rate: 1.35, name: 'Dólar Canadiense' },
    AUD: { symbol: 'AU$', rate: 1.53, name: 'Dólar Australiano' }
};

function getCurrencySymbol() {
    var currency = localStorage.getItem('yxCurrency') || 'USD';
    return CURRENCIES[currency] ? CURRENCIES[currency].symbol : '$';
}
function convertPrice(robux) {
    var currency = localStorage.getItem('yxCurrency') || 'USD';
    var usd = robux * ROBUX_TO_USD;
    var rate = CURRENCIES[currency] ? CURRENCIES[currency].rate : 1;
    return (usd * rate).toFixed(2);
}
function formatPrice(robux) {
    return getCurrencySymbol() + convertPrice(robux);
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    await checkUserSession();
    loadCart();
    updateCartBadge();
    if (typeof applyTranslations === 'function') applyTranslations();

    document.getElementById('clearCart').addEventListener('click', function() {
        if (cart.length === 0) return;
        cart = []; appliedDiscount = 0; currentPromoCode = null; saveCart(); loadCart();
        showNotification(t('notif_cart_cleared'), t('notif_cart_cleared_desc'), 'info');
    });

    document.getElementById('applyPromo').addEventListener('click', function() {
        var code = document.getElementById('promoInput').value.toUpperCase().trim();
        var msgEl = document.getElementById('promoMessage');
        if (!code) { if (msgEl) msgEl.innerHTML = '<span class="promo-error">' + t('promo_invalid') + '</span>'; return; }
        if (promoCodes[code]) {
            currentPromoCode = code;
            appliedDiscount = cart.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)); }, 0) * ROBUX_TO_USD * promoCodes[code];
            if (msgEl) msgEl.innerHTML = '<span class="promo-success">' + (promoCodes[code] * 100) + '% ' + t('promo_applied') + '</span>';
        } else { appliedDiscount = 0; currentPromoCode = null; if (msgEl) msgEl.innerHTML = '<span class="promo-error">' + t('promo_invalid') + '</span>'; }
        updateSummary();
    });
});

async function checkUserSession() {
    var guest = document.getElementById('guestMenu'), user = document.getElementById('userMenu');
    if (!guest || !user) return;
    guest.style.display = 'flex'; user.style.display = 'none';
    try {
        var { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            guest.style.display = 'none'; user.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            document.getElementById('userAvatar').src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            var logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                var newBtn = logoutBtn.cloneNode(true); logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
                newBtn.addEventListener('click', async function(e) { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = BASE_URL + '/index.html'; });
            }
        }
    } catch (e) {}
}

function loadCart() {
    var container = document.getElementById('cartItemsContainer'), empty = document.getElementById('emptyCartMessage'), summary = document.getElementById('cartSummarySection');
    updateCartBadge();
    if (!cart.length) { 
        if (container) container.innerHTML = ''; 
        if (empty) empty.style.display = 'block'; 
        if (summary) summary.style.display = 'none'; 
        paypalRendered = false; 
        return; 
    }
    if (empty) empty.style.display = 'none'; 
    if (summary) summary.style.display = 'block';
    if (container) {
        container.innerHTML = cart.map(function(item, idx) {
            var itemTotal = item.price * (item.quantity || 1);
            return '<div class="cart-item-card">' +
                '<div class="cart-item-icon"><span class="material-icons">' + getIcon(item.category) + '</span></div>' +
                '<div class="cart-item-details"><h3>' + item.name + '</h3><span class="cart-item-category">' + item.category + '</span></div>' +
                '<div class="cart-item-quantity"><button class="qty-btn" onclick="updateQty(' + idx + ',-1)">-</button><span class="qty-value">' + (item.quantity || 1) + '</span><button class="qty-btn" onclick="updateQty(' + idx + ',1)">+</button></div>' +
                '<div class="cart-item-pricing"><div class="item-price">' + formatPrice(itemTotal) + '</div></div>' +
                '<button class="btn-remove-item" onclick="removeItem(' + idx + ')"><span class="material-icons">close</span></button>' +
                '</div>';
        }).join('');
    }
    updateSummary();
}

window.updateQty = function(idx, ch) { 
    cart[idx].quantity = (cart[idx].quantity || 1) + ch; 
    if (cart[idx].quantity <= 0) cart.splice(idx, 1); 
    saveCart(); loadCart(); 
};
window.removeItem = function(idx) { 
    var item = cart[idx];
    cart.splice(idx, 1); saveCart(); loadCart(); 
    showNotification(t('notif_removed'), item.name + ' ' + t('notif_removed_desc'), 'info');
};

function updateSummary() {
    var subtotalRobux = cart.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)); }, 0);
    var subtotalUSD = subtotalRobux * ROBUX_TO_USD;
    var totalUSD = Math.max(0.01, subtotalUSD - appliedDiscount);
    
    document.getElementById('subtotal').textContent = formatPrice(subtotalRobux);
    document.getElementById('discount').textContent = appliedDiscount > 0 ? '-' + getCurrencySymbol() + convertPrice(subtotalRobux * (appliedDiscount / subtotalUSD)) : getCurrencySymbol() + '0.00';
    document.getElementById('total').textContent = formatPrice(subtotalRobux * (1 - (appliedDiscount / subtotalUSD)));
    
    document.getElementById('summaryItemsList').innerHTML = cart.map(function(i) {
        return '<div class="summary-item"><div class="summary-item-info"><span class="material-icons">' + getIcon(i.category) + '</span><span>' + i.name + ' x' + (i.quantity || 1) + '</span></div><span>' + formatPrice(i.price * (i.quantity || 1)) + '</span></div>';
    }).join('');
    
    if (!paypalRendered && cart.length > 0 && totalUSD > 0) { renderPayPal(totalUSD); paypalRendered = true; }
}

function renderPayPal(total) {
    var container = document.getElementById('paypal-button-container');
    if (!container || typeof paypal === 'undefined') return;
    container.innerHTML = '';
    paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
        createOrder: function(data, actions) { return actions.order.create({ purchase_units: [{ amount: { currency_code: 'USD', value: total.toFixed(2) } }] }); },
        onApprove: async function(data, actions) {
            var order = await actions.order.capture();
            var { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                await supabaseClient.from('orders').insert({ user_id: session.user.id, user_email: session.user.email, paypal_order_id: order.id, items: cart, subtotal: cart.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)); }, 0) * ROBUX_TO_USD, discount: appliedDiscount, total: total, status: 'completed' });
            }
            cart = []; appliedDiscount = 0; currentPromoCode = null; saveCart(); paypalRendered = false; loadCart();
            showNotification(t('notif_payment_success'), t('notif_payment_success_desc'), 'success');
        }
    }).render('#paypal-button-container');
}

function getIcon(cat) { var icons = { admin: 'shield', economy: 'account_balance_wallet', combat: 'sports_martial_arts', building: 'construction' }; return icons[cat] || 'code'; }
function updateCartBadge() { var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0); var badge = document.getElementById('cartCount'); if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; } }
function saveCart() { localStorage.setItem('yxCart', JSON.stringify(cart)); updateCartBadge(); }

function showNotification(title, message, type) {
    var existing = document.querySelector('.notify-toast'); if (existing) existing.remove();
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var toast = document.createElement('div');
    toast.className = 'notify-toast notify-' + type;
    toast.innerHTML = '<div class="notify-icon"><span class="material-icons">' + (icons[type] || 'info') + '</span></div><div class="notify-content"><div class="notify-title">' + title + '</div><div class="notify-message">' + message + '</div></div><button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button><div class="notify-progress"></div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400); }, 4000);
}
