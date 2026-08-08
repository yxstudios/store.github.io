// ============================================
// YX STUDIOS - AUTENTICACIÓN
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// LOGIN CON EMAIL
// ============================================
async function signInWithEmail(email, password) {
    try {
        showLoading(true);
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        
        if (error) throw error;
        
        showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message, 'error');
        showLoading(false);
    }
}

// ============================================
// REGISTRO CON EMAIL
// ============================================
async function signUpWithEmail(name, email, password) {
    try {
        showLoading(true);
        var { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name }
            }
        });
        
        if (error) throw error;
        
        showMessage('Cuenta creada exitosamente. Redirigiendo...', 'success');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message, 'error');
        showLoading(false);
    }
}

// ============================================
// LOGIN CON DISCORD
// ============================================
async function signInWithDiscord() {
    try {
        var { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        
        if (error) throw error;
    } catch (error) {
        showMessage('Error al conectar con Discord: ' + error.message, 'error');
    }
}

// ============================================
// FORGOT PASSWORD
// ============================================
async function resetPassword(email) {
    try {
        showLoading(true);
        var { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        showMessage('Se ha enviado un enlace a tu correo para restablecer la contraseña.', 'success');
        showLoading(false);
    } catch (error) {
        showMessage(error.message, 'error');
        showLoading(false);
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ============================================
// MOSTRAR MENSAJES
// ============================================
function showMessage(message, type) {
    var messageElement = document.getElementById('authMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'auth-message ' + type;
        setTimeout(function() {
            messageElement.className = 'auth-message';
        }, 5000);
    }
}

// ============================================
// LOADING
// ============================================
function showLoading(show) {
    var submitBtn = document.querySelector('.btn-primary[type="submit"]');
    if (submitBtn) {
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Cargando...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalHtml || submitBtn.innerHTML;
        }
    }
}

// ============================================
// TOGGLE PASSWORD
// ============================================
function setupTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target.type === 'password') {
                target.type = 'text';
                this.textContent = 'visibility';
            } else {
                target.type = 'password';
                this.textContent = 'visibility_off';
            }
        });
    });
}

// ============================================
// FORGOT PASSWORD TOGGLE
// ============================================
function setupForgotPassword() {
    var showBtn = document.getElementById('showForgotPassword');
    var backBtn = document.getElementById('backToLogin');
    var loginForm = document.getElementById('loginForm');
    var forgotForm = document.getElementById('forgotPasswordForm');
    
    if (showBtn) {
        showBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            forgotForm.style.display = 'block';
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            forgotForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
}

// ============================================
// PASSWORD STRENGTH
// ============================================
function setupPasswordStrength() {
    var passwordInput = document.getElementById('registerPassword');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        var password = this.value;
        var strengthFill = document.getElementById('strengthFill');
        var strengthText = document.getElementById('strengthText');
        
        if (!strengthFill || !strengthText) return;
        
        var strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        var percentages = ['0%', '25%', '50%', '75%', '100%'];
        var colors = ['#ff1744', '#ff9100', '#ffd600', '#76ff03', '#00e676'];
        var texts = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
        
        strengthFill.style.width = percentages[strength] || '0%';
        strengthFill.style.background = colors[strength] || colors[0];
        strengthText.textContent = texts[strength] || texts[0];
        strengthText.style.color = colors[strength] || colors[0];
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar sesión existente
    var { data: { session } } = await supabase.auth.getSession();
    if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
        window.location.href = 'index.html';
        return;
    }
    
    // Guardar HTML original de botones
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) {
        btn.dataset.originalHtml = btn.innerHTML;
    });
    
    // Login form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('loginEmail').value;
            var password = document.getElementById('loginPassword').value;
            signInWithEmail(email, password);
        });
    }
    
    // Register form
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = document.getElementById('registerName').value;
            var email = document.getElementById('registerEmail').value;
            var password = document.getElementById('registerPassword').value;
            signUpWithEmail(name, email, password);
        });
    }
    
    // Forgot password form
    var forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('resetEmail').value;
            resetPassword(email);
        });
    }
    
    // Discord buttons
    var discordLogin = document.getElementById('discordLogin');
    var discordRegister = document.getElementById('discordRegister');
    if (discordLogin) discordLogin.addEventListener('click', signInWithDiscord);
    if (discordRegister) discordRegister.addEventListener('click', signInWithDiscord);
    
    // Setup toggle password
    setupTogglePassword();
    
    // Setup forgot password
    setupForgotPassword();
    
    // Setup password strength
    setupPasswordStrength();
});

// Exportar signOut para usar en otras páginas
window.signOut = signOut;
