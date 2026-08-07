import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Productos
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

// Estado del carrito
let cart = JSON.parse(localStorage.getItem('yxCart')) || [];

// Renderizar productos
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-search"></i><p>No se encontraron productos</p></div>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
                <span class="product-rating"><i class="fas fa-star"></i> ${product.rating}</span>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 80)}...</p>
                <div class="product-features">
                    ${product.features.slice(0, 2).map(f => `<span class="feature-tag">✓ ${f}</span>`).join('')}
                </div>
                <div class="product-footer">
                    <div class="product-price">🎮 ${product.price.toLocaleString()}</div>
                    <button class="btn-add-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Agregar al carrito
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('yxCart', JSON.stringify(cart));
    updateCartCount();
    showToast('Producto agregado al carrito 🛒');
};

// Actualizar contador del carrito
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Filtrar productos
function filterProducts(category) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let filtered = products;
    
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts(filtered);
}

// Actualizar UI según sesión
async function updateUI() {
    const { data: { session } } = await supabase.auth.getSession();
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    
    if (session) {
        if (guestMenu) guestMenu.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            document.getElementById('userNameDisplay').textContent = 
                session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            
            const avatar = document.getElementById('userAvatar');
            if (avatar && session.user.user_metadata?.avatar_url) {
                avatar.src = session.user.user_metadata.avatar_url;
            }
        }
    } else {
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Toast notification
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
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
    updateUI();
    renderProducts(products);
    updateCartCount();
    
    // Filtros de categoría
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(btn.dataset.category);
        });
    });
    
    // Búsqueda
    document.getElementById('searchInput')?.addEventListener('input', () => {
        const activeCat = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
        filterProducts(activeCat);
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.reload();
    });
});
