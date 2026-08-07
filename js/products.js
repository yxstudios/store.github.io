import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Productos de ejemplo
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
        sales: 234
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
        sales: 189
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
        sales: 312
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
        sales: 156
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
        sales: 278
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
        sales: 145
    }
];

// Cargar carrito desde localStorage
let cart = JSON.parse(localStorage.getItem('rbxCart')) || [];

// Renderizar productos
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<p class="empty-state">No se encontraron productos</p>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
                ${product.rating ? `
                    <div class="product-rating">
                        <i class="fas fa-star"></i> ${product.rating}
                    </div>
                ` : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-category">${product.category}</span>
                <p>${product.description.substring(0, 100)}...</p>
                
                <div class="product-features">
                    ${product.features.slice(0, 2).map(f => 
                        `<span class="feature-tag">✓ ${f}</span>`
                    ).join('')}
                    ${product.features.length > 2 ? 
                        `<span class="feature-tag">+${product.features.length - 2} más</span>` 
                        : ''}
                </div>
                
                <div class="product-stats">
                    <span><i class="fas fa-shopping-cart"></i> ${product.sales} ventas</span>
                </div>
                
                <div class="product-price">
                    <span class="price-amount">🎮 ${product.price.toLocaleString()}</span>
                    <span class="price-label">Robux</span>
                </div>
                
                <div class="product-actions">
                    <button class="btn-buy" onclick='addToCartHandler(${JSON.stringify(product)})'>
                        <i class="fas fa-cart-plus"></i> Agregar al Carrito
                    </button>
                    <button class="btn-details" onclick="showProductDetails(${product.id})">
                        <i class="fas fa-info-circle"></i> Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Manejador para agregar al carrito
window.addToCartHandler = function(product) {
    // Verificar si ya existe en el carrito
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        showToast('✅ Cantidad actualizada en el carrito');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast('🎉 ¡Producto agregado al carrito!');
    }
    
    localStorage.setItem('rbxCart', JSON.stringify(cart));
    updateCartBadge();
};

// Mostrar detalles del producto
window.showProductDetails = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                <i class="fas ${product.icon}"></i>
            </div>
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                <span class="product-category">${product.category}</span>
                <div class="rating">
                    <i class="fas fa-star"></i> ${product.rating} (${product.sales} ventas)
                </div>
                <p class="description">${product.description}</p>
                
                <h4>Características:</h4>
                <ul class="features-list">
                    ${product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                </ul>
                
                <div class="product-price-large">
                    🎮 ${product.price.toLocaleString()} Robux
                </div>
                
                <button class="btn-buy" onclick='addToCartHandler(${JSON.stringify(product)})'>
                    <i class="fas fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
};

// Filtrar productos
function filterProducts(category) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filtered = products;
    
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm) ||
            p.features.some(f => f.toLowerCase().includes(searchTerm))
        );
    }
    
    renderProducts(filtered);
}

// Actualizar badge del carrito
function updateCartBadge() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos iniciales
    renderProducts(products);
    updateCartBadge();
    
    // Filtros por categoría
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(btn.dataset.category);
        });
    });
    
    // Búsqueda
    document.getElementById('searchInput')?.addEventListener('input', () => {
        const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
        filterProducts(activeCategory);
    });
    
    // Cerrar modal
    document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
    });
    
    window.onclick = (event) => {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
});
