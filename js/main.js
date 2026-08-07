// ============================================
// YX STUDIOS - MAIN JS (HOME PAGE)
// ============================================

// Productos disponibles
const products = [
    {
        id: 1,
        name: 'Admin System Pro',
        description: 'Sistema de administración completo con comandos avanzados y panel de control.',
        price: 2500,
        category: 'admin',
        icon: 'fa-shield-halved',
        features: ['Comandos avanzados', 'Panel de control', 'Sistema de rangos', 'Anti-exploit'],
        rating: 4.8,
        sales: 234
    },
    {
        id: 2,
        name: 'Economy System',
        description: 'Sistema económico con tiendas, inventario y monedas personalizables.',
        price: 1800,
        category: 'economy',
        icon: 'fa-coins',
        features: ['Tiendas', 'Inventario', 'Trading', 'Monedas'],
        rating: 4.6,
        sales: 189
    },
    {
        id: 3,
        name: 'Combat Engine',
        description: 'Motor de combate avanzado con hitboxes y habilidades especiales.',
        price: 3000,
        category: 'combat',
        icon: 'fa-hand-fist',
        features: ['Hitboxes', 'Combos', 'Habilidades', 'Efectos'],
        rating: 4.9,
        sales: 312
    },
    {
        id: 4,
        name: 'Build System',
        description: 'Sistema de construcción intuitivo con grid snapping.',
        price: 2000,
        category: 'building',
        icon: 'fa-hammer',
        features: ['Grid snapping', 'Rotación 3D', 'Materiales', 'Undo/Redo'],
        rating: 4.5,
        sales: 156
    },
    {
        id: 5,
        name: 'VIP System',
        description: 'Sistema VIP con perks exclusivos y beneficios especiales.',
        price: 1500,
        category: 'admin',
        icon: 'fa-crown',
        features: ['Perks exclusivos', 'Salas VIP', 'Comandos', 'Insignias'],
        rating: 4.7,
        sales: 278
    },
    {
        id: 6,
        name: 'Data Store Manager',
        description: 'Sistema de guardado de datos con respaldo automático.',
        price: 2200,
        category: 'economy',
        icon: 'fa-database',
        features: ['Auto-save', 'Backups', 'Recuperación', 'Sincronización'],
        rating: 4.4,
        sales: 145
    }
];

// ============================================
// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 YX Studios - Home Page');
    
    // 1. Verificar sesión de usuario
    await checkUserSession();
    
    // 2. Cargar productos
    renderProducts(products);
    
    // 3. Actualizar contador del carrito
    updateCartCount();
    
    // 4. Configurar búsqueda y filtros
    setupSearchAndFilters();
    
    console.log('✅ Home Page lista');
});

