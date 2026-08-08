// ============================================
// YX STUDIOS - AUTENTICACIÓN
// ============================================

// Inicializar Supabase
const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) || 
                 (typeof createClient !== 'undefined' ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

// Si no se pudo inicializar, intentar con import dinámico
if (!supabase) {
    import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
        window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    });
}

function getSupabase() {
    return supabase || window.supabaseClient;
}

// ============================================
// INICIAR SESIÓN
// ============================================
async function signIn(email, password) {
    const client = getSupabase();
    if (!client) {
        showMessage('Error de conexión. Recarga la página.', 'error');
        return;
    }

    try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        
        if (error) {
            showMessage(error.message, 'error');
            return;
        }

        if (data.session) {
            showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        showMessage('Error al iniciar sesión: ' + error.message, 'error');
    }
}

// ============================================
// REGISTRARSE
// ============================================
async function signUp(name, email, password) {
    const client = getSupabase();
    if (!client) {
        showMessage('Error de conexión. Recarga la página.', 'error');
        return;
    }

    try {
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (error) {
            showMessage(error.message, 'error');
            return;
        }

        if (data.user) {
            showMessage('Cuenta creada exitosamente. Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        showMessage('Error al registrarse: ' + error.message, 'error');
    }
}

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
async function resetPassword(email) {
    const client = getSupabase();
    if (!client) {
        showMessage('Error de conexión. Recarga la página.', 'error');
        return;
    }

    try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) {
            showMessage(error.message, 'error');
            return;
        }

        showMessage('Se ha enviado un enlace a tu correo.', 'success');
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// ============================================
// INICIAR SESIÓN CON DISCORD
// ============================================
async function signInWithDiscord() {
    const client = getSupabase();
    if (!client) {
        showMessage('Error de conexión. Recarga la página.', 'error');
        return;
    }

    try {
        const { error } = await client.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });

        if (error) {
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// ============================================
// MOSTRAR MENSAJES
// ============================================
function showMessage(message, type) {
    const msgEl = document.getElementById('authMessage');
    if (!msgEl) return;
    
    msgEl.textContent = message;
    msgEl.className = 'auth-message ' + type;
    msgEl.style.display = 'block';

    setTimeout(() => {
        msgEl.style.display = 'none';
    }, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión
    const client = getSupabase();
    if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
            window.location.href = 'index.html';
            return;
        }
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            signIn(email, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            signUp(name, email, password);
        });
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();
            resetPassword(email);
        });
    }

    // Toggle forgot password
    const showForgot = document.getElementById('showForgotPassword');
    const backToLogin = document.getElementById('backToLogin');
    if (showForgot && backToLogin) {
        showForgot.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('forgotPasswordForm').style.display = 'block';
        });
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('forgotPasswordForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    }

    // Discord login
    const discordLogin = document.getElementById('discordLogin');
    const discordRegister = document.getElementById('discordRegister');
    if (discordLogin) discordLogin.addEventListener('click', signInWithDiscord);
    if (discordRegister) discordRegister.addEventListener('click', signInWithDiscord);

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.getElementById(this.dataset.target);
            if (target.type === 'password') {
                target.type = 'text';
                this.textContent = 'visibility';
            } else {
                target.type = 'password';
                this.textContent = 'visibility_off';
            }
        });
    });
});
