// ============================================
// YX STUDIOS - CARRITO DE COMPRAS
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
let appliedDiscount = 0;
const promoCodes = { 'WELCOME10': 0.10, 'ROBLOX20': 0.20, 'VIP50': 0.50 };
const ROBUX_TO_USD = 0.0125;
let paypalRendered = false;

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Carrito - Iniciando...');
    await checkUserSession();
    loadCart();
    updateCartBadge();

    document.getElementById('clearCart')?.addEventListener('click', () => {
        if (cart.length === 0) return;
        cart = [];
        appliedDiscount = 0;
        saveCart();
        loadCart();
        showNotification('Carrito vaciado', 'Todos los productos han sido eliminados', 'info');
    });

    document.getElementById('applyPromo')?.addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase().trim();
        const msgEl = document.getElementById('promoMessage');
        if (!code) {
            if (msgEl) msgEl.innerHTML = '<span class="promo-error">Ingresa un código</span>';
            return;
        }
        if (promoCodes[code]) {
            appliedDiscount = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0) * ROBUX_TO_USD * promoCodes[code];
            if (msgEl) msgEl.innerHTML = `<span class="promo-success">${promoCodes[code] * 100}% de descuento aplicado</span>`;
            showNotification('Código aplicado', `${promoCodes[code] * 100}% de descuento`, 'success');
        } else {
            appliedDiscount = 0;
            if (msgEl) msgEl.innerHTML = '<span class="promo-error">Código inválido</span>';
            showNotification('Código inválido', 'El código ingresado no es válido', 'error');
        }
        updateSummary();
    });
    
    console.log('Carrito - Listo');
});

// ============================================
// AUTENTICACIÓN
// ============================================
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
                newBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await supabaseClient.auth.signOut();
                    window.location.href = 'index.html';
                });
            }
        }
    } catch (e) {}
}

// ============================================
// CARGAR CARRITO
// ============================================
function loadCart() {
    const itemsContainer = document.getElementById('cartItemsContainer');
    const emptyMessage = document.getElementById('emptyCartMessage');
    const summarySection = document.getElementById('cartSummarySection');
    
    updateCartBadge();
    
    if (!cart || cart.length === 0) {
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.style.display = 'block';
        if (summarySection) summarySection.style.display = 'none';
        paypalRendered = false;
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (summarySection) summarySection.style.display = 'block';
    
    if (itemsContainer) {
        itemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item-card">
                <div class="cart-item-icon"><span class="material-icons">${getIconForCategory(item.category)}</span></div>
                <div class="cart-item-details"><h3>${item.name}</h3><span class="cart-item-category">${item.category}</span></div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="qty-value">${item.quantity || 1}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-pricing">
                    <div class="item-price">$${convertToUSD(item.price * (item.quantity || 1)).toFixed(2)}</div>
                    <div class="item-robux">${(item.price * (item.quantity || 1)).toLocaleString()} Robux</div>
                </div>
                <button class="btn-remove-item" onclick="removeItem(${index})"><span class="material-icons">close</span></button>
            </div>
        `).join('');
    }
    
    updateSummary();
}

// ============================================
// ACTUALIZAR CANTIDAD
// ============================================
window.updateQuantity = function(index, change) {
    const newQty = (cart[index].quantity || 1) + change;
    if (newQty <= 0) {
        removeItem(index);
        return;
    }
    cart[index].quantity = newQty;
    saveCart();
    loadCart();
};

// ============================================
// ELIMINAR ITEM
// ============================================
window.removeItem = function(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCart();
    loadCart();
    showNotification('Producto eliminado', `${item.name} fue eliminado del carrito`, 'info');
};

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function updateSummary() {
    const subtotalRobux = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const subtotalUSD = subtotalRobux * ROBUX_TO_USD;
    const totalUSD = Math.max(0.01, subtotalUSD - appliedDiscount);
    
    document.getElementById('subtotal').textContent = '$' + subtotalUSD.toFixed(2);
    document.getElementById('discount').textContent = appliedDiscount > 0 ? '-$' + appliedDiscount.toFixed(2) : '$0.00';
    document.getElementById('total').textContent = '$' + totalUSD.toFixed(2);
    
    const itemsList = document.getElementById('summaryItemsList');
    if (itemsList) {
        itemsList.innerHTML = cart.map(item => `
            <div class="summary-item">
                <div class="summary-item-info"><span class="material-icons">${getIconForCategory(item.category)}</span><span>${item.name} x${item.quantity || 1}</span></div>
                <span>$${convertToUSD(item.price * (item.quantity || 1)).toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    if (!paypalRendered && cart.length > 0 && totalUSD > 0) {
        renderPayPalButton(totalUSD);
        paypalRendered = true;
    }
}

// ============================================
// PAYPAL
// ============================================
function renderPayPalButton(total) {
    const container = document.getElementById('paypal-button-container');
    if (!container || typeof paypal === 'undefined') return;
    container.innerHTML = '';
    
    paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
        createOrder: (data, actions) => actions.order.create({
            purchase_units: [{ amount: { currency_code: 'USD', value: total.toFixed(2) } }]
        }),
        onApprove: async (data, actions) => {
            await actions.order.capture();
            const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
            orders.push({ id: data.orderID, items: cart, total, date: new Date().toISOString(), status: 'completed' });
            localStorage.setItem('yxOrders', JSON.stringify(orders));
            cart = []; appliedDiscount = 0; saveCart(); paypalRendered = false; loadCart();
            showNotification('¡Pago exitoso!', 'Gracias por tu compra', 'success');
        },
        onError: (err) => { showNotification('Error', 'No se pudo conectar con PayPal', 'error'); },
        onCancel: () => { showNotification('Pago cancelado', 'Has cancelado el pago', 'info'); }
    }).render('#paypal-button-container');
}

// ============================================
// NOTIFICACIÓN MODERNA
// ============================================
function showNotification(title, message, type) {
    const existing = document.querySelector('.notify-toast');
    if (existing) existing.remove();
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `notify-toast notify-${type}`;
    toast.innerHTML = `
        <div class="notify-icon"><span class="material-icons">${icons[type]}</span></div>
        <div class="notify-content"><div class="notify-title">${title}</div><div class="notify-message">${message}</div></div>
        <button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button>
        <div class="notify-progress"></div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400); }, 4000);
}

// ============================================
// UTILIDADES
// ============================================
function convertToUSD(robux) { return robux * ROBUX_TO_USD; }
function getIconForCategory(category) {
    const icons = { admin: 'shield', economy: 'account_balance_wallet', combat: 'sports_martial_arts', building: 'construction' };
    return icons[category] || 'code';
}
function updateCartBadge() {
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}
function saveCart() { localStorage.setItem('yxCart', JSON.stringify(cart)); updateCartBadge(); }
