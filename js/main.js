const products = [
    { id: 1, name: 'Admin System Pro', description: 'Sistema de administración completo con comandos avanzados y panel de control.', price: 2500, category: 'admin', icon: 'fa-shield-halved', features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit'], sales: 234, reviews: [], banner: 'https://via.placeholder.com/800x400/ff2d2d/ffffff?text=Admin+System+Pro' },
    { id: 2, name: 'Economy System', description: 'Sistema económico con tiendas, inventario y monedas personalizables.', price: 1800, category: 'economy', icon: 'fa-coins', features: ['Tiendas', 'Inventario', 'Trading', 'Monedas'], sales: 189, reviews: [], banner: 'https://via.placeholder.com/800x400/00c853/ffffff?text=Economy+System' },
    { id: 3, name: 'Combat Engine', description: 'Motor de combate avanzado con hitboxes y habilidades especiales.', price: 3000, category: 'combat', icon: 'fa-hand-fist', features: ['Hitboxes precisos', 'Combos', 'Habilidades', 'Efectos'], sales: 312, reviews: [], banner: 'https://via.placeholder.com/800x400/2196f3/ffffff?text=Combat+Engine' },
    { id: 4, name: 'Build System', description: 'Sistema de construcción intuitivo con grid snapping.', price: 2000, category: 'building', icon: 'fa-hammer', features: ['Grid snapping', 'Rotación 3D', 'Materiales', 'Undo/Redo'], sales: 156, reviews: [], banner: 'https://via.placeholder.com/800x400/ff9100/ffffff?text=Build+System' },
    { id: 5, name: 'VIP System', description: 'Sistema VIP con perks exclusivos y beneficios especiales.', price: 1500, category: 'admin', icon: 'fa-crown', features: ['Perks exclusivos', 'Salas VIP', 'Comandos', 'Insignias'], sales: 278, reviews: [], banner: 'https://via.placeholder.com/800x400/9c27b0/ffffff?text=VIP+System' },
    { id: 6, name: 'Data Store Manager', description: 'Sistema de guardado de datos con respaldo automático.', price: 2200, category: 'economy', icon: 'fa-database', features: ['Auto-save', 'Backups', 'Recuperación', 'Sincronización'], sales: 145, reviews: [], banner: 'https://via.placeholder.com/800x400/607d8b/ffffff?text=Data+Store' },
    { id: 7, name: 'Anti-Cheat System', description: 'Protección avanzada contra hackers y exploits.', price: 3500, category: 'admin', icon: 'fa-shield-virus', features: ['Detección', 'Auto-ban', 'Logs', 'Protección'], sales: 198, reviews: [], banner: 'https://via.placeholder.com/800x400/ff1744/ffffff?text=Anti+Cheat' },
    { id: 8, name: 'Trading System', description: 'Sistema de intercambio seguro entre jugadores.', price: 2800, category: 'economy', icon: 'fa-arrow-right-arrow-left', features: ['Seguro', 'Historial', 'Notificaciones', 'Anti-scam'], sales: 167, reviews: [], banner: 'https://via.placeholder.com/800x400/00bcd4/ffffff?text=Trading+System' }
];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let supabase = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {}

    await checkUserSession();
    renderFeaturedProducts();
    renderProducts();
    updateCartCount();
    setupSearchAndFilters();
    updateHeroStats();
});

async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    if (guestMenu) guestMenu.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            document.getElementById('userAvatar').src = session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/32';
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            });
        }
    } catch (e) {}
}

function renderFeaturedProducts() {
    const featured = products.filter(p => p.sales >= 200).slice(0, 3);
    if (featured.length === 0) featured.push(...products.slice(0, 3));
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = featured.map((p, index) => `
        <div class="featured-product-card featured-anim-${index + 1}" onclick="showProductModal(${p.id})">
            <div class="featured-glow"></div>
            <div class="featured-badge">
                <span class="material-icons">local_fire_department</span>
                <span>Destacado</span>
            </div>
            <div class="featured-image">
                <i class="fas ${p.icon}"></i>
                <div class="featured-particles">
                    <span class="particle"></span>
                    <span class="particle"></span>
                    <span class="particle"></span>
                </div>
            </div>
            <div class="featured-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p>${p.description.substring(0, 60)}...</p>
                <div class="featured-stats">
                    <span><span class="material-icons">star</span> Popular</span>
                    <span><span class="material-icons">download</span> ${p.sales} ventas</span>
                </div>
                <div class="featured-price-row">
                    <span class="featured-price">${p.price.toLocaleString()} Robux</span>
                    <button class="btn-featured-cart" onclick="event.stopPropagation(); addToCart(${p.id})">
                        <span class="material-icons">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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
            <div class="product-image" onclick="showProductModal(${p.id})">
                <i class="fas ${p.icon}"></i>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 onclick="showProductModal(${p.id})" style="cursor:pointer;">${p.name}</h3>
                <p onclick="showProductModal(${p.id})" style="cursor:pointer;">${p.description.substring(0, 70)}...</p>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-value">${p.price.toLocaleString()}</span>
                        <span class="price-currency">Robux</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-view-details" onclick="showProductModal(${p.id})" title="Ver información">
                            <span class="material-icons">info</span>
                        </button>
                        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})" title="Agregar al carrito">
                            <span class="material-icons">add_shopping_cart</span>
                        </button>
                    </div>
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
    for (let i = 1; i <= totalPages; i++) html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
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

function getFilteredProducts() {
    let filtered = products;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    if (currentSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch) || p.description.toLowerCase().includes(currentSearch));
    return filtered;
}

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
    document.getElementById('searchInput')?.addEventListener('input', searchProducts);
    document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => filterProducts(b.dataset.category)));
}

window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.quantity++; else cart.push({ ...product, quantity: 1 });
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${product.name} agregado al carrito`, 'success');
};

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

