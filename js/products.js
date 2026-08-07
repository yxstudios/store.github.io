import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PRODUCTOS
// ============================================
const products = [
    {
        id: 1,
        name: 'Admin System Pro',
        description: 'Sistema de administración completo con comandos avanzados, panel de control y sistema de rangos. Incluye más de 50 comandos diferentes y un panel intuitivo.',
        price: 2500,
        category: 'admin',
        icon: 'fa-shield-halved',
        features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit', 'Logs detallados'],
        rating: 4.8,
        sales: 234,
        longDescription: 'El sistema de administración más completo del mercado. Incluye comandos como kick, ban, teleport, god mode, y mucho más. Panel de control intuitivo con estadísticas en tiempo real.'
    },
    {
        id: 2,
        name: 'Economy System',
        description: 'Sistema económico con tiendas, inventario, trading y monedas personalizables.',
        price: 1800,
        category: 'economy',
        icon: 'fa-coins',
        features: ['Tiendas', 'Inventario', 'Trading', 'Monedas personalizables', 'Bancos'],
        rating: 4.6,
        sales: 189,
        longDescription: 'Sistema económico completo para tu juego. Incluye tiendas funcionales, sistema de inventario, trading entre jugadores y monedas totalmente personalizables.'
    },
    {
        id: 3,
        name: 'Combat Engine',
        description: 'Motor de combate avanzado con hitboxes, combos, habilidades y efectos especiales.',
        price: 3000,
        category: 'combat',
        icon: 'fa-hand-fist',
        features: ['Hitboxes precisos', 'Sistema de combos', 'Habilidades', 'Efectos visuales', 'Sistema de bloqueo'],
        rating: 4.9,
        sales: 312,
        longDescription: 'Motor de combate profesional con hitboxes precisos, sistema de combos fluidos, habilidades especiales y efectos visuales impresionantes.'
    },
    {
        id: 4,
        name: 'Build System',
        description: 'Sistema de construcción intuitivo con grid snapping, rotación y materiales.',
        price: 2000,
        category: 'building',
        icon: 'fa-hammer',
        features: ['Grid snapping', 'Rotación 3D', 'Múltiples materiales', 'Undo/Redo', 'Preview'],
        rating: 4.5,
        sales: 156,
        longDescription: 'Sistema de construcción fácil de usar con grid snapping, rotación en 3D, múltiples materiales y función de deshacer/rehacer.'
    },
    {
        id: 5,
        name: 'VIP System',
        description: 'Sistema VIP con perks exclusivos, salas privadas y beneficios especiales.',
        price: 1500,
        category: 'admin',
        icon: 'fa-crown',
        features: ['Perks exclusivos', 'Salas VIP', 'Comandos especiales', 'Insignias', 'Boost de XP'],
        rating: 4.7,
        sales: 278,
        longDescription: 'Sistema VIP premium que permite a tus jugadores obtener beneficios exclusivos, acceso a salas privadas y comandos especiales.'
    },
    {
        id: 6,
        name: 'Data Store Manager',
        description: 'Sistema avanzado de guardado de datos con respaldo automático y recuperación.',
        price: 2200,
        category: 'economy',
        icon: 'fa-database',
        features: ['Auto-save', 'Backups', 'Recuperación', 'Sincronización', 'Compresión'],
        rating: 4.4,
        sales: 145,
        longDescription: 'Gestor de datos avanzado con guardado automático, backups programados, recuperación de datos y sincronización entre servidores.'
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
        longDescription: 'Sistema anti-cheat de última generación que detecta y previene exploits, hacks y trampas en tu juego.'
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
        longDescription: 'Sistema de trading seguro que permite a los jugadores intercambiar items de forma segura con protección anti-estafas.'
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
    
    // Animación
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
                    <p class="modal-description">${product.longDescription || product.description}</p>
                    
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
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
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
    
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
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
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
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
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 YX Studios - Products Page');
    
    updateUI();
    renderProducts(products);
    updateCartCount();
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(btn.dataset.category);
        });
    });
    
    // Búsqueda
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
            window.location.href = 'index.html';
        });
    }
    
    console.log('✅ Products Page - Listo');
});

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event);
    updateUI();
});
