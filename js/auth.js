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
            var { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .or('username.eq.' + username + ',nickname.eq.' + username)
                .single();
            if (profile) {
                var { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
                if (user && user.email) email = user.email;
            }
            if (!email || !email.includes('@')) {
                showMessage('Usuario no encontrado. Usa tu @usuario, apodo o correo electrónico.', 'error');
                showLoading(false);
                return;
            }
        }
        
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                showMessage('Usuario o contraseña incorrectos.', 'error');
            } else {
                showMessage(error.message, 'error');
            }
            showLoading(false);
            return;
        }
        
        showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { 
        showMessage('Error al iniciar sesión: ' + error.message, 'error'); 
        showLoading(false); 
    }
}

// ============================================
// REGISTRO CON VALIDACIONES
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
        if (existing) { showMessage('El @usuario ya está en uso. Elige otro.', 'error'); showLoading(false); return; }
        
        var captchaToken = window.captchaToken || null;
        if (!captchaToken) { showMessage('Completa la verificación de seguridad.', 'error'); showLoading(false); return; }
        
        var { data, error } = await supabase.auth.signUp({
            email: email, password: password,
            options: { data: { full_name: name, nickname: nickname, username: username }, captchaToken: captchaToken }
        });
        if (error) { if (typeof turnstile !== 'undefined') turnstile.reset('#turnstile-container'); window.captchaToken = null; throw error; }
        
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id, full_name: name, nickname: nickname, username: username, updated_at: new Date().toISOString()
            });
        }
        
        showMessage('Cuenta creada exitosamente. Redirigiendo...', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1500);
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
        var redirectUrl = BASE_URL + '/index.html';
        var { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: redirectUrl }
        });
        if (error) { showMessage('Error al conectar con Discord: ' + error.message, 'error'); }
    } catch (error) { showMessage('Error: ' + error.message, 'error'); }
}

// ============================================
// GUARDAR DATOS DE OAUTH AL INICIAR SESIÓN
// ============================================
supabase.auth.onAuthStateChange(async function(event, session) {
    if (event === 'SIGNED_IN' && session) {
        var user = session.user;
        var metadata = user.user_metadata || {};
        
        // Si viene de Discord
        if (metadata.provider_id && metadata.iss && metadata.iss.includes('discord')) {
            var discordId = metadata.provider_id;
            var discordUsername = metadata.full_name || metadata.name || '';
            var discordAvatar = metadata.avatar_url || metadata.picture || '';
            
            console.log('Guardando datos de Discord:', discordUsername);
            
            await supabase.from('profiles').upsert({
                id: user.id,
                full_name: metadata.full_name || discordUsername,
                nickname: metadata.full_name || discordUsername,
                discord_id: discordId,
                discord_username: discordUsername,
                discord_avatar: discordAvatar,
                discord_linked_at: new Date().toISOString(),
                avatar_url: discordAvatar || metadata.avatar_url,
                updated_at: new Date().toISOString()
            });
        }
        
        // Si viene de Spotify
        if (metadata.provider_id && metadata.iss && metadata.iss.includes('spotify')) {
            var spotifyId = metadata.provider_id;
            var spotifyName = metadata.full_name || metadata.name || '';
            var spotifyAvatar = metadata.avatar_url || metadata.picture || '';
            var spotifyEmail = metadata.email || '';
            var spotifyUrl = '';
            var spotifyPlan = 'Free';
            var spotifyFollowers = 0;
            
            if (metadata.data) {
                spotifyUrl = metadata.data.external_urls?.spotify || '';
                spotifyPlan = metadata.data.product || 'Free';
                spotifyFollowers = metadata.data.followers?.total || 0;
            }
            
            var spotifyToken = session.provider_token;
            var playlistsCount = 0;
            var artistsCount = 0;
            
            if (spotifyToken) {
                try {
                    var playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
                        headers: { 'Authorization': 'Bearer ' + spotifyToken }
                    });
                    if (playlistsRes.ok) {
                        var playlistsData = await playlistsRes.json();
                        playlistsCount = playlistsData.total || 0;
                    }
                } catch (e) { console.log('Error playlists:', e); }
                
                try {
                    var artistsRes = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=1', {
                        headers: { 'Authorization': 'Bearer ' + spotifyToken }
                    });
                    if (artistsRes.ok) {
                        var artistsData = await artistsRes.json();
                        artistsCount = artistsData.artists?.total || 0;
                    }
                } catch (e) { console.log('Error artists:', e); }
            }
            
            console.log('Guardando datos de Spotify:', spotifyName, 'Playlists:', playlistsCount, 'Artistas:', artistsCount);
            
            await supabase.from('profiles').upsert({
                id: user.id,
                spotify_id: spotifyId,
                spotify_name: spotifyName,
                spotify_avatar: spotifyAvatar,
                spotify_email: spotifyEmail,
                spotify_url: spotifyUrl,
                spotify_plan: spotifyPlan,
                spotify_followers: spotifyFollowers,
                spotify_playlists: playlistsCount,
                spotify_artists: artistsCount,
                spotify_linked_at: new Date().toISOString(),
                avatar_url: spotifyAvatar || metadata.avatar_url,
                updated_at: new Date().toISOString()
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
        showMessage('Se ha enviado un enlace a tu correo electrónico.', 'success');
        showLoading(false);
    } catch (error) { showMessage(error.message, 'error'); showLoading(false); }
}

