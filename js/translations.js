// ============================================
// SISTEMA DE TRADUCCIONES
// ============================================
var TRANSLATIONS = {
    es: {
        home: 'Home', products: 'Productos', cart: 'Carrito', login: 'Iniciar Sesión',
        register: 'Registrarse', profile: 'Mi Perfil', logout: 'Cerrar Sesión',
        search: 'Buscar sistemas...', featured: 'Destacados', all: 'Todos',
        admin: 'Admin', economy: 'Economía', combat: 'Combate', building: 'Construcción',
        view_products: 'Ver Productos', all_products: 'Todos los Sistemas',
        all_products_sub: 'Explora nuestra colección completa',
        featured_title: 'Productos Destacados', featured_subtitle: 'Los más populares',
        why_us: '¿Por qué elegirnos?', why_us_sub: 'Ofrecemos los mejores sistemas para tu juego de Roblox',
        security: 'Seguridad Garantizada', security_desc: 'Sistemas anti-exploit',
        performance: 'Alto Rendimiento', performance_desc: 'Optimizados',
        support: 'Soporte 24/7', support_desc: 'Instalación y ayuda',
        updates: 'Actualizaciones Gratis', updates_desc: 'Sin costo adicional',
        hero_badge: 'Sistemas profesionales para Roblox',
        hero_title: 'Lleva tu juego al siguiente nivel',
        hero_desc: 'Los mejores sistemas de administración, economía, combate y construcción para tu juego de Roblox.',
        systems: 'Sistemas', clients: 'Clientes', rating: 'Calificación',
        links: 'Enlaces', support_title: 'Soporte', contact: 'Contacto', terms: 'Términos',
        footer_desc: 'Sistemas para Roblox desde 2020', rights: 'Todos los derechos reservados.',
        promo_text: '50% de descuento - Usa el código: VIP50',
        add_to_cart: 'Agregar', robux: 'Robux'
    },
    en: {
        home: 'Home', products: 'Products', cart: 'Cart', login: 'Sign In',
        register: 'Sign Up', profile: 'My Profile', logout: 'Logout',
        search: 'Search systems...', featured: 'Featured', all: 'All',
        admin: 'Admin', economy: 'Economy', combat: 'Combat', building: 'Building',
        view_products: 'View Products', all_products: 'All Systems',
        all_products_sub: 'Explore our complete collection',
        featured_title: 'Featured Products', featured_subtitle: 'Most Popular',
        why_us: 'Why choose us?', why_us_sub: 'We offer the best systems for your Roblox game',
        security: 'Guaranteed Security', security_desc: 'Anti-exploit systems',
        performance: 'High Performance', performance_desc: 'Optimized',
        support: '24/7 Support', support_desc: 'Installation and help',
        updates: 'Free Updates', updates_desc: 'No additional cost',
        hero_badge: 'Professional systems for Roblox',
        hero_title: 'Take your game to the next level',
        hero_desc: 'The best administration, economy, combat and building systems for your Roblox game.',
        systems: 'Systems', clients: 'Clients', rating: 'Rating',
        links: 'Links', support_title: 'Support', contact: 'Contact', terms: 'Terms',
        footer_desc: 'Roblox systems since 2020', rights: 'All rights reserved.',
        promo_text: '50% off - Use code: VIP50',
        add_to_cart: 'Add', robux: 'Robux'
    },
    pt: {
        home: 'Início', products: 'Produtos', cart: 'Carrinho', login: 'Entrar',
        register: 'Cadastrar', profile: 'Meu Perfil', logout: 'Sair',
        search: 'Buscar sistemas...', featured: 'Destacados', all: 'Todos',
        admin: 'Admin', economy: 'Economia', combat: 'Combate', building: 'Construção',
        view_products: 'Ver Produtos', all_products: 'Todos os Sistemas',
        all_products_sub: 'Explore nossa coleção completa',
        featured_title: 'Produtos Destacados', featured_subtitle: 'Mais Populares',
        why_us: 'Por que nos escolher?', why_us_sub: 'Oferecemos os melhores sistemas para seu jogo Roblox',
        security: 'Segurança Garantida', security_desc: 'Sistemas anti-exploit',
        performance: 'Alto Desempenho', performance_desc: 'Otimizados',
        support: 'Suporte 24/7', support_desc: 'Instalação e ajuda',
        updates: 'Atualizações Grátis', updates_desc: 'Sem custo adicional',
        hero_badge: 'Sistemas profissionais para Roblox',
        hero_title: 'Leve seu jogo ao próximo nível',
        hero_desc: 'Os melhores sistemas de administração, economia, combate e construção para seu jogo Roblox.',
        systems: 'Sistemas', clients: 'Clientes', rating: 'Avaliação',
        links: 'Links', support_title: 'Suporte', contact: 'Contato', terms: 'Termos',
        footer_desc: 'Sistemas Roblox desde 2020', rights: 'Todos os direitos reservados.',
        promo_text: '50% de desconto - Use o código: VIP50',
        add_to_cart: 'Adicionar', robux: 'Robux'
    }
};

function getLang() { return localStorage.getItem('yxLang') || 'es'; }
function t(key) { var lang = getLang(); return TRANSLATIONS[lang] ? (TRANSLATIONS[lang][key] || TRANSLATIONS['es'][key] || key) : (TRANSLATIONS['es'][key] || key); }

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.dataset.i18n;
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
            el.placeholder = t(key);
        } else if (el.tagName === 'SPAN' || el.tagName === 'A' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'BUTTON' || el.tagName === 'LABEL') {
            var icon = el.querySelector('.material-icons, .fas, .fab');
            var text = t(key);
            if (icon) {
                el.innerHTML = icon.outerHTML + ' ' + text;
            } else {
                el.textContent = text;
            }
        }
    });
}
