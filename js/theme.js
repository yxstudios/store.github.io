// Sistema de Temas
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('yx-theme') || 'red';
        this.applyTheme(savedTheme);
        this.setupListeners();
    },
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('yx-theme', theme);
        
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },
    
    setupListeners() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyTheme(btn.dataset.theme);
            });
        });
    }
};

// Iniciar
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
