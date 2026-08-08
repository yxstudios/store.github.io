// ============================================
// YX STUDIOS - MAIN JS
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PRODUCTOS
// ============================================
const products = [
    { id: 1, name: 'Admin System Pro', description: 'Sistema de administración completo con comandos avanzados y panel de control.', price: 2500, category: 'admin', icon: 'fa-shield-halved', features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit'], sales: 0, banner: 'https://via.placeholder.com/900x300/ff2d2d/ffffff?text=Admin+System+Pro' },
    { id: 2, name: 'Economy System', description: 'Sistema económico completo con tiendas, inventario y monedas personalizables.', price: 1800, category: 'economy', icon: 'fa-coins', features: ['Tiendas', 'Inventario', 'Trading', 'Monedas'], sales: 0, banner: 'https://via.placeholder.com/900x300/00c853/ffffff?text=Economy+System' },
    { id: 3, name: 'Combat Engine', description: 'Motor de combate avanzado con hitboxes y habilidades especiales.', price: 3000, category: 'combat', icon: 'fa-hand-fist', features: ['Hitboxes', 'Combos', 'Habilidades', 'Efectos'], sales: 0, banner: 'https://via.placeholder.com/900x300/2196f3/ffffff?text=Combat+Engine' },
    { id: 4, name: 'Build System', description: 'Sistema de construcción intuitivo con grid snapping.', price: 2000, category: 'building', icon: 'fa-hammer', features: ['Grid snapping', 'Rotación 3D', 'Materiales', 'Undo/Redo'], sales: 0, banner: 'https://via.placeholder.com/900x300/ff9100/ffffff?text=Build+System' },
    { id: 5, name: 'VIP System', description: 'Sistema VIP con perks exclusivos y beneficios especiales.', price: 1500, category: 'admin', icon: 'fa-crown', features: ['Perks', 'Salas VIP', 'Comandos', 'Insignias'], sales: 0, banner: 'https://via.placeholder.com/900x300/9c27b0/ffffff?text=VIP+System' },
    { id: 6, name: 'Data Store Manager', description: 'Sistema de guardado de datos con respaldo automático.', price: 2200, category: 'economy', icon: 'fa-database', features: ['Auto-save', 'Backups', 'Recuperación', 'Sincronización'], sales: 0, banner: 'https://via.placeholder.com/900x300/607d8b/ffffff?text=Data+Store' },
    { id: 7, name: 'Anti-Cheat System', description: 'Protección avanzada contra hackers y exploits.', price: 3500, category: 'admin', icon: 'fa-shield-virus', features: ['Detección', 'Auto-ban', 'Logs', 'Protección'], sales: 0, banner: 'https://via.placeholder.com/900x300/ff1744/ffffff?text=Anti+Cheat' },
    { id: 8, name: 'Trading System', description: 'Sistema de intercambio seguro entre jugadores.', price: 2800, category: 'economy', icon: 'fa-arrow-right-arrow-left', features: ['Seguro', 'Historial', 'Notificaciones', 'Anti-scam'], sales: 0, banner: 'https://via.placeholder.com/900x300/00bcd4/ffffff?text=Trading+System' }
];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('YX Studios - Iniciando...');
    await checkUserSession();
    renderFeaturedProducts();
    renderProducts();
    updateCartCount();
    updateHeroStats();
    console.log('YX Studios - Listo');
});

// ============================================
// AUTENTICACIÓN
// ============================================
async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');

    if (!guestMenu || !userMenu) {
        console.log('Menús no encontrados');
        return;
    }

    // Por defecto mostrar invitado
    guestMenu.style.display = 'flex';
    userMenu.style.display = 'none';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session && session.user) {
            console.log('Usuario logueado:', session.user.email);
            guestMenu.style.display = 'none';
            userMenu.style.display = 'flex';

            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            }

            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            }

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
        } else {
            console.log('No hay usuario logueado');
        }
    } catch (e) {
        console.error('Error al verificar sesión:', e);
    }
}

