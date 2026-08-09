// ============================================
// YX STUDIOS - MAIN JS
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabaseClient = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = 'https://yxstore.linkpc.net';

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
var ROBUX_TO_USD = 0.0125;

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
// TABLA DE CUPONES DE DESCUENTO
// ============================================
var discountCoupons = [
    { code: 'WELCOME10', discount: 0.10, description: '10% de descuento - Bienvenida', minPurchase: 0, maxUses: 100, currentUses: 0, active: true },
    { code: 'ROBLOX20', discount: 0.20, description: '20% de descuento - Roblox', minPurchase: 2000, maxUses: 50, currentUses: 0, active: true },
    { code: 'VIP50', discount: 0.50, description: '50% de descuento - VIP', minPurchase: 5000, maxUses: 20, currentUses: 0, active: true },
    { code: 'YXSTUDIOS', discount: 0.15, description: '15% de descuento - YX Studios', minPurchase: 1000, maxUses: 200, currentUses: 0, active: true },
    { code: 'SUMMER25', discount: 0.25, description: '25% de descuento - Verano', minPurchase: 1500, maxUses: 75, currentUses: 0, active: true },
    { code: 'BLACK50', discount: 0.50, description: '50% de descuento - Black Friday', minPurchase: 3000, maxUses: 30, currentUses: 0, active: true }
];

