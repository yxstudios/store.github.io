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

// Tasa de conversión: 1 Robux = $0.0125 USD
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
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.style.display = 'block';
        if (summarySection) summarySection.style.display = 'none';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (summarySection) summarySection.style.display = 'block';
    
    // Renderizar items
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
    
    // Renderizar PayPal después de un pequeño delay
    setTimeout(() => {
        renderPayPalButton();
    }, 500);
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
    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
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
}

// ============================================
// CÓDIGO PROMOCIONAL
// ============================================
function setupPromoCode() {
    const applyBtn = document.getElementById('applyPromo');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
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
// PAYPAL - CORREGIDO
// ============================================
function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) {
        console.error('No se encontró el contenedor de PayPal');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    const total = getTotal();
    
    if (total <= 0 || cart.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;">Agrega productos al carrito para pagar</p>';
        return;
    }
    
    console.log('Total a pagar:', total.toFixed(2));
    
    try {
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'pill',
                label: 'paypal'
            },
            
            // Crear la orden
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: 'Productos YX Studios',
                        amount: {
                            currency_code: 'USD',
                            value: total.toFixed(2)
                        }
                    }]
                });
            },
            
            // Cuando se aprueba el pago
            onApprove: async function(data, actions) {
                try {
                    const order = await actions.order.capture();
                    console.log('Pago capturado:', order);
                    
                    // Guardar la orden
                    saveOrder(order);
                    
                    // Mostrar mensaje de éxito
                    showNotification('¡Pago exitoso! Gracias por tu compra', 'success');
                    
                    // Limpiar carrito
                    cart = [];
                    appliedDiscount = 0;
                    currentPromo = null;
                    saveCart();
                    
                    // Recargar carrito después de 2 segundos
                    setTimeout(() => {
                        loadCart();
                    }, 2000);
                    
                } catch (error) {
                    console.error('Error al capturar pago:', error);
                    showNotification('Error al procesar el pago. Intenta de nuevo.', 'error');
                }
            },
            
            // Si hay error
            onError: function(err) {
                console.error('Error en PayPal:', err);
                showNotification('Error al conectar con PayPal. Verifica tu conexión.', 'error');
            },
            
            // Si se cancela
            onCancel: function(data) {
                console.log('Pago cancelado');
                showNotification('Pago cancelado', 'info');
            }
            
        }).render('#paypal-button-container');
        
        console.log('Botón de PayPal renderizado correctamente');
        
    } catch (error) {
        console.error('Error al renderizar PayPal:', error);
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;color:var(--danger);">Error al cargar PayPal. Recarga la página.</p>';
    }
}

// ============================================
// GUARDAR ORDEN
// ============================================
function saveOrder(paypalOrder) {
    const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    
    const orderData = {
        paypalOrderId: paypalOrder.id,
        payerEmail: paypalOrder.payer?.email_address || 'N/A',
        payerName: paypalOrder.payer?.name?.given_name + ' ' + paypalOrder.payer?.name?.surname || 'N/A',
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            totalUSD: convertToUSD(item.price * (item.quantity || 1))
        })),
        subtotalUSD: convertToUSD(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)),
        discountUSD: appliedDiscount,
        totalUSD: getTotal(),
        promoCode: currentPromo,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    orders.push(orderData);
    localStorage.setItem('yxOrders', JSON.stringify(orders));
    
    console.log('Orden guardada:', orderData);
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
    const total = convertToUSD(subtotal) - appliedDiscount;
    return Math.max(0.01, total); // Mínimo $0.01 para PayPal
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

// ============================================
// NOTIFICACIONES
// ============================================
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
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
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
    
    try {
        // Verificar si supabase está disponible globalmente
        let session = null;
        
        if (typeof supabase !== 'undefined' && supabase.auth) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
        } else if (window.supabase?.auth) {
            const { data } = await window.supabase.auth.getSession();
            session = data.session;
        }
        
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
        console.log('Error al verificar sesión:', e);
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// ============================================
// LOGOUT
// ============================================
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        if (typeof supabase !== 'undefined' && supabase.auth) {
            await supabase.auth.signOut();
        }
    } catch (e) {
        console.log('Error al cerrar sesión:', e);
    }
    window.location.href = 'index.html';
});
