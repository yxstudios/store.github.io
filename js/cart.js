let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
let appliedDiscount = 0;
const promoCodes = { 'WELCOME10': 0.10, 'ROBLOX20': 0.20, 'VIP50': 0.50 };
const ROBUX_TO_USD = 0.0125;

document.addEventListener('DOMContentLoaded', async () => {
    await updateUserUI();
    loadCart();
    document.getElementById('clearCart').addEventListener('click', () => { cart = []; saveCart(); loadCart(); });
    document.getElementById('applyPromo').addEventListener('click', () => {
        const code = document.getElementById('promoInput').value.toUpperCase();
        if (promoCodes[code]) {
            appliedDiscount = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0) * ROBUX_TO_USD * promoCodes[code];
            document.getElementById('promoMessage').innerHTML = `<span style="color:green">${promoCodes[code]*100}% descuento</span>`;
        } else {
            appliedDiscount = 0;
            document.getElementById('promoMessage').innerHTML = '<span style="color:red">Inválido</span>';
        }
        updateSummary();
        renderPayPal();
    });
});

async function updateUserUI() {
    const guest = document.getElementById('guestMenu'), user = document.getElementById('userMenu');
    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            guest.style.display = 'none'; user.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            document.getElementById('userAvatar').src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            document.getElementById('logoutBtn').onclick = async (e) => { e.preventDefault(); await supabase.auth.signOut(); window.location.href = 'index.html'; };
        } else { guest.style.display = 'flex'; user.style.display = 'none'; }
    } catch (e) { guest.style.display = 'flex'; user.style.display = 'none'; }
}

function loadCart() {
    const container = document.getElementById('cartItemsContainer');
    const empty = document.getElementById('emptyCartMessage');
    const summary = document.getElementById('cartSummarySection');
    updateCartBadge();
    if (!cart.length) {
        container.innerHTML = ''; empty.style.display = 'block'; summary.style.display = 'none'; return;
    }
    empty.style.display = 'none'; summary.style.display = 'block';
    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-card">
            <div class="cart-item-icon"><span class="material-icons">${item.icon?.replace('fa-','') || 'code'}</span></div>
            <div class="cart-item-details"><h3>${item.name}</h3><span class="cart-item-category">${item.category}</span></div>
            <div class="cart-item-quantity"><button class="qty-btn" onclick="updateQty(${idx},-1)">-</button><span>${item.quantity}</span><button class="qty-btn" onclick="updateQty(${idx},1)">+</button></div>
            <div class="cart-item-pricing"><div>$${(item.price*item.quantity*ROBUX_TO_USD).toFixed(2)}</div><small>${item.price*item.quantity} Robux</small></div>
            <button class="btn-remove-item" onclick="removeItem(${idx})"><span class="material-icons">close</span></button>
        </div>
    `).join('');
    updateSummary();
    renderPayPal();
}

window.updateQty = (idx, ch) => {
    cart[idx].quantity = (cart[idx].quantity || 1) + ch;
    if (cart[idx].quantity <= 0) cart.splice(idx,1);
    saveCart(); loadCart();
};
window.removeItem = (idx) => { cart.splice(idx,1); saveCart(); loadCart(); };

function updateSummary() {
    const subtotalRobux = cart.reduce((s,i)=>s+(i.price*(i.quantity||1)),0);
    const subtotalUSD = subtotalRobux*ROBUX_TO_USD;
    document.getElementById('subtotal').textContent = `$${subtotalUSD.toFixed(2)}`;
    document.getElementById('discount').textContent = appliedDiscount ? `-$${appliedDiscount.toFixed(2)}` : '$0.00';
    document.getElementById('total').textContent = `$${Math.max(0,subtotalUSD-appliedDiscount).toFixed(2)}`;
    document.getElementById('summaryItemsList').innerHTML = cart.map(i => `<div class="summary-item"><span>${i.name} x${i.quantity}</span><span>$${(i.price*i.quantity*ROBUX_TO_USD).toFixed(2)}</span></div>`).join('');
}

function renderPayPal() {
    const total = Math.max(0.01, cart.reduce((s,i)=>s+(i.price*(i.quantity||1)),0)*ROBUX_TO_USD - appliedDiscount);
    if (!cart.length) return;
    paypal.Buttons({
        createOrder: (data, actions) => actions.order.create({ purchase_units: [{ amount: { currency_code: 'USD', value: total.toFixed(2) } }] }),
        onApprove: async (data, actions) => {
            await actions.order.capture();
            const orders = JSON.parse(localStorage.getItem('yxOrders')||'[]');
            orders.push({ id: data.orderID, items: cart, total, date: new Date().toISOString() });
            localStorage.setItem('yxOrders', JSON.stringify(orders));
            cart = []; saveCart(); loadCart();
            alert('Pago exitoso');
        },
        onError: err => alert('Error: ' + err)
    }).render('#paypal-button-container');
}

function updateCartBadge() {
    const count = cart.reduce((s,i)=>s+(i.quantity||1),0);
    const badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count ? 'flex' : 'none'; }
}
function saveCart() { localStorage.setItem('yxCart', JSON.stringify(cart)); updateCartBadge(); }
