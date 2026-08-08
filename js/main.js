// ============================================
// YX STUDIOS - MAIN JS
// ============================================

// Productos (puedes agregar más)
const products = [
    { id: 1, name: 'Admin System Pro', description: 'Sistema de administración completo.', price: 2500, category: 'admin', icon: 'fa-shield-halved', features: ['Comandos avanzados', 'Panel de control', 'Anti-exploit'], rating: 4.8, sales: 234, reviews: [] },
    { id: 2, name: 'Economy System', description: 'Sistema económico con tiendas.', price: 1800, category: 'economy', icon: 'fa-coins', features: ['Tiendas', 'Trading', 'Monedas'], rating: 4.6, sales: 189, reviews: [] },
    { id: 3, name: 'Combat Engine', description: 'Motor de combate avanzado.', price: 3000, category: 'combat', icon: 'fa-hand-fist', features: ['Hitboxes', 'Combos', 'Efectos'], rating: 4.9, sales: 312, reviews: [] },
    { id: 4, name: 'Build System', description: 'Construcción intuitiva.', price: 2000, category: 'building', icon: 'fa-hammer', features: ['Grid snapping', 'Rotación 3D'], rating: 4.5, sales: 156, reviews: [] },
    { id: 5, name: 'VIP System', description: 'Sistema VIP exclusivo.', price: 1500, category: 'admin', icon: 'fa-crown', features: ['Perks', 'Salas VIP'], rating: 4.7, sales: 278, reviews: [] },
    { id: 6, name: 'Data Store Manager', description: 'Gestión de datos.', price: 2200, category: 'economy', icon: 'fa-database', features: ['Auto-save', 'Backups'], rating: 4.4, sales: 145, reviews: [] },
    { id: 7, name: 'Anti-Cheat', description: 'Protección contra hackers.', price: 3500, category: 'admin', icon: 'fa-shield-virus', features: ['Detección', 'Auto-ban'], rating: 4.9, sales: 198, reviews: [] },
    { id: 8, name: 'Trading System', description: 'Intercambio seguro.', price: 2800, category: 'economy', icon: 'fa-arrow-right-arrow-left', features: ['Seguro', 'Historial'], rating: 4.7, sales: 167, reviews: [] }
];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkUserSession();
    renderProducts();
    updateCartCount();
    setupSearchAndFilters();
    updateHeroStats();
});

// ============================================
// AUTENTICACIÓN
// ============================================
async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            document.getElementById('userAvatar').src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            setupLogout(supabase);
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (e) {
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

function setupLogout(supabase) {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

// ============================================
// PRODUCTOS Y PAGINACIÓN
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
    grid.innerHTML = pageItems.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
                <span class="product-rating"><i class="fas fa-star"></i> ${product.rating}</span>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 70)}...</p>
                <div class="product-footer">
                    <div class="product-price"><span class="price-value">${product.price.toLocaleString()}</span> Robux</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})"><span class="material-icons">add_shopping_cart</span></button>
                        <button class="btn-view-details" onclick="showDetails(${product.id})"><span class="material-icons">visibility</span></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><span class="material-icons">chevron_left</span></button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><span class="material-icons">chevron_right</span></button>`;
    container.innerHTML = html;
}

window.goToPage = function(page) {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: document.getElementById('products').offsetTop - 80, behavior: 'smooth' });
};

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
window.filterProducts = function(category) {
    currentCategory = category;
    currentPage = 1;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.filter-btn[data-category="${category}"]`)?.classList.add('active');
    renderProducts();
};

window.searchProducts = function() {
    currentSearch = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    currentPage = 1;
    renderProducts();
};

function setupSearchAndFilters() {
    document.getElementById('searchInput')?.addEventListener('input', searchProducts);
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
    let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
    const existing = cart.find(item => item.id === productId);
    if (existing) { existing.quantity++; } else { cart.push({...product, quantity: 1}); }
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${product.name} agregado al carrito`, 'success');
};

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('yxCart')) || [];
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

// ============================================
// DETALLES (MODAL) CON RESEÑAS
// ============================================
window.showDetails = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="modal-close"><span class="material-icons">close</span></button>
            <div class="modal-content">
                <div class="modal-image"><i class="fas ${product.icon}"></i></div>
                <div class="modal-info">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.name}</h2>
                    <div class="modal-rating"><i class="fas fa-star"></i> ${product.rating} (${product.sales} ventas)</div>
                    <p>${product.description}</p>
                    <div class="modal-features"><h4>Características:</h4><ul>${product.features.map(f => `<li><span class="material-icons">check</span>${f}</li>`).join('')}</ul></div>
                    <div class="modal-price">${product.price.toLocaleString()} Robux</div>
                    <div class="modal-actions">
                        <button class="btn-primary" id="modalAddToCart"><span class="material-icons">add_shopping_cart</span> Agregar</button>
                        <button class="btn-outline" id="modalBuyNow"><span class="material-icons">bolt</span> Comprar Ahora</button>
                    </div>
                    <div class="review-section">
                        <h4>Reseñas</h4>
                        <div id="reviewsList">${(product.reviews || []).map(r => `<div class="review-item"><strong>${r.user}</strong> - ${'★'.repeat(r.stars)}<p>${r.comment}</p></div>`).join('') || '<p>Sin reseñas aún.</p>'}</div>
                        <div class="add-review">
                            <h5>Deja tu reseña</h5>
                            <div class="star-selector">${[5,4,3,2,1].map(s => `<span class="star" data-stars="${s}">☆</span>`).join('')}</div>
                            <textarea id="reviewComment" placeholder="Tu comentario..."></textarea>
                            <button class="btn-primary" id="submitReview">Enviar reseña</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#modalAddToCart').onclick = () => { addToCart(productId); modal.remove(); };
    modal.querySelector('#modalBuyNow').onclick = () => { addToCart(productId); window.location.href = 'cart.html'; };
    
    // Estrellas interactivas
    let selectedStars = 0;
    modal.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectedStars = parseInt(this.dataset.stars);
            modal.querySelectorAll('.star').forEach((s, idx) => {
                s.textContent = idx < selectedStars ? '★' : '☆';
            });
        });
    });
    modal.querySelector('#submitReview').onclick = () => {
        const comment = modal.querySelector('#reviewComment').value;
        if (!selectedStars) return alert('Selecciona estrellas');
        product.reviews = product.reviews || [];
        product.reviews.push({ user: 'Tú', stars: selectedStars, comment });
        modal.querySelector('#reviewsList').innerHTML = product.reviews.map(r => `<div class="review-item"><strong>${r.user}</strong> - ${'★'.repeat(r.stars)}<p>${r.comment}</p></div>`).join('');
        updateHeroStats();
    };
};

// ============================================
// ACTUALIZAR STATS DEL HERO
// ============================================
function updateHeroStats() {
    document.getElementById('totalSystems').textContent = `${products.length}+`;
    const totalSales = products.reduce((s, p) => s + p.sales, 0);
    document.getElementById('totalClients').textContent = `${(totalSales / 1000).toFixed(1)}k+`;
    const avg = (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1);
    document.getElementById('avgRating').textContent = avg;
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
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
