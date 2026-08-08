// ============================================
// YX STUDIOS - AUTENTICACIÓN
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = window.location.origin + '/store.github.io';

console.log('Auth JS - Base URL:', BASE_URL);

async function signInWithEmail(email, password) {
    try {
        showLoading(true);
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        showMessage('Inicio de sesión exitoso.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

async function signUpWithEmail(name, email, password) {
    try {
        showLoading(true);
        var { data, error } = await supabase.auth.signUp({ email: email, password: password, options: { data: { full_name: name } } });
        if (error) throw error;
        showMessage('Cuenta creada exitosamente.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

async function signInWithDiscord() {
    try {
        var redirectUrl = BASE_URL + '/index.html';
        console.log('Discord redirect:', redirectUrl);
        
        var { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: redirectUrl }
        });
        if (error) { showMessage('Error Discord: ' + error.message, 'error'); }
    } catch (error) { showMessage('Error: ' + error.message, 'error'); }
}

async function resetPassword(email) {
    try {
        showLoading(true);
        var { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: BASE_URL + '/reset-password.html' });
        if (error) throw error;
        showMessage('Enlace enviado a tu correo.', 'success');
        showLoading(false);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

async function signOut() { await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html'; }

function showMessage(message, type) {
    var msgEl = document.getElementById('authMessage');
    if (msgEl) { msgEl.textContent = message; msgEl.className = 'auth-message ' + type; setTimeout(function() { msgEl.className = 'auth-message'; }, 5000); }
}

function showLoading(show) {
    var submitBtn = document.querySelector('.btn-primary[type="submit"]');
    if (submitBtn) { submitBtn.disabled = show; submitBtn.innerHTML = show ? '<span class="spinner"></span> Cargando...' : (submitBtn.dataset.originalHtml || submitBtn.innerHTML); }
}

function setupTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target) { target.type = target.type === 'password' ? 'text' : 'password'; this.textContent = target.type === 'password' ? 'visibility_off' : 'visibility'; }
        });
    });
}

function setupForgotPassword() {
    var showBtn = document.getElementById('showForgotPassword'), backBtn = document.getElementById('backToLogin');
    var loginForm = document.getElementById('loginForm'), forgotForm = document.getElementById('forgotPasswordForm');
    if (showBtn) showBtn.addEventListener('click', function(e) { e.preventDefault(); loginForm.style.display = 'none'; forgotForm.style.display = 'block'; });
    if (backBtn) backBtn.addEventListener('click', function(e) { e.preventDefault(); forgotForm.style.display = 'none'; loginForm.style.display = 'block'; });
}

function setupPasswordStrength() {
    var passwordInput = document.getElementById('registerPassword');
    if (!passwordInput) return;
    passwordInput.addEventListener('input', function() {
        var password = this.value, strengthFill = document.getElementById('strengthFill'), strengthText = document.getElementById('strengthText');
        if (!strengthFill || !strengthText) return;
        var strength = 0;
        if (password.length >= 6) strength++; if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++; if (/[0-9]/.test(password)) strength++; if (/[^A-Za-z0-9]/.test(password)) strength++;
        var percentages = ['0%', '25%', '50%', '75%', '100%'], colors = ['#ff1744', '#ff9100', '#ffd600', '#76ff03', '#00e676'], texts = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
        strengthFill.style.width = percentages[strength] || '0%'; strengthFill.style.background = colors[strength] || colors[0];
        strengthText.textContent = texts[strength] || texts[0]; strengthText.style.color = colors[strength] || colors[0];
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    try { var { data: { session } } = await supabase.auth.getSession(); if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) { window.location.href = BASE_URL + '/index.html'; return; } } catch (e) {}
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) { btn.dataset.originalHtml = btn.innerHTML; });
    var loginForm = document.getElementById('loginForm'); if (loginForm) loginForm.addEventListener('submit', function(e) { e.preventDefault(); signInWithEmail(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value); });
    var registerForm = document.getElementById('registerForm'); if (registerForm) registerForm.addEventListener('submit', function(e) { e.preventDefault(); signUpWithEmail(document.getElementById('registerName').value.trim(), document.getElementById('registerEmail').value.trim(), document.getElementById('registerPassword').value); });
    var forgotForm = document.getElementById('forgotPasswordForm'); if (forgotForm) forgotForm.addEventListener('submit', function(e) { e.preventDefault(); resetPassword(document.getElementById('resetEmail').value.trim()); });
    var discordLogin = document.getElementById('discordLogin'); if (discordLogin) discordLogin.addEventListener('click', signInWithDiscord);
    var discordRegister = document.getElementById('discordRegister'); if (discordRegister) discordRegister.addEventListener('click', signInWithDiscord);
    setupTogglePassword(); setupForgotPassword(); setupPasswordStrength();
});

window.signOut = signOut;
