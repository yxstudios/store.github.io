// ============================================
// YX STUDIOS - CARRITO DE COMPRAS
// ============================================

// Obtener carrito del localStorage
let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
let appliedDiscount = 0;
let currentPromo = null;

// Promociones
const promoCodes = {
    'WELCOME10': 0.10,
    'ROBLOX20': 0.20,
    'VIP50': 0.50,
    'YXSTUDIOS': 0.15
};

const ROBUX_TO_USD = 0.0125;

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Carrito cargado. Items:', cart.length);
    loadCart();
    updateUserUI();
    setupClearCart();
    setupPromoCode();
});

// ============================================
// CARGAR CARRITO
// ============================================
function loadCart() {
    const itemsContainer = document.getElementById('cartItemsContainer');
    const emptyMessage = document.getElementById('emptyCartMessage');
    const summarySection = document.getElementById('cartSummarySection');
    
    updateCartBadge();
    
    if (!cart || cart.length === 0) {
        itemsContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        summarySection.style.display = 'none';
        return;
    }
    
    emptyMessage.style.display = 'none';
    summarySection.style.display = 'block';
    
    // Renderizar items
    itemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item-card">
            <div class="cart-item-icon">
                <span class="material-icons">${getIconForCategory(item.category)}</span>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-header">
                    <h3>${item.name}</h3>
                    <span class="cart-item-category">${item.category}</span>
                </div>
                <div class="cart-item-features">
                    ${item.features?.slice(0, 2).map(f => `<span class="feature-tag">${f}</span>`).join('') || ''}
                </div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateItemQuantity(${index}, -1)">-</button>
                <span class="qty-value">${item.quantity || 1}</span>
                <button class="qty-btn" onclick="updateItemQuantity(${index}, 1)">+</button>
            </div>
            <div class="cart-item-pricing">
                <div class="item-price">$${convertToUSD(item.price * (item.quantity || 1)).toFixed(2)}</div>
                <div class="item-robux">${(item.price * (item.quantity || 1)).toLocaleString()} Robux</div>
            </div>
            <button class="btn-remove-item" onclick="removeItem(${index})">
                <span class="material-icons">close</span>
            </button>
        </div>
    `).join('');
    
    updateSummary();
    loadSummaryItems();
    renderPayPalButton();
}

// ============================================
// ACTUALIZAR CANTIDAD
// ============================================
window.updateItemQuantity = function(index, change) {
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
    showNotification(`${item.name} eliminado del carrito`, 'info');
};

// ============================================
// VACIAR CARRITO
// ============================================
function setupClearCart() {
    document.getElementById('clearCart')?.addEventListener('click', () => {
        if (cart.length === 0) return;
        if (confirm('¿Estás seguro de vaciar el carrito?')) {
            cart = [];
            appliedDiscount = 0;
            currentPromo = null;
            saveCart();
            loadCart();
            showNotification('Carrito vaciado', 'info');
        }
    });
}

// ============================================
// CÓDIGO PROMOCIONAL
// ============================================
function setupPromoCode() {
    document.getElementById('applyPromo')?.addEventListener('click', () => {
        const input = document.getElementById('promoInput');
        const code = input.value.toUpperCase().trim();
        const msgEl = document.getElementById('promoMessage');
        
        if (!code) {
            msgEl.innerHTML = '<span class="promo-error">Ingresa un código</span>';
            return;
        }
        
        if (promoCodes[code]) {
            currentPromo = code;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            appliedDiscount = convertToUSD(subtotal) * promoCodes[code];
            
            msgEl.innerHTML = `<span class="promo-success">Código aplicado: ${(promoCodes[code] * 100)}% de descuento</span>`;
            updateSummary();
            renderPayPalButton();
        } else {
            msgEl.innerHTML = '<span class="promo-error">Código inválido</span>';
            currentPromo = null;
            appliedDiscount = 0;
            updateSummary();
            renderPayPalButton();
        }
    });
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function updateSummary() {
    const subtotalRobux = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const subtotalUSD = convertToUSD(subtotalRobux);
    const totalUSD = Math.max(0, subtotalUSD - appliedDiscount);
    
    document.getElementById('subtotal').textContent = `$${subtotalUSD.toFixed(2)}`;
    document.getElementById('discount').textContent = appliedDiscount > 0 ? `-$${appliedDiscount.toFixed(2)}` : '$0.00';
    document.getElementById('total').textContent = `$${totalUSD.toFixed(2)}`;
}

// ============================================
// CARGAR ITEMS DEL RESUMEN
// ============================================
function loadSummaryItems() {
    const container = document.getElementById('summaryItemsList');
    if (!container) return;
    
    container.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div class="summary-item-info">
                <span class="material-icons">${getIconForCategory(item.category)}</span>
                <span>${item.name} x${item.quantity || 1}</span>
            </div>
            <span>$${convertToUSD(item.price * (item.quantity || 1)).toFixed(2)}</span>
        </div>
    `).join('');
}

