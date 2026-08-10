import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = 'https://yxstore.linkpc.net';
var currentUser = null;
var tempAvatar = null;
var tempBanner = null;

async function init() {
    var { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = BASE_URL + '/login.html'; return; }
    currentUser = session.user;
    await supabase.auth.refreshSession();
    await new Promise(function(resolve) { setTimeout(resolve, 500); });
    console.log('Usuario:', currentUser.email);
    await loadProfile();
    loadPurchases();
    loadInvoices();
    setupNavigation();
    setupEvents();
    updateCartBadge();
}

async function loadProfile() {
    var { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!profile) { await supabase.from('profiles').insert({ id: currentUser.id }); profile = {}; }

    var { data: { session } } = await supabase.auth.getSession();
    if (session) {
        var identities = session.user.identities || [];
        identities.forEach(async function(identity) {
            var idData = identity.identity_data || {};
            if (identity.provider === 'discord' && !profile.discord_id) {
                await supabase.from('profiles').upsert({
                    id: currentUser.id, full_name: idData.full_name || idData.name || '',
                    nickname: idData.full_name || idData.name || '',
                    discord_id: idData.provider_id || identity.id || '',
                    discord_username: idData.full_name || idData.name || '',
                    discord_avatar: idData.avatar_url || idData.picture || '',
                    discord_linked_at: new Date().toISOString(),
                    avatar_url: idData.avatar_url || idData.picture || '',
                    updated_at: new Date().toISOString()
                });
            }
        });
        var { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        profile = updatedProfile || profile;
    }

    document.getElementById('profileName').textContent = profile.nickname || profile.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    var topName = document.getElementById('userNameDisplay'); if (topName) topName.textContent = profile.nickname || profile.full_name || currentUser.email.split('@')[0];
    var tooltipEmail = document.getElementById('tooltipEmail'); if (tooltipEmail) tooltipEmail.textContent = currentUser.email;

    var avatarUrl = profile.avatar_url || currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    var topAvatar = document.getElementById('userAvatarTop'); if (topAvatar) topAvatar.src = avatarUrl;
    if (profile.banner_url) document.getElementById('profileBanner').style.backgroundImage = 'url(' + profile.banner_url + ')';

    setValue('editName', profile.full_name || '');
    setValue('editNickname', profile.nickname || '');
    setValue('editUsername', profile.username || '');
    setValue('editBio', profile.bio || '');

    // Discord
    if (profile.discord_username) {
        setText('discordStatusText', 'Vinculado como ' + profile.discord_username);
        showEl('discordLinkedInfo');
        setText('discordLinkedUser', profile.discord_username);
        if (profile.discord_avatar) document.getElementById('discordAvatarImg').src = profile.discord_avatar;
        if (profile.discord_linked_at) setText('discordLinkedDate', 'Vinculado el ' + new Date(profile.discord_linked_at).toLocaleDateString());
        document.getElementById('connectDiscordBtn').innerHTML = '<i class="fab fa-discord"></i> Revincular';
    }

    var { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
    var badge = document.getElementById('profileBadge');
    if (badge) {
        if (count >= 10) badge.textContent = 'VIP';
        else if (count >= 5) badge.textContent = 'Cliente Frecuente';
        else if (count >= 1) badge.textContent = 'Cliente';
        else badge.innerHTML = '<span class="badge-new"><span class="material-icons">new_releases</span> Nuevo</span>';
    }
}

async function loadPurchases() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var tbody = document.getElementById('purchasesTableBody'); if (!tbody) return; if (!orders || !orders.length) return;
    tbody.innerHTML = orders.map(function(o) { var items = o.items ? o.items.map(function(i) { return i.name; }).join(', ') : 'Productos'; return '<tr><td><strong>#' + o.id + '</strong></td><td>' + new Date(o.created_at).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td></tr>'; }).join('');
}

async function loadInvoices() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var list = document.getElementById('invoicesList'); if (!list) return; if (!orders || !orders.length) return;
    list.innerHTML = orders.map(function(o) { return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + o.id + '</strong><p>' + new Date(o.created_at).toLocaleDateString() + ' - $' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</p></div></div></div>'; }).join('');
}

function setupNavigation() {
    document.querySelectorAll('.profile-menu-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.profile-menu-link').forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.profile-section-block').forEach(function(s) { s.classList.remove('active'); });
            var section = document.getElementById(this.getAttribute('data-section') + 'Section');
            if (section) section.classList.add('active');
        });
    });
}

