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
                showMessage('Usuario no encontrado.', 'error');
                showLoading(false);
                return;
            }
        }
        
        var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) {
            showMessage(error.message.includes('Invalid login') ? 'Usuario o contraseña incorrectos.' : error.message, 'error');
            showLoading(false);
            return;
        }
        
        showMessage('Inicio de sesión exitoso.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
    } catch (error) { 
        showMessage('Error: ' + error.message, 'error'); 
        showLoading(false); 
    }
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
            email: email, 
            password: password,
            options: { 
                data: { full_name: name, nickname: nickname, username: username }, 
                captchaToken: captchaToken 
            }
        });
        
        if (error) { 
            if (typeof turnstile !== 'undefined') turnstile.reset('#turnstile-container');
            window.captchaToken = null;
            throw error; 
        }
        
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id, 
                full_name: name, 
                nickname: nickname, 
                username: username, 
                updated_at: new Date().toISOString()
            });
        }
        
        showMessage('Cuenta creada exitosamente.', 'success');
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
        var { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: BASE_URL + '/index.html' }
        });
        if (error) { showMessage('Error Discord: ' + error.message, 'error'); }
    } catch (error) { showMessage('Error: ' + error.message, 'error'); }
}

// ============================================
// GUARDAR DATOS DE OAUTH (DISCORD + SPOTIFY)
// ============================================
supabase.auth.onAuthStateChange(async function(event, session) {
    console.log('=== Auth State Changed ===');
    console.log('Event:', event);
    
    if (event === 'SIGNED_IN' && session) {
        var user = session.user;
        var metadata = user.user_metadata || {};
        var appMetadata = user.app_metadata || {};
        var identities = user.identities || [];
        
        console.log('App metadata:', appMetadata);
        console.log('User metadata:', metadata);
        console.log('Identities:', identities);
        
        // Detectar proveedor
        var provider = appMetadata.provider || '';
        var iss = metadata.iss || '';
        
        // Verificar por identities también
        identities.forEach(function(id) {
            if (id.provider && !provider) provider = id.provider;
        });
        
        console.log('Provider detectado:', provider);
        
        // DISCORD
        if (provider === 'discord' || iss.includes('discord')) {
            console.log('✅ Guardando Discord...');
            
            var { error } = await supabase.from('profiles').upsert({
                id: user.id,
                full_name: metadata.full_name || metadata.name || '',
                nickname: metadata.full_name || metadata.name || '',
                discord_id: metadata.provider_id || '',
                discord_username: metadata.full_name || metadata.name || '',
                discord_avatar: metadata.avatar_url || metadata.picture || '',
                discord_linked_at: new Date().toISOString(),
                avatar_url: metadata.avatar_url || metadata.picture || '',
                updated_at: new Date().toISOString()
            });
            
            if (error) {
                console.error('❌ Error Discord:', error);
            } else {
                console.log('✅ Discord guardado');
            }
        }
        
        // SPOTIFY
        if (provider === 'spotify' || iss.includes('spotify')) {
            console.log('✅ Guardando Spotify...');
            
            var spotifyName = metadata.full_name || metadata.name || '';
            var spotifyAvatar = metadata.avatar_url || metadata.picture || '';
            var spotifyEmail = metadata.email || user.email || '';
            var spotifyUrl = '';
            var spotifyPlan = 'Free';
            var spotifyFollowers = 0;
            
            if (!spotifyName && spotifyEmail) {
                spotifyName = spotifyEmail.split('@')[0];
            }
            if (!spotifyName) spotifyName = 'Usuario Spotify';
            
            if (metadata.data) {
                spotifyUrl = metadata.data.external_urls?.spotify || '';
                spotifyPlan = metadata.data.product || 'Free';
                spotifyFollowers = metadata.data.followers?.total || 0;
            }
            
            var playlistsCount = 0;
            var artistsCount = 0;
            
            if (session.provider_token) {
                try {
                    var pr = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
                        headers: { 'Authorization': 'Bearer ' + session.provider_token }
                    });
                    if (pr.ok) { var pd = await pr.json(); playlistsCount = pd.total || 0; }
                } catch (e) { console.log('Error playlists:', e); }
                
                try {
                    var ar = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=1', {
                        headers: { 'Authorization': 'Bearer ' + session.provider_token }
                    });
                    if (ar.ok) { var ad = await ar.json(); artistsCount = ad.artists?.total || 0; }
                } catch (e) { console.log('Error artists:', e); }
            }
            
            var { error } = await supabase.from('profiles').upsert({
                id: user.id,
                spotify_id: metadata.provider_id || user.id,
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
            
            if (error) {
                console.error('❌ Error Spotify:', error);
            } else {
                console.log('✅ Spotify guardado:', spotifyName, '| Playlists:', playlistsCount, '| Artistas:', artistsCount);
            }
        }
    }
});

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
async function resetPassword(email) {
    try {
        showLoading(true);
        var { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: BASE_URL + '/reset-password.html'
        });
        if (error) throw error;
        showMessage('Enlace enviado a tu correo.', 'success');
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
    window.location.href = BASE_URL + '/index.html'; 
}

