// ============================================
// YX STUDIOS - AUTENTICACIÓN
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = 'https://yxstore.linkpc.net';

console.log('Auth JS - Base URL:', BASE_URL);

// ============================================
// VALIDACIONES
// ============================================
function validateUsername(username) {
    if (!username) return 'El usuario es requerido';
    if (username.length < 3) return 'Mínimo 3 caracteres';
    if (username.length > 20) return 'Máximo 20 caracteres';
    if (!/^[a-zA-Z0-9]+$/.test(username)) return 'Solo letras y números';
    return null;
}

function validateNickname(nickname) {
    if (!nickname) return 'El apodo es requerido';
    if (nickname.length < 3) return 'Mínimo 3 caracteres';
    if (nickname.length > 20) return 'Máximo 20 caracteres';
    if (!/^[a-zA-Z0-9]+$/.test(nickname)) return 'Solo letras y números, sin emojis ni símbolos';
    return null;
}

function validatePassword(password) {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 3) return 'Mínimo 3 caracteres';
    if (password.length > 20) return 'Máximo 20 caracteres';
    return null;
}

// ============================================
// INICIAR SESIÓN (con @usuario o email)
// ============================================
async function signInWithEmail(login, password) {
    try {
        showLoading(true);
        var email = login;
        if (!login.includes('@')) {
            var username = login.startsWith('@') ? login.substring(1) : login;
            var { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (profile) {
                var { data: userData } = await supabase.auth.admin.getUserById(profile.id);
                if (userData && userData.user) email = userData.user.email;
            }
            if (!email || !email.includes('@')) {
                showMessage('Usuario no encontrado. Usa tu @usuario o correo.', 'error');
                showLoading(false);
                return;
            }
        }
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        showMessage('Inicio de sesión exitoso.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

// ============================================
// REGISTRO
// ============================================
async function signUpWithEmail(name, nickname, username, email, password) {
    try {
        showLoading(true);
        var nickError = validateNickname(nickname);
        if (nickError) { showMessage(nickError, 'error'); showLoading(false); return; }
        var userError = validateUsername(username);
        if (userError) { showMessage(userError, 'error'); showLoading(false); return; }
        var passError = validatePassword(password);
        if (passError) { showMessage(passError, 'error'); showLoading(false); return; }
        
        var { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single();
        if (existing) { showMessage('El @usuario ya está en uso.', 'error'); showLoading(false); return; }
        
        var captchaToken = window.captchaToken || null;
        if (!captchaToken) { showMessage('Completa la verificación de seguridad.', 'error'); showLoading(false); return; }
        
        var { data, error } = await supabase.auth.signUp({
            email: email, password: password,
            options: { data: { full_name: name, nickname: nickname, username: username }, captchaToken: captchaToken }
        });
        if (error) { if (typeof turnstile !== 'undefined') turnstile.reset('#turnstile-container'); window.captchaToken = null; throw error; }
        
        await supabase.from('profiles').upsert({ id: data.user.id, full_name: name, nickname: nickname, username: username });
        
        showMessage('Cuenta creada exitosamente.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

// ============================================
// LOGIN CON DISCORD
// ============================================
async function signInWithDiscord() {
    try {
        var redirectUrl = BASE_URL + '/index.html';
        var { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: redirectUrl }
        });
        if (error) { showMessage('Error Discord: ' + error.message, 'error'); }
    } catch (error) { showMessage('Error: ' + error.message, 'error'); }
}

// Guardar datos de Discord al iniciar sesión
supabase.auth.onAuthStateChange(async function(event, session) {
    if (event === 'SIGNED_IN' && session) {
        var user = session.user;
        var metadata = user.user_metadata || {};
        if (metadata.provider_id && metadata.iss && metadata.iss.includes('discord')) {
            var discordId = metadata.provider_id;
            var discordUsername = metadata.full_name || metadata.name || '';
            var discordAvatar = metadata.avatar_url || metadata.picture || '';
            await supabase.from('profiles').upsert({
                id: user.id,
                full_name: metadata.full_name || discordUsername,
                discord_id: discordId,
                discord_username: discordUsername,
                discord_avatar: discordAvatar,
                discord_linked_at: new Date().toISOString(),
                avatar_url: discordAvatar || metadata.avatar_url
            });
        }
    }
});

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
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

document.addEventListener('DOMContentLoaded', async function() {
    try { var { data: { session } } = await supabase.auth.getSession(); if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) { window.location.href = BASE_URL + '/index.html'; return; } } catch (e) {}
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) { btn.dataset.originalHtml = btn.innerHTML; });
    var loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', function(e) { e.preventDefault(); signInWithEmail(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value); });
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            signUpWithEmail(document.getElementById('registerName').value.trim(), document.getElementById('registerNickname').value.trim(), document.getElementById('registerUsername').value.trim(), document.getElementById('registerEmail').value.trim(), document.getElementById('registerPassword').value);
        });
    }
    var forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', function(e) { e.preventDefault(); resetPassword(document.getElementById('resetEmail').value.trim()); });
    var discordLogin = document.getElementById('discordLogin'); if (discordLogin) discordLogin.addEventListener('click', signInWithDiscord);
    var discordRegister = document.getElementById('discordRegister'); if (discordRegister) discordRegister.addEventListener('click', signInWithDiscord);
    setupTogglePassword(); setupForgotPassword();
});

window.signOut = signOut;