// ============================================
// VERIFICAR SESIÓN DE USUARIO
// ============================================
async function checkUserSession() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    
    // Por defecto mostrar menú de invitado
    if (guestMenu) guestMenu.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    
    try {
        // Importar Supabase dinámicamente
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Obtener sesión
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
            console.log('✅ Usuario logueado:', session.user.email);
            
            // Ocultar menú de invitado
            if (guestMenu) guestMenu.style.display = 'none';
            
            // Mostrar menú de usuario
            if (userMenu) {
                userMenu.style.display = 'flex';
                
                // Actualizar nombre de usuario
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) {
                    const fullName = session.user.user_metadata?.full_name;
                    const email = session.user.email;
                    userNameDisplay.textContent = fullName || email.split('@')[0] || 'Usuario';
                }
                
                // Actualizar avatar
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    const avatarUrl = session.user.user_metadata?.avatar_url;
                    userAvatar.src = avatarUrl || 'https://via.placeholder.com/32';
                }
            }
            
            // Configurar logout
            setupLogout(supabase);
            
        } else {
            console.log('👤 Usuario no logueado');
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// ============================================
// CONFIGURAR LOGOUT
// ============================================
function setupLogout(supabase) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    // Remover listeners antiguos clonando el botón
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    
    newBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await supabase.auth.signOut();
            console.log('👋 Sesión cerrada');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
        
        // Limpiar localStorage y redirigir
        window.location.href = 'index.html';
    });
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('No se encontró el elemento productsGrid');
        return;
    }
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <span class="material-icons">search_off</span>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros filtros o términos de búsqueda</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
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
                    ${product.features.slice(0, 3).map(f => `<span class="feature-tag">✓ ${f}</span>`).join('')}
                </div>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-value">${product.price.toLocaleString()}</span>
                        <span class="price-currency">Robux</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})" title="Agregar al carrito">
                            <span class="material-icons">add_shopping_cart</span>
                        </button>
                        <button class="btn-view-details" onclick="showProductDetails(${product.id})" title="Ver detalles">
                            <span class="material-icons">visibility</span>
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
    if (!product) {
        console.error('Producto no encontrado:', productId);
        return;
    }
    
    // Obtener carrito actual
    let cart = JSON.parse(localStorage.getItem('yxCart')) || [];
    
    // Buscar si el producto ya está en el carrito
    const existingIndex = cart.findIndex(item => item.id === productId);
    
    if (existingIndex !== -1) {
        // Si ya existe, aumentar cantidad
        cart[existingIndex].quantity += 1;
        showNotification('Cantidad actualizada - ' + product.name, 'success');
    } else {
        // Si no existe, agregarlo
        cart.push({ 
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            icon: product.icon,
            features: product.features,
            quantity: 1 
        });
        showNotification(product.name + ' agregado al carrito', 'success');
    }
    
    // Guardar en localStorage
    localStorage.setItem('yxCart', JSON.stringify(cart));
    
    // Actualizar badge del carrito
    updateCartCount();
};

// ============================================
// MOSTRAR DETALLES DEL PRODUCTO (MODAL)
// ============================================
window.showProductDetails = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal">
            <button class="modal-close">
                <span class="material-icons">close</span>
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
                            ${product.features.map(f => `<li><span class="material-icons">check</span> ${f}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="modal-price">
                        <span>${product.price.toLocaleString()}</span> Robux
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" id="modalAddToCart">
                            <span class="material-icons">add_shopping_cart</span> Agregar al Carrito
                        </button>
                        <button class="btn-outline" id="modalBuyNow">
                            <span class="material-icons">bolt</span> Comprar Ahora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal con el botón X
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Cerrar modal con tecla ESC
    function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    }
    document.addEventListener('keydown', escHandler);
    
    // Botón Agregar al Carrito dentro del modal
    modal.querySelector('#modalAddToCart').addEventListener('click', function() {
        addToCart(productId);
        modal.remove();
    });
    
    // Botón Comprar Ahora dentro del modal
    modal.querySelector('#modalBuyNow').addEventListener('click', function() {
        addToCart(productId);
        modal.remove();
        window.location.href = 'cart.html';
    });
};

// ============================================
// FILTRAR PRODUCTOS POR CATEGORÍA
// ============================================
window.filterProducts = function(category) {
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Filtrar productos
    let filtered;
    if (category === 'all' || !category) {
        filtered = products;
    } else {
        filtered = products.filter(p => p.category === category);
    }
    
    // También aplicar búsqueda si hay texto
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts(filtered);
};

// ============================================
// BÚSQUEDA DE PRODUCTOS
// ============================================
window.searchProducts = function() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
    
    let filtered;
    if (activeCategory === 'all') {
        filtered = products;
    } else {
        filtered = products.filter(p => p.category === activeCategory);
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
};

// ============================================
// CONFIGURAR BÚSQUEDA Y FILTROS
// ============================================
function setupSearchAndFilters() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }
    
    // Botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterProducts(this.dataset.category);
        });
    });
}

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('yxCart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ============================================
// NOTIFICACIONES TOAST
// ============================================
function showNotification(message, type) {
    // Eliminar notificación existente
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const icons = {
        'success': 'check_circle',
        'error': 'error',
        'info': 'info'
    };
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <span class="material-icons">${icons[type] || 'info'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Mostrar con animación
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ============================================
// ESCUCHAR CAMBIOS EN EL CARRITO
// ============================================
window.addEventListener('storage', function(e) {
    if (e.key === 'yxCart') {
        updateCartCount();
    }
});
