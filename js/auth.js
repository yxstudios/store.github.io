import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar sesión
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Login con Email
async function signInWithEmail(email, password) {
    try {
        showLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        showMessage(error.message, 'error');
        showLoading(false);
    }
}

// Registro con Email
async function signUpWithEmail(name, email, password) {
    try {
        showLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });
        
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showMessage('Este email ya está registrado. Por favor inicia sesión.', 'error');
        } else {
            showMessage('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Login con Google
async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        
        if (error) throw error;
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Cerrar sesión
async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Mostrar mensajes
function showMessage(message, type) {
    const messageElement = document.getElementById('authMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `auth-message ${type}`;
        setTimeout(() => {
            messageElement.className = 'auth-message';
        }, 5000);
    }
}

// Mostrar/Ocultar loading
function showLoading(show) {
    const submitBtn = document.querySelector('.btn-primary[type="submit"]');
    if (submitBtn) {
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Cargando...';
        } else {
            submitBtn.disabled = false;
            const icon = submitBtn.querySelector('i');
            const text = icon ? icon.outerHTML + ' ' + submitBtn.textContent.trim() : submitBtn.textContent;
            submitBtn.innerHTML = text;
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Si ya hay sesión, redirigir al index
    const session = await checkSession();
    if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
        window.location.href = 'index.html';
        return;
    }
    
    // Form de Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            signInWithEmail(email, password);
        });
    }
    
    // Form de Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            signUpWithEmail(name, email, password);
        });
        
        // Medidor de fortaleza de contraseña
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
    }
    
    // Botones de Google
    const googleLogin = document.getElementById('googleLogin');
    const googleRegister = document.getElementById('googleRegister');
    if (googleLogin) googleLogin.addEventListener('click', signInWithGoogle);
    if (googleRegister) googleRegister.addEventListener('click', signInWithGoogle);
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.getElementById(this.dataset.target);
            if (target.type === 'password') {
                target.type = 'text';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                target.type = 'password';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
});

// Medidor de fortaleza de contraseña
function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const strengthBar = document.getElementById('passwordStrength');
    
    if (!strengthFill || !strengthText) return;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const percentages = ['0%', '25%', '50%', '75%', '100%'];
    const colors = ['#ff1744', '#ff9100', '#ffd600', '#76ff03', '#00e676'];
    const texts = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
    
    strengthFill.style.width = percentages[strength] || '0%';
    strengthFill.style.background = colors[strength] || colors[0];
    strengthText.textContent = texts[strength] || texts[0];
    strengthText.style.color = colors[strength] || colors[0];
}