// ============================================
// PRODUCTOS DESTACADOS
// ============================================
function renderFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) {
        console.log('featuredGrid no encontrado');
        return;
    }
    const featured = products.slice(0, 3);
    grid.innerHTML = featured.map((p, i) => `
        <div class="featured-product-card featured-anim-${i + 1}" onclick="showProductModal(${p.id})">
            <div class="featured-glow"></div>
            <div class="featured-badge"><span class="material-icons">local_fire_department</span><span>Destacado</span></div>
            <div class="featured-image"><i class="fas ${p.icon}"></i><div class="featured-particles"><span class="particle"></span><span class="particle"></span><span class="particle"></span></div></div>
            <div class="featured-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 60)}...</p>
                <div class="featured-price-row">
                    <span class="featured-price">${p.price.toLocaleString()} Robux</span>
                    <button class="btn-featured-cart" onclick="event.stopPropagation(); addToCart(${p.id})"><span class="material-icons">add_shopping_cart</span></button>
                </div>
            </div>
        </div>
    `).join('');
    console.log('Destacados renderizados');
}

// ============================================
// FILTROS
// ============================================
function getFilteredProducts() {
    let filtered = products;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    if (currentSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch) || p.description.toLowerCase().includes(currentSearch));
    return filtered;
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderProducts() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
    const grid = document.getElementById('productsGrid');
    
    if (!grid) {
        console.log('productsGrid no encontrado');
        return;
    }

    console.log('Renderizando', pageItems.length, 'productos');

    if (pageItems.length === 0) {
        grid.innerHTML = '<div class="no-products"><span class="material-icons">search_off</span><h3>No se encontraron productos</h3></div>';
        return;
    }

    grid.innerHTML = pageItems.map(p => `
        <div class="product-card" onclick="showProductModal(${p.id})">
            <div class="product-image"><i class="fas ${p.icon}"></i></div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 60)}...</p>
                <div class="product-footer">
                    <div class="product-price"><span class="price-value">${p.price.toLocaleString()}</span><span class="price-currency">Robux</span></div>
                    <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})" title="Agregar al carrito"><span class="material-icons">add_shopping_cart</span></button>
                </div>
            </div>
        </div>
    `).join('');

    renderPagination(totalPages);
}

// ============================================
// PAGINACIÓN
// ============================================
function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) { 
        if (container) container.innerHTML = ''; 
        return; 
    }
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

// ============================================
// CARRITO
// ============================================
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.quantity++; 
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Agregado al carrito', product.name + ' se agregó correctamente', 'success');
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
// NOTIFICACIÓN
// ============================================
function showNotification(title, message, type) {
    const existing = document.querySelector('.notify-toast');
    if (existing) existing.remove();
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `notify-toast notify-${type}`;
    toast.innerHTML = `
        <div class="notify-icon"><span class="material-icons">${icons[type] || 'info'}</span></div>
        <div class="notify-content">
            <div class="notify-title">${title}</div>
            <div class="notify-message">${message}</div>
        </div>
        <button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button>
        <div class="notify-progress"></div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400); 
    }, 4000);
}

// ============================================
// MODAL
// ============================================
window.showProductModal = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const old = document.querySelector('.product-modal-overlay');
    if (old) old.remove();

    const modal = document.createElement('div');
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
                            ${product.features.map(f => `<div class="feature-item-inline"><span class="material-icons">check_circle</span><span>${f}</span></div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-right-actions">
                    <div class="modal-price-box">
                        <span class="modal-price-big">${product.price.toLocaleString()}</span>
                        <span class="modal-price-label">Robux</span>
                    </div>
                    <button class="btn-primary btn-block" id="modalAddToCart"><span class="material-icons">add_shopping_cart</span> Agregar al Carrito</button>
                    <button class="btn-outline btn-block" id="modalBuyNow"><span class="material-icons">bolt</span> Comprar Ahora</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const close = () => { 
        modal.remove(); 
        document.body.style.overflow = ''; 
    };
    
    modal.querySelector('.modal-close-btn').onclick = close;
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', function esc(e) { 
        if (e.key === 'Escape') { 
            close(); 
            document.removeEventListener('keydown', esc); 
        } 
    });
    
    modal.querySelector('#modalAddToCart').onclick = () => { 
        addToCart(productId); 
        close(); 
    };
    modal.querySelector('#modalBuyNow').onclick = () => { 
        addToCart(productId); 
        window.location.href = 'cart.html'; 
    };
};

// ============================================
// HERO STATS
// ============================================
function updateHeroStats() {
    const systemsEl = document.getElementById('totalSystems');
    const clientsEl = document.getElementById('totalClients');
    const ratingEl = document.getElementById('avgRating');
    
    if (systemsEl) systemsEl.textContent = products.length;
    if (clientsEl) clientsEl.textContent = '0';
    if (ratingEl) ratingEl.textContent = 'Nuevo';
}
