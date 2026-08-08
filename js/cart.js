// ============================================
// YX STUDIOS - CARRITO
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
let appliedDiscount = 0;
const promoCodes = { 'WELCOME10': 0.10, 'ROBLOX20': 0.20, 'VIP50': 0.50 };
const ROBUX_TO_USD = 0.0125;
let paypalRendered = false;

document.addEventListener('DOMContentLoaded', async () => {
    await checkUserSession();
    loadCart();
    updateCartBadge();

    document.getElementById('clearCart')?.addEventListener('click', () => {
        if (cart.length === 0) return;
        if (confirm('¿Vaciar carrito?')) { cart = []; appliedDiscount = 0; saveCart(); loadCart(); }
    });

    document.getElementById('applyPromo')?.addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase().trim();
        const msgEl = document.getElementById('promoMessage');
        if (!code) { if (msgEl) msgEl.innerHTML = '<span class="promo-error">Ingresa un código</span>'; return; }
        if (promoCodes[code]) {
            appliedDiscount = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0) * ROBUX_TO_USD * promoCodes[code];
            if (msgEl) msgEl.innerHTML = `<span class="promo-success">${promoCodes[code] * 100}% descuento</span>`;
        } else {
            appliedDiscount = 0;
            if (msgEl) msgEl.innerHTML = '<span class="promo-error">Inválido</span>';
        }
        updateSummary();
    });
});

async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    if (!guestMenu || !userMenu) return;
    guestMenu.style.display = 'flex';
    userMenu.style.display = 'none';
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            guestMenu.style.display = 'none';
            userMenu.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            document.getElementById('userAvatar').src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                const newBtn = logoutBtn.cloneNode(true);
                logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
                newBtn.addEventListener('click', async (e) => { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = 'index.html'; });
            }
        }
    } catch (e) {}
}

function loadCart() {
    const container = document.getElementById('cartItemsContainer');
    const empty = document.getElementById('emptyCartMessage');
    const summary = document.getElementById('cartSummarySection');
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
        container.innerHTML = cart.map((item, idx) => `
            <div class="cart-item-card">
                <div class="cart-item-icon"><span class="material-icons">${getIcon(item.category)}</span></div>
                <div class="cart-item-details"><h3>${item.name}</h3><span class="cart-item-category">${item.category}</span></div>
                <div class="cart-item-quantity"><button class="qty-btn" onclick="updateQty(${idx},-1)">-</button><span class="qty-value">${item.quantity||1}</span><button class="qty-btn" onclick="updateQty(${idx},1)">+</button></div>
                <div class="cart-item-pricing"><div class="item-price">$${(item.price*(item.quantity||1)*ROBUX_TO_USD).toFixed(2)}</div><div class="item-robux">${(item.price*(item.quantity||1)).toLocaleString()} Robux</div></div>
                <button class="btn-remove-item" onclick="removeItem(${idx})"><span class="material-icons">close</span></button>
            </div>
        `).join('');
    }
    updateSummary();
}

window.updateQty = (idx, ch) => { cart[idx].quantity = (cart[idx].quantity || 1) + ch; if (cart[idx].quantity <= 0) cart.splice(idx, 1); saveCart(); loadCart(); };
window.removeItem = (idx) => { cart.splice(idx, 1); saveCart(); loadCart(); };

function updateSummary() {
    const subtotalRobux = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    const subtotalUSD = subtotalRobux * ROBUX_TO_USD;
    const totalUSD = Math.max(0.01, subtotalUSD - appliedDiscount);
    document.getElementById('subtotal').textContent = '$' + subtotalUSD.toFixed(2);
    document.getElementById('discount').textContent = appliedDiscount > 0 ? '-$' + appliedDiscount.toFixed(2) : '$0.00';
    document.getElementById('total').textContent = '$' + totalUSD.toFixed(2);
    document.getElementById('summaryItemsList').innerHTML = cart.map(i => `<div class="summary-item"><div class="summary-item-info"><span class="material-icons">${getIcon(i.category)}</span><span>${i.name} x${i.quantity||1}</span></div><span>$${(i.price*(i.quantity||1)*ROBUX_TO_USD).toFixed(2)}</span></div>`).join('');
    if (!paypalRendered && cart.length > 0 && totalUSD > 0) { renderPayPal(totalUSD); paypalRendered = true; }
}

function renderPayPal(total) {
    const container = document.getElementById('paypal-button-container');
    if (!container || typeof paypal === 'undefined') return;
    container.innerHTML = '';
    paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
        createOrder: (data, actions) => actions.order.create({ purchase_units: [{ amount: { currency_code: 'USD', value: total.toFixed(2) } }] }),
        onApprove: async (data, actions) => {
            await actions.order.capture();
            const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
            orders.push({ id: data.orderID, items: cart, total, date: new Date().toISOString() });
            localStorage.setItem('yxOrders', JSON.stringify(orders));
            cart = []; appliedDiscount = 0; saveCart(); paypalRendered = false; loadCart();
            alert('¡Pago exitoso!');
        }
    }).render('#paypal-button-container');
}

function getIcon(cat) { const icons = { admin: 'shield', economy: 'account_balance_wallet', combat: 'sports_martial_arts', building: 'construction' }; return icons[cat] || 'code'; }
function updateCartBadge() { const count = cart.reduce((s, i) => s + (i.quantity || 1), 0); const badge = document.getElementById('cartCount'); if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; } }
function saveCart() { localStorage.setItem('yxCart', JSON.stringify(cart)); updateCartBadge(); }
