import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Inicializar carrito desde localStorage
let cart = JSON.parse(localStorage.getItem('rbxCart')) || [];

// Promociones disponibles
const promoCodes = {
    'WELCOME10': 0.10, // 10% descuento
    'ROBLOX20': 0.20,  // 20% descuento
    'VIP50': 0.50      // 50% descuento
};

let currentPromo = null;

// Cargar carrito al iniciar
function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    updateCartCount();
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p class="cart-item-category">${item.category}</p>
                <div class="cart-item-features">
                    ${item.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                </div>
            </div>
            <div class="cart-item-price">
                <span class="price">🎮 ${item.price.toLocaleString()}</span>
                <span class="robux">Robux</span>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                <span class="qty-number">${item.quantity || 1}</span>
                <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <div class="cart-item-total">
                <span>Total: 🎮 ${((item.price * (item.quantity || 1))).toLocaleString()}</span>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    updateSummary();
}

// Actualizar contador del carrito
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Actualizar resumen de compra
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = currentPromo ? subtotal * currentPromo : 0;
    const total = subtotal - discount;
    
    document.getElementById('subtotal').textContent = `🎮 ${subtotal.toLocaleString()}`;
    document.getElementById('discount').textContent = discount > 0 ? `-🎮 ${discount.toLocaleString()}` : '🎮 0';
    document.getElementById('total').textContent = `🎮 ${total.toLocaleString()}`;
}

// Agregar al carrito (llamado desde products.html)
window.addToCart = function(product) {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        showToast('✅ Cantidad actualizada en el carrito');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast('🎉 Producto agregado al carrito');
    }
    
    saveCart();
    updateCartCount();
};

// Actualizar cantidad
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

// Eliminar del carrito
window.removeFromCart = function(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCart();
    loadCart();
    showToast(`🗑️ ${item.name} eliminado del carrito`);
};

// Vaciar carrito
document.getElementById('clearCart')?.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        saveCart();
        loadCart();
        showToast('🛒 Carrito vaciado');
    }
});

// Aplicar código promocional
document.getElementById('applyPromo')?.addEventListener('click', () => {
    const promoInput = document.getElementById('promoInput');
    const code = promoInput.value.toUpperCase();
    
    if (promoCodes[code]) {
        currentPromo = promoCodes[code];
        updateSummary();
        showToast(`🎉 Código aplicado: ${(currentPromo * 100)}% de descuento`);
        promoInput.value = '';
    } else {
        showToast('❌ Código inválido', 'error');
        currentPromo = null;
        updateSummary();
    }
});

// Checkout
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
        showToast('🛒 Tu carrito está vacío', 'error');
        return;
    }
    
    document.getElementById('checkoutModal').style.display = 'block';
    loadOrderSummary();
});

// Cerrar modal
document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'none';
});

// Pasos del checkout
let currentStep = 1;

window.nextStep = function(step) {
    // Validar paso actual
    if (step === 2 && !validateStep1()) return;
    
    // Ocultar todos los pasos
    document.querySelectorAll('.checkout-step-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar paso actual
    document.getElementById(`step${step}Content`).style.display = 'block';
    
    // Actualizar indicadores
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active', 'completed');
        if (parseInt(el.dataset.step) === step) {
            el.classList.add('active');
        } else if (parseInt(el.dataset.step) < step) {
            el.classList.add('completed');
        }
    });
    
    currentStep = step;
};

function validateStep1() {
    const discord = document.getElementById('discordUser').value;
    const roblox = document.getElementById('robloxUser').value;
    
    if (!discord || !roblox) {
        showToast('❌ Por favor completa todos los campos', 'error');
        return false;
    }
    return true;
}

function loadOrderSummary() {
    const orderItems = document.getElementById('orderItems');
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = currentPromo ? total * currentPromo : 0;
    const finalTotal = total - discount;
    
    orderItems.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} x${item.quantity || 1}</span>
            <span>🎮 ${(item.price * (item.quantity || 1)).toLocaleString()}</span>
        </div>
    `).join('');
    
    if (discount > 0) {
        orderItems.innerHTML += `
            <div class="order-item discount">
                <span>Descuento (${(currentPromo * 100)}%)</span>
                <span>-🎮 ${discount.toLocaleString()}</span>
            </div>
        `;
    }
    
    document.getElementById('orderTotal').textContent = `🎮 ${finalTotal.toLocaleString()}`;
}

// Procesar pedido
document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        showToast('❌ Debes iniciar sesión para comprar', 'error');
        return;
    }
    
    const discordUser = document.getElementById('discordUser').value;
    const robloxUser = document.getElementById('robloxUser').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = currentPromo ? total * currentPromo : 0;
    const finalTotal = total - discount;
    
    // Aquí conectarías con Supabase para guardar la orden
    const orderData = {
        userId: session.user.id,
        items: cart,
        discordUser,
        robloxUser,
        paymentMethod,
        total: finalTotal,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    console.log('Orden creada:', orderData);
    
    // Simular procesamiento
    showToast('✅ ¡Pedido realizado con éxito!');
    
    // Limpiar carrito
    cart = [];
    saveCart();
    
    // Cerrar modal
    setTimeout(() => {
        document.getElementById('checkoutModal').style.display = 'none';
        loadCart();
    }, 2000);
});

// Toast notifications
function showToast(message, type = 'success') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('rbxCart', JSON.stringify(cart));
}

// Cerrar sesión
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Cargar carrito al iniciar
loadCart();