// ============================================
// UTILIDADES
// ============================================
function showMessage(message, type) {
    var msgEl = document.getElementById('authMessage');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.className = 'auth-message ' + type;
        setTimeout(function() { msgEl.className = 'auth-message'; }, 5000);
    }
}

function showLoading(show) {
    var submitBtn = document.querySelector('.btn-primary[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = show;
        submitBtn.innerHTML = show ? '<span class="spinner"></span> Cargando...' : (submitBtn.dataset.originalHtml || submitBtn.innerHTML);
    }
}

function setupTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var t = document.getElementById(this.dataset.target);
            if (t) {
                t.type = t.type === 'password' ? 'text' : 'password';
                this.textContent = t.type === 'password' ? 'visibility_off' : 'visibility';
            }
        });
    });
}

function setupForgotPassword() {
    var sb = document.getElementById('showForgotPassword');
    var bb = document.getElementById('backToLogin');
    var lf = document.getElementById('loginForm');
    var ff = document.getElementById('forgotPasswordForm');
    if (sb) sb.addEventListener('click', function(e) { e.preventDefault(); lf.style.display = 'none'; ff.style.display = 'block'; });
    if (bb) bb.addEventListener('click', function(e) { e.preventDefault(); ff.style.display = 'none'; lf.style.display = 'block'; });
}

function setupPasswordStrength() {
    var pi = document.getElementById('registerPassword');
    if (!pi) return;
    pi.addEventListener('input', function() {
        var p = this.value;
        var sf = document.getElementById('strengthFill');
        var st = document.getElementById('strengthText');
        if (!sf || !st) return;
        var s = 0;
        if (p.length >= 3) s++; if (p.length >= 6) s++; if (p.length >= 10) s++;
        if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++;
        var pcts = ['0%','20%','40%','60%','80%','100%'];
        var cols = ['#ff1744','#ff9100','#ffd600','#76ff03','#00e676'];
        var txts = ['Muy débil','Débil','Media','Fuerte','Muy fuerte'];
        var idx = Math.min(s, 4);
        sf.style.width = pcts[idx+1]||'0%';
        sf.style.background = cols[idx]||cols[0];
        st.textContent = txts[idx]||txts[0];
        st.style.color = cols[idx]||cols[0];
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth JS - DOM cargado');
    
    try {
        var { data: { session } } = await supabase.auth.getSession();
        if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
            window.location.href = BASE_URL + '/index.html';
            return;
        }
    } catch (e) {}
    
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) {
        btn.dataset.originalHtml = btn.innerHTML;
    });
    
    var lf = document.getElementById('loginForm');
    if (lf) lf.addEventListener('submit', function(e) {
        e.preventDefault();
        signInWithEmail(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
    });
    
    var rf = document.getElementById('registerForm');
    if (rf) rf.addEventListener('submit', function(e) {
        e.preventDefault();
        signUpWithEmail(
            document.getElementById('registerName').value.trim(),
            document.getElementById('registerNickname').value.trim(),
            document.getElementById('registerUsername').value.trim(),
            document.getElementById('registerEmail').value.trim(),
            document.getElementById('registerPassword').value
        );
    });
    
    var ff = document.getElementById('forgotPasswordForm');
    if (ff) ff.addEventListener('submit', function(e) {
        e.preventDefault();
        resetPassword(document.getElementById('resetEmail').value.trim());
    });
    
    var dl = document.getElementById('discordLogin');
    if (dl) dl.addEventListener('click', signInWithDiscord);
    
    var dr = document.getElementById('discordRegister');
    if (dr) dr.addEventListener('click', signInWithDiscord);
    
    setupTogglePassword();
    setupForgotPassword();
    setupPasswordStrength();
});

window.signOut = signOut;