// ============================================
// PAYPAL
// ============================================
function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const total = getTotal();
    
    if (total <= 0 || cart.length === 0) {
        container.innerHTML = '<p class="text-muted">Agrega productos para pagar</p>';
        return;
    }
    
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal'
        },
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: { currency_code: 'USD', value: total.toFixed(2) },
                    items: cart.map(item => ({
                        name: item.name,
                        unit_amount: { currency_code: 'USD', value: convertToUSD(item.price).toFixed(2) },
                        quantity: (item.quantity || 1).toString(),
                        category: 'DIGITAL_GOODS'
                    }))
                }]
            });
        },
        onApprove: async function(data, actions) {
            const order = await actions.order.capture();
            saveOrder(order);
            showNotification('Pago exitoso! Gracias por tu compra', 'success');
            cart = [];
            appliedDiscount = 0;
            currentPromo = null;
            saveCart();
            loadCart();
        },
        onError: function(err) {
            showNotification('Error al procesar el pago', 'error');
        }
    }).render('#paypal-button-container');
}

// ============================================
// GUARDAR ORDEN
// ============================================
function saveOrder(paypalOrder) {
    const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    orders.push({
        id: paypalOrder.id,
        items: cart,
        total: getTotal(),
        date: new Date().toISOString(),
        status: 'completed'
    });
    localStorage.setItem('yxOrders', JSON.stringify(orders));
}

// ============================================
// UTILIDADES
// ============================================
function convertToUSD(robux) {
    return robux * ROBUX_TO_USD;
}

function getTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return Math.max(0, convertToUSD(subtotal) - appliedDiscount);
}

function getIconForCategory(category) {
    const icons = {
        'admin': 'shield',
        'economy': 'account_balance_wallet',
        'combat': 'sports_martial_arts',
        'building': 'construction'
    };
    return icons[category] || 'code';
}

function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function saveCart() {
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartBadge();
}

function showNotification(message, type) {
    // Eliminar notificación existente
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <span class="material-icons">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// UI DE USUARIO
// ============================================
async function updateUserUI() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    
    // Verificar si hay sesión en Supabase
    try {
        const { data: { session } } = await supabase?.auth?.getSession() || { data: { session: null } };
        
        if (session?.user) {
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                const nameEl = document.getElementById('userNameDisplay');
                if (nameEl) {
                    nameEl.textContent = session.user.user_metadata?.full_name || 
                                        session.user.email?.split('@')[0] || 'Usuario';
                }
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl && session.user.user_metadata?.avatar_url) {
                    avatarEl.src = session.user.user_metadata.avatar_url;
                }
            }
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (e) {
        // Si no hay Supabase, mostrar menú de invitado
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await supabase?.auth?.signOut();
    } catch (e) {}
    window.location.href = 'index.html';
});
