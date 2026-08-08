import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { document.getElementById('authMessage').textContent = error.message; document.getElementById('authMessage').className = 'auth-message error'; }
    else window.location.href = 'index.html';
}

async function signUp(name, email, password) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { document.getElementById('authMessage').textContent = error.message; document.getElementById('authMessage').className = 'auth-message error'; }
    else window.location.href = 'index.html';
}

async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password.html' });
    const msg = document.getElementById('authMessage');
    if (error) { msg.textContent = error.message; msg.className = 'auth-message error'; }
    else { msg.textContent = 'Revisa tu correo'; msg.className = 'auth-message success'; }
}

async function signInDiscord() {
    await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin + '/index.html' } });
}

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) window.location.href = 'index.html';

    document.getElementById('loginForm')?.addEventListener('submit', (e) => { e.preventDefault(); signIn(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value); });
    document.getElementById('registerForm')?.addEventListener('submit', (e) => { e.preventDefault(); signUp(document.getElementById('registerName').value, document.getElementById('registerEmail').value, document.getElementById('registerPassword').value); });
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => { e.preventDefault(); resetPassword(document.getElementById('resetEmail').value); });
    document.getElementById('discordLogin')?.addEventListener('click', signInDiscord);
    document.getElementById('discordRegister')?.addEventListener('click', signInDiscord);

    document.getElementById('showForgotPassword')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('loginForm').style.display = 'none'; document.getElementById('forgotPasswordForm').style.display = 'block'; });
    document.getElementById('backToLogin')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('forgotPasswordForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; });

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = document.getElementById(this.dataset.target);
            target.type = target.type === 'password' ? 'text' : 'password';
            this.textContent = target.type === 'password' ? 'visibility_off' : 'visibility';
        });
    });
});
