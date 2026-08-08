// ============================================
// YX STUDIOS - AUTENTICACIÓN
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// INICIAR SESIÓN
// ============================================
async function signIn(email, password) {
    if (!email || !password) {
        showNotification('Campos vacíos', 'Completa todos los campos', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                showNotification('Email no verificado', 'Revisa tu bandeja de entrada y verifica tu correo', 'error');
            } else if (error.message.includes('Invalid login')) {
                showNotification('Datos incorrectos', 'Email o contraseña inválidos', 'error');
            } else {
                showNotification('Error', error.message, 'error');
            }
            return;
        }

        if (data.session) {
            showNotification('Inicio exitoso', 'Bienvenido de vuelta', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    } catch (error) {
        showNotification('Error', 'Error al iniciar sesión', 'error');
    }
}

// ============================================
// REGISTRARSE
// ============================================
async function signUp(name, email, password) {
    if (!name || !email || !password) {
        showNotification('Campos vacíos', 'Completa todos los campos', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseAuth.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: window.location.origin + '/login.html'
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                showNotification('Ya registrado', 'Este email ya tiene una cuenta', 'error');
            } else {
                showNotification('Error', error.message, 'error');
            }
            return;
        }

        if (data.user) {
            showNotification(
                'Registro exitoso',
                'Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada y confirma tu email.',
                'success'
            );
            
            // Limpiar formulario
            document.getElementById('registerForm')?.reset();
            
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
    } catch (error) {
        showNotification('Error', 'Error al registrarse', 'error');
    }
}

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
async function resetPassword(email) {
    if (!email) {
        showNotification('Campo vacío', 'Ingresa tu correo electrónico', 'error');
        return;
    }

    try {
        const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) {
            showNotification('Error', error.message, 'error');
            return;
        }

        showNotification(
            'Enlace enviado',
            'Revisa tu correo para restablecer tu contraseña',
            'success'
        );
    } catch (error) {
        showNotification('Error', 'Error al enviar el enlace', 'error');
    }
}

// ============================================
// INICIAR SESIÓN CON DISCORD
// ============================================
async function signInWithDiscord() {
    try {
        const { error } = await supabaseAuth.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });

        if (error) {
            showNotification('Error', error.message, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Error al conectar con Discord', 'error');
    }
}

// ============================================
// NOTIFICACIÓN MODERNA
// ============================================
function showNotification(title, message, type) {
    const existing = document.querySelector('.notify-toast');
    if (existing) existing.remove();

    const icons = { success: 'check_circle', error: 'error', info: 'info' };

    const toast = document.createElement('div');
    toast.className = `notify-toast notify-${type}`;
    toast.innerHTML = `
        <div class="notify-icon"><span class="material-icons">${icons[type] || 'info'}</span></div>
        <div class="notify-content">
            <div class="notify-title">${title}</div>
            <div class="notify-message">${message}</div>
        </div>
        <button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button>
        <div class="notify-progress"></div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión activa
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
        window.location.href = 'index.html';
        return;
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