// ============================================
// CERRAR SESIÓN
// ============================================
async function signOut() { await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html'; }

// ============================================
// MOSTRAR MENSAJES
// ============================================
function showMessage(message, type) {
    var msgEl = document.getElementById('authMessage');
    if (msgEl) { msgEl.textContent = message; msgEl.className = 'auth-message ' + type; setTimeout(function() { msgEl.className = 'auth-message'; }, 5000); }
}

// ============================================
// LOADING
// ============================================
function showLoading(show) {
    var submitBtn = document.querySelector('.btn-primary[type="submit"]');
    if (submitBtn) { submitBtn.disabled = show; submitBtn.innerHTML = show ? '<span class="spinner"></span> Cargando...' : (submitBtn.dataset.originalHtml || submitBtn.innerHTML); }
}

// ============================================
// TOGGLE PASSWORD
// ============================================
function setupTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target) { target.type = target.type === 'password' ? 'text' : 'password'; this.textContent = target.type === 'password' ? 'visibility_off' : 'visibility'; }
        });
    });
}

// ============================================
// FORGOT PASSWORD TOGGLE
// ============================================
function setupForgotPassword() {
    var showBtn = document.getElementById('showForgotPassword'), backBtn = document.getElementById('backToLogin');
    var loginForm = document.getElementById('loginForm'), forgotForm = document.getElementById('forgotPasswordForm');
    if (showBtn) showBtn.addEventListener('click', function(e) { e.preventDefault(); loginForm.style.display = 'none'; forgotForm.style.display = 'block'; });
    if (backBtn) backBtn.addEventListener('click', function(e) { e.preventDefault(); forgotForm.style.display = 'none'; loginForm.style.display = 'block'; });
}

// ============================================
// PASSWORD STRENGTH
// ============================================
function setupPasswordStrength() {
    var passwordInput = document.getElementById('registerPassword');
    if (!passwordInput) return;
    passwordInput.addEventListener('input', function() {
        var password = this.value, strengthFill = document.getElementById('strengthFill'), strengthText = document.getElementById('strengthText');
        if (!strengthFill || !strengthText) return;
        var strength = 0;
        if (password.length >= 3) strength++; if (password.length >= 6) strength++; if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++; if (/[0-9]/.test(password)) strength++;
        var percentages = ['0%', '20%', '40%', '60%', '80%', '100%'], colors = ['#ff1744', '#ff9100', '#ffd600', '#76ff03', '#00e676'];
        var texts = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
        var idx = Math.min(strength, 4);
        strengthFill.style.width = percentages[idx + 1] || '0%'; strengthFill.style.background = colors[idx] || colors[0];
        strengthText.textContent = texts[idx] || texts[0]; strengthText.style.color = colors[idx] || colors[0];
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth JS - DOM cargado');
    try { var { data: { session } } = await supabase.auth.getSession(); if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) { window.location.href = BASE_URL + '/index.html'; return; } } catch (e) {}
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) { btn.dataset.originalHtml = btn.innerHTML; });
    var loginForm = document.getElementById('loginForm'); if (loginForm) loginForm.addEventListener('submit', function(e) { e.preventDefault(); signInWithEmail(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value); });
    var registerForm = document.getElementById('registerForm'); if (registerForm) registerForm.addEventListener('submit', function(e) { e.preventDefault(); signUpWithEmail(document.getElementById('registerName').value.trim(), document.getElementById('registerNickname').value.trim(), document.getElementById('registerUsername').value.trim(), document.getElementById('registerEmail').value.trim(), document.getElementById('registerPassword').value); });
    var forgotForm = document.getElementById('forgotPasswordForm'); if (forgotForm) forgotForm.addEventListener('submit', function(e) { e.preventDefault(); resetPassword(document.getElementById('resetEmail').value.trim()); });
    var discordLogin = document.getElementById('discordLogin'); if (discordLogin) discordLogin.addEventListener('click', signInWithDiscord);
    var discordRegister = document.getElementById('discordRegister'); if (discordRegister) discordRegister.addEventListener('click', signInWithDiscord);
    setupTogglePassword(); setupForgotPassword(); setupPasswordStrength();
});

window.signOut = signOut;