window.showProductModal = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingModal = document.querySelector('.product-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="modal-close-btn"><span class="material-icons">close</span></button>
            <div class="modal-banner" style="background-image: url('${product.banner}')">
                <div class="modal-banner-overlay"></div>
                <div class="modal-banner-content">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.name}</h2>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-main-info">
                    <p class="modal-description">${product.description}</p>
                    <div class="modal-features">
                        <h4>Características</h4>
                        <div class="features-grid-inline">
                            ${product.features.map(f => `<div class="feature-item-inline"><span class="material-icons">check_circle</span><span>${f}</span></div>`).join('')}
                        </div>
                    </div>
                    <div class="modal-price-row">
                        <div class="modal-price"><span>${product.price.toLocaleString()}</span> Robux</div>
                        <div class="modal-actions">
                            <button class="btn-primary" id="modalAddToCart"><span class="material-icons">add_shopping_cart</span> Agregar</button>
                            <button class="btn-outline" id="modalBuyNow"><span class="material-icons">bolt</span> Comprar Ahora</button>
                        </div>
                    </div>
                </div>
                <div class="review-section">
                    <h4>Reseñas (${(product.reviews || []).length})</h4>
                    <div class="reviews-container" id="reviewsList">
                        ${(product.reviews || []).length > 0 ? product.reviews.map(r => `
                            <div class="review-item">
                                <div class="review-header"><strong>${r.user}</strong><span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span></div>
                                <p>${r.comment}</p>
                            </div>
                        `).join('') : '<p class="no-reviews">Sé el primero en dejar una reseña</p>'}
                    </div>
                    <div class="add-review">
                        <h5>Deja tu reseña</h5>
                        <div class="star-selector">${[5,4,3,2,1].map(s => `<span class="star" data-stars="${s}">☆</span>`).join('')}</div>
                        <textarea id="reviewComment" placeholder="Escribe tu experiencia..."></textarea>
                        <button class="btn-primary btn-sm" id="submitReview">Enviar reseña</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };

    modal.querySelector('.modal-close-btn').onclick = closeModal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    });

    modal.querySelector('#modalAddToCart').onclick = () => { addToCart(productId); closeModal(); };
    modal.querySelector('#modalBuyNow').onclick = () => { addToCart(productId); window.location.href = 'cart.html'; };

    let selectedStars = 0;
    modal.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectedStars = parseInt(this.dataset.stars);
            modal.querySelectorAll('.star').forEach((s, idx) => {
                s.textContent = idx < selectedStars ? '★' : '☆';
                s.style.color = idx < selectedStars ? '#ffd600' : 'var(--text-muted)';
            });
        });
    });

    modal.querySelector('#submitReview').onclick = () => {
        const comment = modal.querySelector('#reviewComment').value.trim();
        if (!selectedStars) { showNotification('Selecciona una calificación', 'error'); return; }
        product.reviews = product.reviews || [];
        product.reviews.unshift({ user: 'Tú', stars: selectedStars, comment: comment || 'Sin comentario' });
        modal.querySelector('#reviewsList').innerHTML = product.reviews.map(r => `
            <div class="review-item">
                <div class="review-header"><strong>${r.user}</strong><span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span></div>
                <p>${r.comment}</p>
            </div>
        `).join('');
        modal.querySelector('.review-section h4').textContent = `Reseñas (${product.reviews.length})`;
        modal.querySelector('#reviewComment').value = '';
        modal.querySelectorAll('.star').forEach(s => { s.textContent = '☆'; s.style.color = 'var(--text-muted)'; });
        selectedStars = 0;
        updateHeroStats();
        renderFeaturedProducts();
        showNotification('Reseña publicada', 'success');
    };
};

function updateHeroStats() {
    document.getElementById('totalSystems').textContent = products.length;
    const orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    const total = 1250 + orders.length;
    document.getElementById('totalClients').textContent = total >= 1000 ? (total / 1000).toFixed(1) + 'k+' : total;
    document.getElementById('avgRating').textContent = '4.7';
}

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
