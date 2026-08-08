// ============================================
// YX STUDIOS - MAIN JS
// ============================================

const products = [
    { id: 1, name: 'Admin System Pro', description: 'Sistema de administración completo con comandos avanzados y panel de control.', price: 2500, category: 'admin', icon: 'fa-shield-halved', features: ['Comandos avanzados', 'Panel de control', 'Anti-exploit'], sales: 234, reviews: [], banner: 'https://via.placeholder.com/800x400/ff2d2d/ffffff?text=Admin+System+Pro' },
    { id: 2, name: 'Economy System', description: 'Sistema económico con tiendas, inventario y monedas personalizables.', price: 1800, category: 'economy', icon: 'fa-coins', features: ['Tiendas', 'Trading', 'Monedas'], sales: 189, reviews: [], banner: 'https://via.placeholder.com/800x400/00c853/ffffff?text=Economy+System' },
    { id: 3, name: 'Combat Engine', description: 'Motor de combate avanzado con hitboxes y habilidades especiales.', price: 3000, category: 'combat', icon: 'fa-hand-fist', features: ['Hitboxes', 'Combos', 'Efectos'], sales: 312, reviews: [], banner: 'https://via.placeholder.com/800x400/2196f3/ffffff?text=Combat+Engine' },
    { id: 4, name: 'Build System', description: 'Sistema de construcción intuitivo con grid snapping.', price: 2000, category: 'building', icon: 'fa-hammer', features: ['Grid snapping', 'Rotación 3D'], sales: 156, reviews: [], banner: 'https://via.placeholder.com/800x400/ff9100/ffffff?text=Build+System' },
    { id: 5, name: 'VIP System', description: 'Sistema VIP con perks exclusivos y beneficios especiales.', price: 1500, category: 'admin', icon: 'fa-crown', features: ['Perks', 'Salas VIP'], sales: 278, reviews: [], banner: 'https://via.placeholder.com/800x400/9c27b0/ffffff?text=VIP+System' },
    { id: 6, name: 'Data Store Manager', description: 'Sistema de guardado de datos con respaldo automático.', price: 2200, category: 'economy', icon: 'fa-database', features: ['Auto-save', 'Backups'], sales: 145, reviews: [], banner: 'https://via.placeholder.com/800x400/607d8b/ffffff?text=Data+Store' },
    { id: 7, name: 'Anti-Cheat System', description: 'Protección avanzada contra hackers y exploits.', price: 3500, category: 'admin', icon: 'fa-shield-virus', features: ['Detección', 'Auto-ban'], sales: 198, reviews: [], banner: 'https://via.placeholder.com/800x400/ff1744/ffffff?text=Anti+Cheat' },
    { id: 8, name: 'Trading System', description: 'Sistema de intercambio seguro entre jugadores.', price: 2800, category: 'economy', icon: 'fa-arrow-right-arrow-left', features: ['Seguro', 'Historial'], sales: 167, reviews: [], banner: 'https://via.placeholder.com/800x400/00bcd4/ffffff?text=Trading+System' }
];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let supabase = null;

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando YX Studios...');
    
    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.log('Supabase no disponible');
    }

    await checkUserSession();
    renderProducts();
    updateCartCount();
    setupSearchAndFilters();
    updateHeroStats();
    
    console.log('Inicialización completa');
});

// ============================================
// AUTENTICACIÓN
// ============================================
async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');

    if (guestMenu) guestMenu.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';

    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            console.log('Usuario logueado:', session.user.email);
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            const userNameEl = document.getElementById('userNameDisplay');
            if (userNameEl) userNameEl.textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            
            const avatarEl = document.getElementById('userAvatar');
            if (avatarEl) avatarEl.src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            });
        }
    } catch (e) {
        console.error('Error al verificar sesión:', e);
    }
}

// ============================================
// PRODUCTOS
// ============================================
function getFilteredProducts() {
    let filtered = products;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    if (currentSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch) || p.description.toLowerCase().includes(currentSearch));
    return filtered;
}

function renderProducts() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (pageItems.length === 0) {
        grid.innerHTML = '<div class="no-products"><span class="material-icons">search_off</span><h3>No se encontraron productos</h3></div>';
        return;
    }

    grid.innerHTML = pageItems.map(p => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas ${p.icon}"></i>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 70)}...</p>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-value">${p.price.toLocaleString()}</span>
                        <span class="price-currency">Robux</span>
                    </div>
                    <button class="btn-add-cart" onclick="addToCart(${p.id})">
                        <span class="material-icons">add_shopping_cart</span> Agregar
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
    
    let html = `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><span class="material-icons">chevron_left</span></button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><span class="material-icons">chevron_right</span></button>`;
    container.innerHTML = html;
}

window.goToPage = function(page) {
    const totalPages = Math.ceil(getFilteredProducts().length / ITEMS_PER_PAGE) || 1;
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: document.getElementById('products').offsetTop - 80, behavior: 'smooth' });
};

// ============================================
// FILTROS
// ============================================
window.filterProducts = function(category) {
    currentCategory = category;
    currentPage = 1;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    if (btn) btn.classList.add('active');
    renderProducts();
};

window.searchProducts = function() {
    currentSearch = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    currentPage = 1;
    renderProducts();
};

function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', searchProducts);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterProducts(btn.dataset.category));
    });
}

// ============================================
// CARRITO
// ============================================
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    let cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    const existing = cart.find(i => i.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${product.name} agregado al carrito`, 'success');
};

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ============================================
// HERO STATS
// ============================================
function updateHeroStats() {
    const systemsEl = document.getElementById('totalSystems');
    if (systemsEl) systemsEl.textContent = products.length;
    
    const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    const clientsEl = document.getElementById('totalClients');
    if (clientsEl) {
        const total = 1250 + orders.length;
        clientsEl.textContent = total >= 1000 ? (total / 1000).toFixed(1) + 'k+' : total;
    }
    
    const ratingEl = document.getElementById('avgRating');
    if (ratingEl) ratingEl.textContent = '4.7';
}

// ============================================
// NOTIFICACIONES
// ============================================
function showNotification(msg, type) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `<span class="material-icons">${type === 'success' ? 'check_circle' : 'info'}</span> ${msg}`;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
