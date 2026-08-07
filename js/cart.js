import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// ESTADO DEL CARRITO
// ============================================
let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
let currentPromo = null;
let appliedDiscount = 0;

// Promociones disponibles
const promoCodes = {
    'WELCOME10': 0.10, // 10% descuento
    'ROBLOX20': 0.20,  // 20% descuento
    'VIP50': 0.50,     // 50% descuento
    'YXSTUDIOS': 0.15  // 15% descuento
};

// Precio de Robux a USD (tasa de cambio simulada)
const ROBUX_TO_USD_RATE = 0.0125; // 1 Robux = $0.0125 USD

// ============================================
// CARGAR CARRITO
// ============================================
function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    updateCartCount();
    
    if (!cart || cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    
    if (cartItems) {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <span class="cart-item-category">${item.category}</span>
                    <div class="cart-item-features">
                        ${item.features.slice(0, 2).map(f => `<span class="feature-tag">${f}</span>`).join('')}
                    </div>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="qty-number">${item.quantity || 1}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-price">
                    <span class="price">$${convertRobuxToUSD(item.price).toFixed(2)}</span>
                    <span class="robux">🎮 ${item.price.toLocaleString()} Robux</span>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateSummary();
    loadOrderItemsList();
}

// ============================================
// CONVERTIR ROBUX A USD
// ============================================
function convertRobuxToUSD(robux) {
    return robux * ROBUX_TO_USD_RATE;
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function updateSummary() {
    const subtotalRobux = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const subtotalUSD = convertRobuxToUSD(subtotalRobux);
    const discountUSD = appliedDiscount;
    const totalUSD = subtotalUSD - discountUSD;
    
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotalUSD.toFixed(2)}`;
    if (discountEl) discountEl.textContent = discountUSD > 0 ? `-$${discountUSD.toFixed(2)}` : '$0.00';
    if (totalEl) totalEl.textContent = `$${Math.max(0, totalUSD).toFixed(2)}`;
    
    // Renderizar botón de PayPal con el total actualizado
    renderPayPalButton(Math.max(0, totalUSD));
}

// ============================================
// CARGAR LISTA DE ITEMS PARA PAYPAL
// ============================================
function loadOrderItemsList() {
    const orderItemsList = document.getElementById('orderItemsList');
    if (!orderItemsList) return;
    
    orderItemsList.innerHTML = cart.map(item => `
        <div class="order-item-row">
            <div class="order-item-info">
                <i class="fas ${item.icon}"></i>
                <div>
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-qty">x${item.quantity || 1}</span>
                </div>
            </div>
            <span class="order-item-price">$${convertRobuxToUSD(item.price * (item.quantity || 1)).toFixed(2)}</span>
        </div>
    `).join('');
}

// ============================================
// ACTUALIZAR CANTIDAD
// ============================================
window.updateQuantity = function(index, change) {
    const newQuantity = (cart[index].quantity || 1) + change;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity = newQuantity;
    saveCart();
    loadCart();
};

// ============================================
// ELIMINAR DEL CARRITO
// ============================================
window.removeFromCart = function(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCart();
    loadCart();
    showToast(`🗑️ ${item.name} eliminado del carrito`);
};

// ============================================
// VACIAR CARRITO
// ============================================
document.getElementById('clearCart')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        currentPromo = null;
        appliedDiscount = 0;
        saveCart();
        loadCart();
        showToast('🛒 Carrito vaciado');
    }
});

// ============================================
// APLICAR CÓDIGO PROMOCIONAL
// ============================================
document.getElementById('applyPromo')?.addEventListener('click', () => {
    const promoInput = document.getElementById('promoInput');
    const code = promoInput.value.toUpperCase().trim();
    
    if (!code) {
        showToast('❌ Ingresa un código promocional', 'error');
        return;
    }
    
    if (promoCodes[code]) {
        currentPromo = code;
        const subtotalRobux = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const subtotalUSD = convertRobuxToUSD(subtotalRobux);
        appliedDiscount = subtotalUSD * promoCodes[code];
        updateSummary();
        showToast(`🎉 Código aplicado: ${(promoCodes[code] * 100)}% de descuento`);
    } else {
        showToast('❌ Código inválido', 'error');
        currentPromo = null;
        appliedDiscount = 0;
        updateSummary();
    }
});

// ============================================
// RENDERIZAR BOTÓN DE PAYPAL
// ============================================
function renderPayPalButton(totalAmount) {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Solo renderizar si hay monto
    if (totalAmount <= 0) {
        container.innerHTML = '<p class="text-muted">Agrega productos al carrito para pagar</p>';
        return;
    }
    
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
                        value: totalAmount.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: totalAmount.toFixed(2)
                            }
                        }
                    },
                    items: cart.map(item => ({
                        name: item.name,
                        description: item.description?.substring(0, 127) || item.name,
                        unit_amount: {
                            currency_code: 'USD',
                            value: convertRobuxToUSD(item.price).toFixed(2)
                        },
                        quantity: (item.quantity || 1).toString(),
                        category: 'DIGITAL_GOODS'
                    }))
                }]
            });
        },
        
        // Cuando se aprueba el pago
        onApprove: async function(data, actions) {
            try {
                // Capturar el pago
                const order = await actions.order.capture();
                
                console.log('Pago exitoso:', order);
                
                // Guardar la orden en Supabase
                await saveOrder(order);
                
                // Mostrar modal de éxito
                showSuccessModal();
                
                // Limpiar carrito
                cart = [];
                currentPromo = null;
                appliedDiscount = 0;
                saveCart();
                loadCart();
                
            } catch (error) {
                console.error('Error al procesar el pago:', error);
                showToast('❌ Error al procesar el pago: ' + error.message, 'error');
            }
        },
        
        // Si hay error
        onError: function(err) {
            console.error('Error en PayPal:', err);
            showToast('❌ Error al conectar con PayPal. Intenta de nuevo.', 'error');
        },
        
        // Si se cancela
        onCancel: function() {
            showToast('💳 Pago cancelado', 'info');
        }
    }).render('#paypal-button-container');
}

// ============================================
// GUARDAR ORDEN EN SUPABASE
// ============================================
async function saveOrder(paypalOrder) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const orderData = {
            user_id: session?.user?.id || 'guest',
            user_email: session?.user?.email || paypalOrder.payer?.email_address,
            paypal_order_id: paypalOrder.id,
            paypal_payer_id: paypalOrder.payer?.payer_id,
            items: cart,
            subtotal: convertRobuxToUSD(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)),
            discount: appliedDiscount,
            total: parseFloat(paypalOrder.purchase_units[0].amount.value),
            promo_code: currentPromo,
            status: 'completed',
            created_at: new Date().toISOString()
        };
        
        // Guardar en localStorage como respaldo
        const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
        orders.push(orderData);
        localStorage.setItem('yxOrders', JSON.stringify(orders));
        
        // Intentar guardar en Supabase
        const { error } = await supabase
            .from('orders')
            .insert([orderData]);
        
        if (error) {
            console.warn('No se pudo guardar en Supabase, guardado localmente:', error);
        }
        
    } catch (error) {
        console.error('Error al guardar la orden:', error);
    }
}

// ============================================
// MOSTRAR MODAL DE ÉXITO
// ============================================
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountElements = document.querySelectorAll('#cartCount');
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ============================================
// ACTUALIZAR UI SEGÚN SESIÓN
// ============================================
async function updateUI() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const guestMenu = document.getElementById('guestMenu');
        const userMenu = document.getElementById('userMenu');
        
        if (session?.user) {
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) {
                    userNameDisplay.textContent = session.user.user_metadata?.full_name || 
                                                   session.user.email?.split('@')[0] || 'Usuario';
                }
            }
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// GUARDAR CARRITO
// ============================================
function saveCart() {
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
}

// ============================================
// LOGOUT
// ============================================
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 YX Studios - Carrito de Compras');
    updateUI();
    loadCart();
});

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    updateUI();
});
