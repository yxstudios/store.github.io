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
// BUSCAR EMAIL POR @USUARIO O APODO
// ============================================
async function findEmailByUsername(login) {
    var username = login.startsWith('@') ? login.substring(1) : login;
    
    // Buscar en profiles por username o nickname
    var { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, nickname')
        .or('username.eq.' + username + ',nickname.eq.' + username)
        .single();
    
    if (error || !profile) {
        console.log('Perfil no encontrado para:', username);
        return null;
    }
    
    console.log('Perfil encontrado:', profile);
    
    // Obtener el usuario de auth por ID
    try {
        var { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        if (userError || !user) {
            console.log('Usuario auth no encontrado');
            return null;
        }
        console.log('Email encontrado:', user.email);
        return user.email;
    } catch (e) {
        console.log('Error al obtener usuario:', e);
        
        // Método alternativo: buscar en auth.users
        var { data: authUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', profile.id)
            .single();
            
        if (authUser) {
            // Intentar con RPC
            var { data: emailData } = await supabase.rpc('get_user_email', { user_id: profile.id });
            if (emailData) return emailData;
        }
        return null;
    }
}

// ============================================
// INICIAR SESIÓN CON @USUARIO, APODO O EMAIL
// ============================================
async function signInWithEmail(login, password) {
    try {
        showLoading(true);
        var email = login;
        
        // Si no es email, buscar por @usuario o apodo
        if (!login.includes('@')) {
            email = await findEmailByUsername(login);
            
            if (!email) {
                showMessage('Usuario no encontrado. Verifica el @usuario o apodo.', 'error');
                showLoading(false);
                return;
            }
        }
        
        console.log('Intentando login con:', email);
        
        var { data, error } = await supabase.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });
        
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                showMessage('Usuario o contraseña incorrectos.', 'error');
            } else if (error.message.includes('Email not confirmed')) {
                showMessage('Email no verificado. Revisa tu bandeja de entrada.', 'error');
            } else {
                showMessage(error.message, 'error');
            }
            showLoading(false);
            return;
        }
        
        showMessage('Inicio de sesión exitoso.', 'success');
        setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1000);
        
    } catch (error) { 
        console.error('Error en login:', error);
        showMessage('Error al iniciar sesión.', 'error'); 
        showLoading(false); 
    }
}

// ============================================
// REGISTRO
// ============================================
async function signUpWithEmail(name, nickname, username, email, password) {
    try {
        showLoading(true);
        var nickError = validateNickname(nickname); if (nickError) { showMessage(nickError, 'error'); showLoading(false); return; }
        var userError = validateUsername(username); if (userError) { showMessage(userError, 'error'); showLoading(false); return; }
        var passError = validatePassword(password); if (passError) { showMessage(passError, 'error'); showLoading(false); return; }
        
        // Verificar si username ya existe
        var { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single();
        if (existing) { showMessage('El @usuario ya está en uso. Elige otro.', 'error'); showLoading(false); return; }
        
        var captchaToken = window.captchaToken || null;
        if (!captchaToken) { showMessage('Completa la verificación de seguridad.', 'error'); showLoading(false); return; }
        
        var { data, error } = await supabase.auth.signUp({
            email: email, password: password,
            options: { data: { full_name: name, nickname: nickname, username: username }, captchaToken: captchaToken }
        });
        
        if (error) { 
            if (typeof turnstile !== 'undefined') turnstile.reset('#turnstile-container');
            window.captchaToken = null;
            throw error; 
        }
        
        if (data.user) {
            await supabase.from('profiles').upsert({ 
                id: data.user.id, full_name: name, nickname: nickname, username: username, 
                updated_at: new Date().toISOString() 
            });
            
            if (data.session === null) {
                showMessage('Registro exitoso. Revisa tu correo para verificar tu cuenta.', 'success');
            } else {
                showMessage('Cuenta creada exitosamente.', 'success');
                setTimeout(function() { window.location.href = BASE_URL + '/index.html'; }, 1500);
            }
        }
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
// GUARDAR DATOS DE OAUTH
// ============================================
supabase.auth.onAuthStateChange(async function(event, session) {
    if ((event === 'SIGNED_IN') && session) {
        var user = session.user;
        var identities = user.identities || [];
        
        identities.forEach(async function(identity) {
            var idData = identity.identity_data || {};
            if (identity.provider === 'discord') {
                // Solo guardar si no existe el perfil
                var { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
                if (!existing) {
                    await supabase.from('profiles').insert({
                        id: user.id,
                        full_name: idData.full_name || idData.name || '',
                        nickname: idData.full_name || idData.name || '',
                        discord_username: idData.full_name || idData.name || '',
                        discord_avatar: idData.avatar_url || idData.picture || '',
                        discord_linked_at: new Date().toISOString(),
                        avatar_url: idData.avatar_url || idData.picture || '',
                        updated_at: new Date().toISOString()
                    });
                }
            }
        });
    }
});

async function resetPassword(email) {
    try { 
        showLoading(true); 
        var { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: BASE_URL + '/reset-password.html' }); 
        if (error) throw error; 
        showMessage('Enlace enviado a tu correo.', 'success'); 
        showLoading(false); 
    } catch (error) { 
        showMessage(error.message, 'error'); 
        showLoading(false); 
    }
}

async function signOut() { 
    await supabase.auth.signOut(); 
    window.location.href = BASE_URL + '/index.html'; 
}

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
    var sb = document.getElementById('showForgotPassword'), bb = document.getElementById('backToLogin');
    var lf = document.getElementById('loginForm'), ff = document.getElementById('forgotPasswordForm');
    if (sb) sb.addEventListener('click', function(e) { e.preventDefault(); lf.style.display = 'none'; ff.style.display = 'block'; });
    if (bb) bb.addEventListener('click', function(e) { e.preventDefault(); ff.style.display = 'none'; lf.style.display = 'block'; });
}

function setupPasswordStrength() {
    var pi = document.getElementById('registerPassword'); if (!pi) return;
    pi.addEventListener('input', function() {
        var p = this.value, sf = document.getElementById('strengthFill'), st = document.getElementById('strengthText'); 
        if (!sf || !st) return;
        var s = 0; if (p.length >= 3) s++; if (p.length >= 6) s++; if (p.length >= 10) s++; 
        if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++;
        var pcts = ['0%','20%','40%','60%','80%','100%'], cols = ['#ff1744','#ff9100','#ffd600','#76ff03','#00e676'];
        var txts = ['Muy débil','Débil','Media','Fuerte','Muy fuerte'];
        var idx = Math.min(s, 4); 
        sf.style.width = pcts[idx+1]||'0%'; sf.style.background = cols[idx]||cols[0]; 
        st.textContent = txts[idx]||txts[0]; st.style.color = cols[idx]||cols[0];
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    try { 
        var { data: { session } } = await supabase.auth.getSession(); 
        if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) { 
            window.location.href = BASE_URL + '/index.html'; 
            return; 
        } 
    } catch (e) {}
    
    document.querySelectorAll('.btn-primary[type="submit"]').forEach(function(btn) { btn.dataset.originalHtml = btn.innerHTML; });
    
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
    
    var dl = document.getElementById('discordLogin'); if (dl) dl.addEventListener('click', signInWithDiscord);
    var dr = document.getElementById('discordRegister'); if (dr) dr.addEventListener('click', signInWithDiscord);
    
    setupTogglePassword(); 
    setupForgotPassword(); 
    setupPasswordStrength();
});

window.signOut = signOut;
