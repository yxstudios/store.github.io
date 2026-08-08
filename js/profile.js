import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var currentUser = null;
var savedProfile = JSON.parse(localStorage.getItem('yxProfile') || '{}');

async function init() {
    var { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    currentUser = session.user;
    loadUserData();
    loadPurchases();
    loadInvoices();
    setupNavigation();
    setupEvents();
    updateCartBadge();
}

function loadUserData() {
    var metadata = currentUser.user_metadata || {};

    document.getElementById('profileName').textContent = savedProfile.full_name || metadata.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    document.getElementById('userNameDisplay').textContent = savedProfile.full_name || metadata.full_name || currentUser.email.split('@')[0];
    document.getElementById('tooltipEmail').textContent = currentUser.email;

    var avatarUrl = savedProfile.avatar_url || metadata.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('userAvatarTop').src = avatarUrl;

    var bannerUrl = savedProfile.banner_url || metadata.banner_url || 'https://via.placeholder.com/1200x300/1a1a1a/333333?text=Banner';
    document.getElementById('profileBanner').style.backgroundImage = 'url(' + bannerUrl + ')';

    document.getElementById('editName').value = savedProfile.full_name || metadata.full_name || '';
    document.getElementById('editBio').value = savedProfile.bio || metadata.bio || '';
    document.getElementById('editRoblox').value = savedProfile.roblox || metadata.roblox || '';
    document.getElementById('editDiscord').value = savedProfile.discord || metadata.discord || '';
    document.getElementById('languageSelect').value = localStorage.getItem('yxLang') || 'es';
    document.getElementById('currencySelect').value = localStorage.getItem('yxCurrency') || 'USD';

    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var badge = document.getElementById('profileBadge');
    if (orders.length >= 10) badge.textContent = 'VIP';
    else if (orders.length >= 5) badge.textContent = 'Cliente Frecuente';
    else if (orders.length >= 1) badge.textContent = 'Cliente';
    else badge.textContent = 'Nuevo';
}

function saveProfileData(key, value) {
    savedProfile[key] = value;
    localStorage.setItem('yxProfile', JSON.stringify(savedProfile));
}

function loadPurchases() {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var tbody = document.getElementById('purchasesTableBody');
    if (!orders.length) return;
    tbody.innerHTML = orders.reverse().map(function(o) {
        var items = o.items ? o.items.map(function(i) { return i.name; }).join(', ') : 'Productos';
        return '<tr><td><strong>#' + (o.id || '').substring(0, 8) + '</strong></td><td>' + new Date(o.date).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? o.total.toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td><td><button class="btn-sm btn-outline" onclick="downloadInvoice(\'' + o.id + '\')"><span class="material-icons">download</span></button></td></tr>';
    }).join('');
}

function loadInvoices() {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var list = document.getElementById('invoicesList');
    if (!orders.length) return;
    list.innerHTML = orders.map(function(o) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + (o.id || '').substring(0, 8) + '</strong><p>' + new Date(o.date).toLocaleDateString() + ' - $' + (o.total ? o.total.toFixed(2) : '0.00') + '</p></div></div><button class="btn-sm btn-outline" onclick="downloadInvoice(\'' + o.id + '\')"><span class="material-icons">download</span> Descargar</button></div>';
    }).join('');
}

window.downloadInvoice = function(orderId) {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var order = orders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    var content = 'YX STUDIOS - FACTURA\n========================\nFactura: #' + order.id.substring(0, 8) + '\nFecha: ' + new Date(order.date).toLocaleDateString() + '\nTotal: $' + (order.total ? order.total.toFixed(2) : '0.00') + '\n========================\nGracias por tu compra!';
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'factura_' + order.id.substring(0, 8) + '.txt'; a.click();
    URL.revokeObjectURL(url);
};

function setupNavigation() {
    document.querySelectorAll('.profile-menu-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.profile-menu-link').forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.profile-section-block').forEach(function(s) { s.classList.remove('active'); });
            document.getElementById(this.dataset.section + 'Section').classList.add('active');
        });
    });
}

