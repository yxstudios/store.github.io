import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PRODUCTOS
// ============================================
const products = [
    {
        id: 1,
        name: 'Admin System Pro',
        description: 'Sistema de administración completo con comandos avanzados, panel de control y sistema de rangos.',
        price: 2500,
        category: 'admin',
        icon: 'fa-shield-halved',
        features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit'],
        rating: 4.8,
        sales: 234,
        image: null
    },
    {
        id: 2,
        name: 'Economy System',
        description: 'Sistema económico con tiendas, inventario, trading y monedas personalizables.',
        price: 1800,
        category: 'economy',
        icon: 'fa-coins',
        features: ['Tiendas', 'Inventario', 'Trading', 'Monedas personalizables'],
        rating: 4.6,
        sales: 189,
        image: null
    },
    {
        id: 3,
        name: 'Combat Engine',
        description: 'Motor de combate avanzado con hitboxes, combos, habilidades y efectos especiales.',
        price: 3000,
        category: 'combat',
        icon: 'fa-hand-fist',
        features: ['Hitboxes precisos', 'Sistema de combos', 'Habilidades', 'Efectos visuales'],
        rating: 4.9,
        sales: 312,
        image: null
    },
    {
        id: 4,
        name: 'Build System',
        description: 'Sistema de construcción intuitivo con grid snapping, rotación y materiales.',
        price: 2000,
        category: 'building',
        icon: 'fa-hammer',
        features: ['Grid snapping', 'Rotación 3D', 'Múltiples materiales', 'Undo/Redo'],
        rating: 4.5,
        sales: 156,
        image: null
    },
    {
        id: 5,
        name: 'VIP System',
        description: 'Sistema VIP con perks exclusivos, salas privadas y beneficios especiales.',
        price: 1500,
        category: 'admin',
        icon: 'fa-crown',
        features: ['Perks exclusivos', 'Salas VIP', 'Comandos especiales', 'Insignias'],
        rating: 4.7,
        sales: 278,
        image: null
    },
    {
        id: 6,
        name: 'Data Store Manager',
        description: 'Sistema avanzado de guardado de datos con respaldo automático y recuperación.',
        price: 2200,
        category: 'economy',
        icon: 'fa-database',
        features: ['Auto-save', 'Backups', 'Recuperación', 'Sincronización'],
        rating: 4.4,
        sales: 145,
        image: null
    },
    {
        id: 7,
        name: 'Anti-Cheat System',
        description: 'Protege tu juego contra hackers y exploits con nuestro sistema anti-cheat avanzado.',
        price: 3500,
        category: 'admin',
        icon: 'fa-shield-virus',
        features: ['Detección de exploits', 'Auto-ban', 'Logs detallados', 'Protección remota'],
        rating: 4.9,
        sales: 198,
        image: null
    },
    {
        id: 8,
        name: 'Trading System',
        description: 'Sistema de intercambio entre jugadores con interfaz intuitiva y segura.',
        price: 2800,
        category: 'economy',
        icon: 'fa-arrow-right-arrow-left',
        features: ['Intercambio seguro', 'Historial', 'Notificaciones', 'Anti-scam'],
        rating: 4.7,
        sales: 167,
        image: null
    }
];

// ============================================
// CARRITO
// ============================================
let cart = JSON.parse(localStorage.getItem('yxCart')) || [];

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros filtros o términos de búsqueda</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
                <span class="product-rating">
                    <i class="fas fa-star"></i> ${product.rating}
                </span>
                ${product.sales > 200 ? '<span class="product-badge">Popular</span>' : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 80)}...</p>
                
                <div class="product-features">
                    ${product.features.slice(0, 3).map(f => 
                        `<span class="feature-tag">✓ ${f}</span>`
                    ).join('')}
                    ${product.features.length > 3 ? 
                        `<span class="feature-tag">+${product.features.length - 3} más</span>` : ''}
                </div>
                
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-value">${product.price.toLocaleString()}</span>
                        <span class="price-currency">Robux</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})" title="Agregar al carrito">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                        <button class="btn-view-details" onclick="viewProductDetails(${product.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// AGREGAR AL CARRITO
// ============================================
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = cart.findIndex(item => item.id === productId);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
        showToast(`✅ Cantidad actualizada (${cart[existingIndex].quantity}) - ${product.name}`);
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`🛒 ¡${product.name} agregado al carrito!`);
    }
    
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    
    // Animación en el botón
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (productCard) {
        productCard.classList.add('added-to-cart');
        setTimeout(() => productCard.classList.remove('added-to-cart'), 600);
    }
};

// ============================================
// VER DETALLES DEL PRODUCTO
// ============================================
window.viewProductDetails = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="modal-close" onclick="this.closest('.product-modal-overlay').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="modal-content">
                <div class="modal-image">
                    <i class="fas ${product.icon}"></i>
                </div>
                <div class="modal-info">
                    <span class="product-category">${product.category}</span>
                    <h2>${product.name}</h2>
                    <div class="modal-rating">
                        <i class="fas fa-star"></i> ${product.rating} 
                        <span>(${product.sales} ventas)</span>
                    </div>
                    <p class="modal-description">${product.description}</p>
                    
                    <div class="modal-features">
                        <h4>Características:</h4>
                        <ul>
                            ${product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="modal-price">
                        <span>${product.price.toLocaleString()}</span> Robux
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="addToCart(${product.id}); document.querySelector('.product-modal-overlay').remove();">
                            <i class="fas fa-cart-plus"></i> Agregar al Carrito
                        </button>
                        <button class="btn-outline" onclick="addToCart(${product.id}); window.location.href='cart.html';">
                            <i class="fas fa-bolt"></i> Comprar Ahora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Cerrar con ESC
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
};

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cartCount');
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ============================================
// FILTRAR PRODUCTOS
// ============================================
function filterProducts(category) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    
    let filtered = [...products];
    
    // Filtrar por categoría
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm) ||
            p.features.some(f => f.toLowerCase().includes(searchTerm))
        );
    }
    
    renderProducts(filtered);
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
            // Usuario logueado
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) {
                    const fullName = session.user.user_metadata?.full_name;
                    const email = session.user.email;
                    userNameDisplay.textContent = fullName || email?.split('@')[0] || 'Usuario';
                }
                
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    const avatarUrl = session.user.user_metadata?.avatar_url;
                    userAvatar.src = avatarUrl || 'https://via.placeholder.com/32';
                    userAvatar.onerror = () => {
                        userAvatar.src = 'https://via.placeholder.com/32';
                    };
                }
            }
        } else {
            // Usuario no logueado
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
    // Eliminar toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// SCROLL SUAVE
// ============================================
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 YX Studios - Inicializando...');
    
    // Actualizar UI según sesión
    updateUI();
    
    // Renderizar productos iniciales
    renderProducts(products);
    
    // Actualizar contador del carrito
    updateCartCount();
    
    // Configurar scroll suave
    setupSmoothScroll();
    
    // Filtros de categoría
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Agregar active al clickeado
            btn.classList.add('active');
            // Filtrar
            filterProducts(btn.dataset.category);
        });
    });
    
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
            filterProducts(activeCategory);
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
    
    console.log('✅ YX Studios - Inicializado correctamente');
});

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Estado de autenticación cambiado:', event);
    updateUI();
});