// ============================================
// TABLA DE PRODUCTOS
// ============================================
var products = [
    { id: 1, name: 'Admin System Pro', description: 'Sistema de administración completo con comandos avanzados y panel de control. Incluye más de 50 comandos diferentes, panel intuitivo y protección anti-exploit.', price: 2500, category: 'admin', icon: 'fa-shield-halved', features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/ff2d2d/ffffff?text=Admin+System+Pro', featured: true },
    { id: 2, name: 'Economy System', description: 'Sistema económico completo con tiendas, inventario, trading y monedas personalizables para tu juego.', price: 1800, category: 'economy', icon: 'fa-coins', features: ['Tiendas', 'Inventario', 'Trading', 'Monedas personalizables'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/00c853/ffffff?text=Economy+System', featured: true },
    { id: 3, name: 'Combat Engine', description: 'Motor de combate avanzado con hitboxes precisos, sistema de combos fluidos y habilidades especiales.', price: 3000, category: 'combat', icon: 'fa-hand-fist', features: ['Hitboxes precisos', 'Sistema de combos', 'Habilidades especiales', 'Efectos visuales'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/2196f3/ffffff?text=Combat+Engine', featured: true },
    { id: 4, name: 'Build System', description: 'Sistema de construcción intuitivo con grid snapping, rotación 3D y múltiples materiales.', price: 2000, category: 'building', icon: 'fa-hammer', features: ['Grid snapping', 'Rotación 3D', 'Múltiples materiales', 'Undo/Redo'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/ff9100/ffffff?text=Build+System', featured: false },
    { id: 5, name: 'VIP System', description: 'Sistema VIP premium con perks exclusivos, salas privadas y beneficios especiales.', price: 1500, category: 'admin', icon: 'fa-crown', features: ['Perks exclusivos', 'Salas VIP', 'Comandos especiales', 'Insignias'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/9c27b0/ffffff?text=VIP+System', featured: false },
    { id: 6, name: 'Data Store Manager', description: 'Sistema avanzado de guardado de datos con respaldo automático y recuperación.', price: 2200, category: 'economy', icon: 'fa-database', features: ['Auto-save', 'Backups automáticos', 'Recuperación de datos', 'Sincronización'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/607d8b/ffffff?text=Data+Store+Manager', featured: false },
    { id: 7, name: 'Anti-Cheat System', description: 'Protección avanzada contra hackers y exploits con detección automática y sistema de baneo.', price: 3500, category: 'admin', icon: 'fa-shield-virus', features: ['Detección de exploits', 'Auto-ban', 'Logs detallados', 'Protección remota'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/ff1744/ffffff?text=Anti+Cheat+System', featured: false },
    { id: 8, name: 'Trading System', description: 'Sistema de intercambio seguro entre jugadores con historial y protección anti-scam.', price: 2800, category: 'economy', icon: 'fa-arrow-right-arrow-left', features: ['Intercambio seguro', 'Historial de trades', 'Notificaciones', 'Protección anti-scam'], sales: 0, reviews: [], banner: 'https://via.placeholder.com/900x300/00bcd4/ffffff?text=Trading+System', featured: false }
];

var ITEMS_PER_PAGE = 6;
var currentPage = 1;
var currentCategory = 'all';
var currentSearch = '';

// ============================================
// FEATURED ROTATIVO
// ============================================
var currentFeaturedSet = 0;
var featuredRotationInterval = null;

var featuredSets = [
    { title: 'Más Populares', icon: 'local_fire_department', productIds: [1, 2, 3] },
    { title: 'Exclusivos', icon: 'stars', productIds: [4, 5, 6] },
    { title: 'Con Descuento', icon: 'discount', productIds: [7, 8, 1] }
];

var featuredColors = [
    { gradient: 'linear-gradient(135deg, #ff2d2d, #ff6b6b)', shadow: '0 0 30px rgba(255,45,45,0.4)' },
    { gradient: 'linear-gradient(135deg, #ff9100, #ffab40)', shadow: '0 0 30px rgba(255,145,0,0.4)' },
    { gradient: 'linear-gradient(135deg, #2196f3, #64b5f6)', shadow: '0 0 30px rgba(33,150,243,0.4)' }
];

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('YX Studios - Iniciando...');
    await checkUserSession();
    renderFeaturedProducts();
    startFeaturedRotation();
    renderProducts();
    updateCartCount();
    await updateHeroStats();
    console.log('YX Studios - Listo');
});

// ============================================
// AUTENTICACIÓN
// ============================================
async function checkUserSession() {
    var guestMenu = document.getElementById('guestMenu');
    var userMenu = document.getElementById('userMenu');
    if (!guestMenu || !userMenu) return;
    guestMenu.style.display = 'flex';
    userMenu.style.display = 'none';
    try {
        var { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            guestMenu.style.display = 'none';
            userMenu.style.display = 'flex';
            var userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) userNameDisplay.textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            var userAvatar = document.getElementById('userAvatar');
            if (userAvatar) userAvatar.src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            var logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                var newBtn = logoutBtn.cloneNode(true);
                logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
                newBtn.addEventListener('click', async function(e) { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = BASE_URL + '/index.html'; });
            }
        }
    } catch (e) {}
}

// ============================================
// PRODUCTOS DESTACADOS CON ROTACIÓN
// ============================================
function renderFeaturedProducts() {
    var grid = document.getElementById('featuredGrid');
    if (!grid) return;
    
    var set = featuredSets[currentFeaturedSet];
    var featured = set.productIds.map(function(id) { return products.find(function(p) { return p.id === id; }); }).filter(Boolean);
    
    // Actualizar indicadores
    document.querySelectorAll('.indicator').forEach(function(ind, i) {
        ind.classList.toggle('active', i === currentFeaturedSet);
    });
    
    // Actualizar título
    var titleEl = document.getElementById('featuredSetTitle');
    if (titleEl) titleEl.textContent = set.title;
    
    grid.innerHTML = '';
    
    featured.forEach(function(p, i) {
        var card = document.createElement('div');
        card.className = 'featured-product-card featured-anim-' + (i + 1);
        card.onclick = function() { showProductModal(p.id); };
        
        card.innerHTML = `
            <div class="featured-glow"></div>
            <div class="featured-badge">
                <span class="material-icons">${set.icon}</span>
                <span>${set.title}</span>
            </div>
            <div class="featured-image" style="background:${featuredColors[i].gradient};">
                <i class="fas ${p.icon}"></i>
                <div class="featured-particles">
                    <span class="particle"></span><span class="particle"></span><span class="particle"></span>
                </div>
            </div>
            <div class="featured-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 60)}...</p>
                <div class="featured-price-row">
                    <span class="featured-price">${formatPrice(p.price)}</span>
                    <button class="btn-featured-cart" onclick="event.stopPropagation(); addToCart(${p.id})">
                        <span class="material-icons">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function startFeaturedRotation() {
    stopFeaturedRotation();
    featuredRotationInterval = setInterval(function() {
        currentFeaturedSet = (currentFeaturedSet + 1) % featuredSets.length;
        renderFeaturedProducts();
    }, 5000);
}

function stopFeaturedRotation() {
    if (featuredRotationInterval) { clearInterval(featuredRotationInterval); featuredRotationInterval = null; }
}

// Indicadores clickeables
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('indicator')) {
        currentFeaturedSet = parseInt(e.target.dataset.index);
        renderFeaturedProducts();
        stopFeaturedRotation();
        startFeaturedRotation();
    }
});

// ============================================
// FILTROS
// ============================================
function getFilteredProducts() {
    var filtered = products;
    if (currentCategory !== 'all') filtered = filtered.filter(function(p) { return p.category === currentCategory; });
    if (currentSearch) filtered = filtered.filter(function(p) { return p.name.toLowerCase().includes(currentSearch) || p.description.toLowerCase().includes(currentSearch); });
    return filtered;
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderProducts() {
    var filtered = getFilteredProducts();
    var totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
    var grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (pageItems.length === 0) {
        grid.innerHTML = '<div class="no-products"><span class="material-icons">search_off</span><h3>No se encontraron productos</h3></div>';
        return;
    }

    grid.innerHTML = pageItems.map(function(p) {
        return `
        <div class="product-card" onclick="showProductModal(${p.id})">
            <div class="product-image"><i class="fas ${p.icon}"></i></div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 60)}...</p>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-value">${formatPrice(p.price)}</span>
                    </div>
                    <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})" title="Agregar al carrito">
                        <span class="material-icons">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    renderPagination(totalPages);
}

// ============================================
// PAGINACIÓN
// ============================================
function renderPagination(totalPages) {
    var container = document.getElementById('pagination');
    if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    var html = '<button class="pagination-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '><span class="material-icons">chevron_left</span></button>';
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="pagination-btn ' + (i === currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '><span class="material-icons">chevron_right</span></button>';
    container.innerHTML = html;
}

window.goToPage = function(page) {
    var totalPages = Math.ceil(getFilteredProducts().length / ITEMS_PER_PAGE) || 1;
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: document.getElementById('products').offsetTop - 80, behavior: 'smooth' });
};

window.filterProducts = function(category) {
    currentCategory = category;
    currentPage = 1;
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.querySelector('.filter-btn[data-category="' + category + '"]');
    if (btn) btn.classList.add('active');
    renderProducts();
};

window.searchProducts = function() {
    currentSearch = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    currentPage = 1;
    renderProducts();
};

// ============================================
// CARRITO
// ============================================
window.addToCart = function(productId) {
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return;
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var existing = cart.find(function(i) { return i.id === productId; });
    if (existing) existing.quantity++; else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Agregado al carrito', product.name + ' se agregó correctamente', 'success');
};

function updateCartCount() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

// ============================================
// NOTIFICACIÓN MODERNA
// ============================================
function showNotification(title, message, type) {
    var existing = document.querySelector('.notify-toast');
    if (existing) existing.remove();
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var toast = document.createElement('div');
    toast.className = 'notify-toast notify-' + type;
    toast.innerHTML = '<div class="notify-icon"><span class="material-icons">' + (icons[type] || 'info') + '</span></div><div class="notify-content"><div class="notify-title">' + title + '</div><div class="notify-message">' + message + '</div></div><button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button><div class="notify-progress"></div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400); }, 4000);
}

// ============================================
// MODAL DE PRODUCTO
// ============================================
window.showProductModal = function(productId) {
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return;
    var old = document.querySelector('.product-modal-overlay');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="modal-close-btn"><span class="material-icons">close</span></button>
            <div class="modal-banner" style="background-image:url('${product.banner}')">
                <div class="modal-banner-overlay"></div>
                <div class="modal-banner-content">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.name}</h2>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-left-info">
                    <p class="modal-description">${product.description}</p>
                    <div class="modal-features">
                        <h4>Características</h4>
                        <div class="features-grid-inline">
                            ${product.features.map(function(f) { return '<div class="feature-item-inline"><span class="material-icons">check_circle</span><span>' + f + '</span></div>'; }).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-right-actions">
                    <div class="modal-price-box">
                        <span class="modal-price-big">${formatPrice(product.price)}</span>
                        <span class="modal-price-label">${getCurrencySymbol()}</span>
                    </div>
                    <button class="btn-primary btn-block" id="modalAddToCart"><span class="material-icons">add_shopping_cart</span> Agregar al Carrito</button>
                    <button class="btn-outline btn-block" id="modalBuyNow"><span class="material-icons">bolt</span> Comprar Ahora</button>
                    <div class="modal-extra-info">
                        <div class="extra-item"><span class="material-icons">update</span> Actualizaciones gratis</div>
                        <div class="extra-item"><span class="material-icons">support_agent</span> Soporte 24/7</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    var close = function() { modal.remove(); document.body.style.overflow = ''; };
    modal.querySelector('.modal-close-btn').onclick = close;
    modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    
    modal.querySelector('#modalAddToCart').onclick = function() { addToCart(productId); close(); };
    modal.querySelector('#modalBuyNow').onclick = function() { addToCart(productId); window.location.href = BASE_URL + '/cart.html'; };
};

// ============================================
// HERO STATS
// ============================================
async function updateHeroStats() {
    var systemsEl = document.getElementById('totalSystems');
    var clientsEl = document.getElementById('totalClients');
    var ratingEl = document.getElementById('avgRating');
    
    if (systemsEl) systemsEl.textContent = products.length;
    if (clientsEl) {
        try {
            var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
            var uniqueBuyers = new Set(orders.map(function(o) { return o.id; })).size;
            var totalClients = 1250 + uniqueBuyers;
            clientsEl.textContent = totalClients >= 1000 ? (totalClients / 1000).toFixed(1) + 'k+' : totalClients;
        } catch (e) { clientsEl.textContent = '1.2k+'; }
    }
    if (ratingEl) ratingEl.textContent = '4.8';
}
