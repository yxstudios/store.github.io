// Sistema de Temas YX Studios
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('yx-theme') || 'red';
        this.applyTheme(savedTheme);
        this.setupListeners();
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('yx-theme', theme);

        // Actualizar botones activos
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        // Cambiar logo según el tema
        const logoImg = document.getElementById('siteLogo');
        if (logoImg && THEME_LOGOS[theme]) {
            logoImg.src = THEME_LOGOS[theme];
        }
    },

    setupListeners() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyTheme(btn.dataset.theme);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