function setupEvents() {
    // GUARDAR PERFIL
    document.getElementById('savePersonal').addEventListener('click', function() {
        var name = document.getElementById('editName').value.trim();
        var bio = document.getElementById('editBio').value.trim();
        var roblox = document.getElementById('editRoblox').value.trim();
        var discord = document.getElementById('editDiscord').value.trim();

        // Guardar en localStorage (inmediato y confiable)
        saveProfileData('full_name', name);
        saveProfileData('bio', bio);
        saveProfileData('roblox', roblox);
        saveProfileData('discord', discord);

        // Actualizar UI
        document.getElementById('profileName').textContent = name || 'Usuario';
        document.getElementById('userNameDisplay').textContent = name || currentUser.email.split('@')[0];

        // Intentar guardar en Supabase también
        supabase.auth.updateUser({ data: { full_name: name, bio: bio, roblox: roblox, discord: discord } });

        showNotification('Perfil actualizado', 'Datos guardados correctamente', 'success');
    });

    // AVATAR
    document.getElementById('avatarUpload').addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(ev) {
            var url = ev.target.result;

            // Guardar en localStorage
            saveProfileData('avatar_url', url);

            // Actualizar UI
            document.getElementById('profileAvatar').src = url;
            document.getElementById('userAvatarTop').src = url;

            // Intentar guardar en Supabase
            supabase.auth.updateUser({ data: { avatar_url: url } });

            showNotification('Avatar actualizado', 'Imagen guardada correctamente', 'success');
        };
        reader.readAsDataURL(file);
    });

    // BANNER
    document.getElementById('bannerUpload').addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(ev) {
            var url = ev.target.result;

            // Guardar en localStorage
            saveProfileData('banner_url', url);

            // Actualizar UI
            document.getElementById('profileBanner').style.backgroundImage = 'url(' + url + ')';

            // Intentar guardar en Supabase
            supabase.auth.updateUser({ data: { banner_url: url } });

            showNotification('Banner actualizado', 'Portada guardada correctamente', 'success');
        };
        reader.readAsDataURL(file);
    });

    // CAMBIAR CONTRASEÑA
    document.getElementById('changePasswordBtn').addEventListener('click', async function() {
        var p1 = document.getElementById('newPassword').value;
        var p2 = document.getElementById('confirmNewPassword').value;
        if (!p1 || !p2) { showNotification('Error', 'Completa los campos', 'error'); return; }
        if (p1 !== p2) { showNotification('Error', 'No coinciden', 'error'); return; }
        if (p1.length < 6) { showNotification('Error', 'Mínimo 6 caracteres', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification('Contraseña actualizada', '', 'success'); document.getElementById('newPassword').value = ''; document.getElementById('confirmNewPassword').value = ''; }
    });

    // CAMBIAR EMAIL
    document.getElementById('changeEmailBtn').addEventListener('click', async function() {
        var email = document.getElementById('newEmail').value.trim();
        if (!email) { showNotification('Error', 'Ingresa un correo', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification('Solicitud enviada', 'Revisa tu correo', 'success'); }
    });

    // TOGGLE PASSWORD
    document.querySelectorAll('.toggle-pass-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target.type === 'password') { target.type = 'text'; this.querySelector('.material-icons').textContent = 'visibility'; }
            else { target.type = 'password'; this.querySelector('.material-icons').textContent = 'visibility_off'; }
        });
    });

    // DISCORD
    document.getElementById('connectDiscord').addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin + '/profile.html' } });
    });

    // IDIOMA
    document.getElementById('languageSelect').addEventListener('change', function() { localStorage.setItem('yxLang', this.value); });

    // MONEDA
    document.getElementById('currencySelect').addEventListener('change', function() { localStorage.setItem('yxCurrency', this.value); });

    // TEMA
    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
            document.documentElement.setAttribute('data-theme', this.dataset.accent);
            localStorage.setItem('yx-theme', this.dataset.accent);
            document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // ELIMINAR CUENTA
    document.getElementById('deleteAccountBtn').addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'flex'; });
    document.getElementById('cancelDelete').addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'none'; document.getElementById('deleteConfirmInput').value = ''; });
    document.getElementById('deleteConfirmInput').addEventListener('input', function() { document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR'; });
    document.getElementById('confirmDelete').addEventListener('click', async function() { await supabase.auth.signOut(); localStorage.clear(); window.location.href = 'index.html'; });

    // LOGOUT
    document.getElementById('logoutBtn').addEventListener('click', async function(e) { e.preventDefault(); await supabase.auth.signOut(); window.location.href = 'index.html'; });
}

function updateCartBadge() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

function showNotification(title, message, type) {
    var existing = document.querySelector('.notify-toast');
    if (existing) existing.remove();
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var toast = document.createElement('div');
    toast.className = 'notify-toast notify-' + type;
    toast.innerHTML = '<div class="notify-icon"><span class="material-icons">' + (icons[type] || 'info') + '</span></div><div class="notify-content"><div class="notify-title">' + title + '</div><div class="notify-message">' + message + '</div></div><button class="notify-close" onclick="this.parentElement.remove()"><span class="material-icons">close</span></button><div class="notify-progress"></div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400); }, 4000);
}

init();