function setupEvents() {
    // Avatar
    document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempAvatar = ev.target.result; document.getElementById('profileAvatar').src = tempAvatar; var ta = document.getElementById('userAvatarTop'); if (ta) ta.src = tempAvatar; };
        reader.readAsDataURL(file);
    });

    // Banner
    document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempBanner = ev.target.result; document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')'; };
        reader.readAsDataURL(file);
    });

    // Guardar perfil
    document.getElementById('savePersonal')?.addEventListener('click', async function() {
        var data = { id: currentUser.id, full_name: getValue('editName'), nickname: getValue('editNickname'), bio: getValue('editBio'), updated_at: new Date().toISOString() };
        if (tempAvatar) data.avatar_url = tempAvatar; if (tempBanner) data.banner_url = tempBanner;
        var { error } = await supabase.from('profiles').upsert(data);
        if (error) { showNotification('Error', error.message, 'error'); return; }
        tempAvatar = null; tempBanner = null;
        document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
        var tn = document.getElementById('userNameDisplay'); if (tn) tn.textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
        showNotification('Perfil actualizado', 'Tus datos han sido guardados correctamente', 'success');
    });

    // Cambiar contraseña CON NOTIFICACIÓN
    document.getElementById('changePasswordBtn')?.addEventListener('click', async function() {
        var p1 = getValue('newPassword');
        var p2 = getValue('confirmNewPassword');
        if (!p1 || !p2) { showNotification('Error', 'Completa todos los campos', 'error'); return; }
        if (p1 !== p2) { showNotification('Error', 'Las contraseñas no coinciden', 'error'); return; }
        if (p1.length < 3) { showNotification('Error', 'Mínimo 3 caracteres', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { showNotification('Error', error.message, 'error'); }
        else {
            showNotification('Contraseña actualizada', 'Se ha enviado un correo de confirmación', 'success');
            setValue('newPassword', ''); setValue('confirmNewPassword', '');
        }
    });

    // Cambiar email CON NOTIFICACIÓN
    document.getElementById('changeEmailBtn')?.addEventListener('click', async function() {
        var email = getValue('newEmail');
        if (!email) { showNotification('Error', 'Ingresa un correo electrónico', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification('Solicitud enviada', 'Revisa tu nuevo correo para confirmar el cambio', 'success'); }
    });

    // Toggle password con blur
    document.querySelectorAll('.toggle-pass-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target) {
                if (target.type === 'password') {
                    target.type = 'text';
                    this.querySelector('.material-icons').textContent = 'visibility';
                } else {
                    target.type = 'password';
                    this.querySelector('.material-icons').textContent = 'visibility_off';
                }
            }
        });
    });

    // Discord
    document.getElementById('connectDiscordBtn')?.addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: BASE_URL + '/profile.html' } });
    });

    // Tema
    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() { document.documentElement.setAttribute('data-theme', this.dataset.accent); localStorage.setItem('yx-theme', this.dataset.accent); document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); }); this.classList.add('active'); });
    });

    // Eliminar cuenta
    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'flex'; });
    document.getElementById('cancelDelete')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'none'; setValue('deleteConfirmInput', ''); });
    document.getElementById('deleteConfirmInput')?.addEventListener('input', function() { document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR'; });
    document.getElementById('confirmDelete')?.addEventListener('click', async function() { await supabase.from('profiles').delete().eq('id', currentUser.id); await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html'; });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async function(e) { e.preventDefault(); await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html'; });
}

// ============================================
// NOTIFICACIÓN MODERNA
// ============================================
function showNotification(title, message, type) {
    var existing = document.querySelector('.notify-toast'); if (existing) existing.remove();
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var toast = document.createElement('div');
    toast.className = 'notify-toast notify-' + type;
    toast.innerHTML = '<div class="notify-icon"><span class="material-icons">' + (icons[type] || 'info') + '</span></div><div class="notify-content"><div class="notify-title">' + title + '</div><div class="notify-message">' + message + '</div></div><button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button><div class="notify-progress"></div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400); }, 4000);
}

function getValue(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setValue(id, value) { var el = document.getElementById(id); if (el) el.value = value; }
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function showEl(id) { var el = document.getElementById(id); if (el) el.style.display = 'block'; }
function updateCartBadge() { var cart = JSON.parse(localStorage.getItem('yxCart') || '[]'); var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0); var badge = document.getElementById('cartCount'); if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; } }

init();
