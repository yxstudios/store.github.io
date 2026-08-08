// Sistema de Temas YX Studios
var ThemeManager = {
    init() {
        var savedTheme = localStorage.getItem('yx-theme') || 'red';
        this.applyTheme(savedTheme);
        this.setupListeners();
    },
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('yx-theme', theme);
        document.querySelectorAll('.theme-option').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        var logoImg = document.getElementById('siteLogo');
        if (logoImg && THEME_LOGOS[theme]) {
            logoImg.src = THEME_LOGOS[theme];
        }
    },
    setupListeners() {
        var self = this;
        document.querySelectorAll('.theme-option').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.applyTheme(btn.dataset.theme);
            });
        });
    }
};
document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.init();
});
