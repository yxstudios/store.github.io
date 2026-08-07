import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar sesión al cargar
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Si estamos en index.html, redirigir al dashboard
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' || 
            window.location.pathname === '') {
            window.location.href = 'products.html';
        }
    } else {
        // Si no hay sesión y estamos en página protegida
        if (window.location.pathname.includes('dashboard.html') || 
            window.location.pathname.includes('products.html')) {
            window.location.href = 'index.html';
        }
    }
}

// Login con Email y Contraseña
async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showMessage('¡Inicio de sesión exitoso!', 'success');
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Registro con Email y Contraseña
async function signUpWithEmail(name, email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        showMessage('¡Cuenta creada exitosamente! Revisa tu email para confirmar.', 'success');
        
        // Limpiar formulario
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        
        // Cambiar a tab de login
        document.querySelector('[data-tab="login"]').click();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Login con Google
async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/products.html'
            }
        });
        
        if (error) throw error;
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Cerrar sesión
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
    }
}

// Mostrar mensajes
function showMessage(message, type) {
    const messageElement = document.getElementById('authMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `auth-message ${type}`;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Event Listeners cuando el DOM carga
document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    checkSession();
    
    // Tabs de Login/Register
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}Form`).classList.add('active');
        });
    });
    
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
    }
    
    // Botones de Google
    const googleLogin = document.getElementById('googleLogin');
    const googleRegister = document.getElementById('googleRegister');
    
    if (googleLogin) googleLogin.addEventListener('click', signInWithGoogle);
    if (googleRegister) googleRegister.addEventListener('click', signInWithGoogle);
    
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', signOut);
});
