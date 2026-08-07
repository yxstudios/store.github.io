// ============================================
// YX STUDIOS - CARRITO DE COMPRAS
// ============================================

let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
let appliedDiscount = 0;
let currentPromo = null;

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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Carrito cargado. Items:', cart.length);
    
    // PRIMERO verificar usuario
    await updateUserUI();
    
    // Luego cargar carrito
    loadCart();
    setupClearCart();
    setupPromoCode();
    setupLogout();
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
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.style.display = 'block';
        if (summarySection) summarySection.style.display = 'none';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (summarySection) summarySection.style.display = 'block';
    
    if (itemsContainer) {
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
    }
    
    updateSummary();
    loadSummaryItems();
    
    setTimeout(() => renderPayPalButton(), 500);
}

// ============================================
// ACTUALIZAR UI DE USUARIO (CORREGIDO)
// ============================================
async function updateUserUI() {
    const guestButtons = document.getElementById('guestButtons');
    const userButtons = document.getElementById('userButtons');
    
    // Por defecto mostrar guest
    if (guestButtons) guestButtons.style.display = 'flex';
    if (userButtons) userButtons.style.display = 'none';
    
    try {
        // Intentar obtener sesión de Supabase
        const supabaseUrl = 'https://xzfytuasxmqxdcdwfbbl.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Znl0dWFzeG1xeGRjZHdmYmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzkyMDcsImV4cCI6MjEwMTY1NTIwN30.QWM-EkPbQxTaWraKzUEQraJJLsgfjwNyxOc1Krh82tU';
        
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            // Usuario logueado
            if (guestButtons) guestButtons.style.display = 'none';
            if (userButtons) {
                userButtons.style.display = 'flex';
                
                const nameEl = document.getElementById('userNameDisplay');
                if (nameEl) {
                    const fullName = session.user.user_metadata?.full_name;
                    const email = session.user.email;
                    nameEl.textContent = fullName || email?.split('@')[0] || 'Usuario';
                }
                
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl) {
                    avatarEl.src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
                }
            }
        }
    } catch (error) {
        console.log('Usuario no logueado o error:', error.message);
        // Mantener vista de invitado
    }
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
            if (msgEl) msgEl.innerHTML = '<span class="promo-error">Ingresa un código</span>';
            return;
        }
        
        if (promoCodes[code]) {
            currentPromo = code;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            appliedDiscount = convertToUSD(subtotal) * promoCodes[code];
            
            if (msgEl) msgEl.innerHTML = `<span class="promo-success">Código aplicado: ${(promoCodes[code] * 100)}% de descuento</span>`;
            updateSummary();
            setTimeout(() => renderPayPalButton(), 300);
        } else {
            if (msgEl) msgEl.innerHTML = '<span class="promo-error">Código inválido</span>';
            currentPromo = null;
            appliedDiscount = 0;
            updateSummary();
            setTimeout(() => renderPayPalButton(), 300);
        }
    });
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function updateSummary() {
    const subtotalRobux = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const subtotalUSD = convertToUSD(subtotalRobux);
    const totalUSD = Math.max(0.01, subtotalUSD - appliedDiscount);
    
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotalUSD.toFixed(2)}`;
    if (discountEl) discountEl.textContent = appliedDiscount > 0 ? `-$${appliedDiscount.toFixed(2)}` : '$0.00';
    if (totalEl) totalEl.textContent = `$${totalUSD.toFixed(2)}`;
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
// PAYPAL - SIN TARJETA, SOLO PAYPAL
// ============================================
function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const total = getTotal();
    
    if (total <= 0 || cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">Agrega productos al carrito para pagar</p>';
        return;
    }
    
    if (typeof paypal === 'undefined') {
        container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--danger);">Error al cargar PayPal. Recarga la página.</p>';
        return;
    }
    
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
            fundingicons: false
        },
        
        // Deshabilitar tarjeta de crédito/débito
        fundingSource: paypal.FUNDING.PAYPAL,
        
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: 'Productos YX Studios - Sistemas Roblox',
                    amount: {
                        currency_code: 'USD',
                        value: total.toFixed(2)
                    }
                }]
            });
        },
        
        onApprove: async function(data, actions) {
            try {
                const order = await actions.order.capture();
                console.log('Pago exitoso:', order);
                
                saveOrder(order);
                showNotification('¡Pago exitoso! Gracias por tu compra', 'success');
                
                cart = [];
                appliedDiscount = 0;
                currentPromo = null;
                saveCart();
                
                setTimeout(() => loadCart(), 2000);
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al procesar el pago', 'error');
            }
        },
        
        onError: function(err) {
            console.error('Error PayPal:', err);
            showNotification('Error al conectar con PayPal', 'error');
        },
        
        onCancel: function() {
            showNotification('Pago cancelado', 'info');
        }
    }).render('#paypal-button-container');
}

// ============================================
// GUARDAR ORDEN
// ============================================
function saveOrder(paypalOrder) {
    const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    orders.push({
        paypalOrderId: paypalOrder.id,
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
    if (cart.length === 0) return 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return Math.max(0.01, convertToUSD(subtotal) - appliedDiscount);
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
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const icons = {
        'success': 'check_circle',
        'error': 'error',
        'info': 'info'
    };
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <span class="material-icons">${icons[type] || 'info'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// LOGOUT
// ============================================
function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
            const supabase = createClient(
                'https://xzfytuasxmqxdcdwfbbl.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Znl0dWFzeG1xeGRjZHdmYmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzkyMDcsImV4cCI6MjEwMTY1NTIwN30.QWM-EkPbQxTaWraKzUEQraJJLsgfjwNyxOc1Krh82tU'
            );
            await supabase.auth.signOut();
        } catch (e) {
            console.log('Error al cerrar sesión:', e);
        }
        window.location.href = 'index.html';
    });
}
