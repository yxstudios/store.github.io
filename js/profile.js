// ============================================
// YX STUDIOS - PERFIL DE USUARIO
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var currentUser = null;
var userProfile = JSON.parse(localStorage.getItem('yxProfile') || '{}');

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserSession();
    loadProfileData();
    setupNavigation();
    setupEventListeners();
    updateCartBadge();
    loadPurchases();
    loadInvoices();
});

// ============================================
// CARGAR SESIÓN
// ============================================
async function loadUserSession() {
    var { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    
    document.getElementById('profileName').textContent = currentUser.user_metadata?.full_name || 'Usuario';
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('userNameDisplay').textContent = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    
    if (currentUser.user_metadata?.avatar_url) {
        document.getElementById('profileAvatar').src = currentUser.user_metadata.avatar_url;
        document.getElementById('userAvatarTop').src = currentUser.user_metadata.avatar_url;
    }
    
    document.getElementById('editName').value = userProfile.full_name || currentUser.user_metadata?.full_name || '';
    document.getElementById('editBio').value = userProfile.bio || '';
    document.getElementById('editRoblox').value = userProfile.roblox || '';
    document.getElementById('editDiscord').value = userProfile.discord || '';
    
    if (userProfile.banner_url) {
        document.getElementById('bannerPreview').style.backgroundImage = 'url(' + userProfile.banner_url + ')';
    }
    
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var badge = document.getElementById('profileBadge');
    if (orders.length >= 10) badge.textContent = 'VIP';
    else if (orders.length >= 5) badge.textContent = 'Cliente Frecuente';
    else if (orders.length >= 1) badge.textContent = 'Cliente';
    else badge.textContent = 'Nuevo';
}

function loadProfileData() {
    var savedLang = localStorage.getItem('yxLang') || 'es';
    document.getElementById('languageSelect').value = savedLang;
    var savedCurrency = localStorage.getItem('yxCurrency') || 'USD';
    document.getElementById('currencySelect').value = savedCurrency;
}

function setupNavigation() {
    document.querySelectorAll('.profile-nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.profile-nav-link').forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.profile-section').forEach(function(s) { s.classList.remove('active'); });
            var sectionId = this.dataset.section + 'Section';
            document.getElementById(sectionId).classList.add('active');
            if (this.dataset.section === 'purchases') loadPurchases();
            if (this.dataset.section === 'invoices') loadInvoices();
        });
    });
    if (window.location.hash === '#purchases') {
        document.querySelector('[data-section="purchases"]')?.click();
    }
}

function setupEventListeners() {
    document.getElementById('savePersonal')?.addEventListener('click', async function() {
        var name = document.getElementById('editName').value.trim();
        var bio = document.getElementById('editBio').value.trim();
        var roblox = document.getElementById('editRoblox').value.trim();
        var discord = document.getElementById('editDiscord').value.trim();
        await supabase.auth.updateUser({ data: { full_name: name } });
        userProfile.full_name = name;
        userProfile.bio = bio;
        userProfile.roblox = roblox;
        userProfile.discord = discord;
        localStorage.setItem('yxProfile', JSON.stringify(userProfile));
        document.getElementById('profileName').textContent = name || 'Usuario';
        document.getElementById('userNameDisplay').textContent = name || currentUser.email.split('@')[0];
        showNotification('Perfil actualizado', 'Tus datos han sido guardados', 'success');
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', async function() {
        var newPass = document.getElementById('newPassword').value;
        var confirmPass = document.getElementById('confirmNewPassword').value;
        if (!newPass || !confirmPass) { showNotification('Campos vacíos', 'Completa todos los campos', 'error'); return; }
        if (newPass !== confirmPass) { showNotification('Error', 'Las contraseñas no coinciden', 'error'); return; }
        if (newPass.length < 6) { showNotification('Contraseña débil', 'Mínimo 6 caracteres', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) { showNotification('Error', error.message, 'error'); }
        else {
            showNotification('Contraseña actualizada', 'Tu contraseña ha sido cambiada', 'success');
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        }
    });

    document.getElementById('changeEmailBtn')?.addEventListener('click', async function() {
        var newEmail = document.getElementById('newEmail').value.trim();
        if (!newEmail) { showNotification('Campo vacío', 'Ingresa un nuevo correo', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification('Solicitud enviada', 'Revisa tu nuevo correo para confirmar', 'success'); }
    });

    document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(event) {
            var avatarUrl = event.target.result;
            document.getElementById('profileAvatar').src = avatarUrl;
            document.getElementById('userAvatarTop').src = avatarUrl;
            userProfile.avatar_url = avatarUrl;
            localStorage.setItem('yxProfile', JSON.stringify(userProfile));
            showNotification('Avatar actualizado', 'Tu foto de perfil ha sido cambiada', 'success');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(event) {
            var bannerUrl = event.target.result;
            document.getElementById('bannerPreview').style.backgroundImage = 'url(' + bannerUrl + ')';
            userProfile.banner_url = bannerUrl;
            localStorage.setItem('yxProfile', JSON.stringify(userProfile));
            showNotification('Banner actualizado', 'Tu banner ha sido cambiado', 'success');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('languageSelect')?.addEventListener('change', function() {
        localStorage.setItem('yxLang', this.value);
        showNotification('Idioma cambiado', 'El cambio se aplicará al recargar', 'info');
    });

    document.getElementById('currencySelect')?.addEventListener('change', function() {
        localStorage.setItem('yxCurrency', this.value);
        showNotification('Moneda cambiada', 'El cambio se aplicará al recargar', 'info');
    });

    document.querySelectorAll('.accent-color-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var accent = this.dataset.accent;
            document.documentElement.setAttribute('data-theme', accent);
            localStorage.setItem('yx-theme', accent);
            document.querySelectorAll('.accent-color-btn').forEach(function(b) { b.style.border = '2px solid transparent'; });
            this.style.border = '2px solid white';
        });
    });

    document.getElementById('connectDiscord')?.addEventListener('click', async function() {
        var { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: window.location.origin + '/profile.html' }
        });
        if (error) showNotification('Error', error.message, 'error');
    });

    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'flex';
    });

    document.getElementById('cancelDelete')?.addEventListener('click', function() {
        document.getElementById('deleteModal').style.display = 'none';
        document.getElementById('deleteConfirmInput').value = '';
    });

    document.getElementById('deleteConfirmInput')?.addEventListener('input', function() {
        document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR';
    });

    document.getElementById('confirmDelete')?.addEventListener('click', async function() {
        showNotification('Cuenta eliminada', 'Tu cuenta ha sido eliminada. Adiós.', 'info');
        await supabase.auth.signOut();
        localStorage.clear();
        setTimeout(function() { window.location.href = 'index.html'; }, 2000);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async function(e) {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

function loadPurchases() {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var tbody = document.getElementById('purchasesTableBody');
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No tienes compras realizadas</td></tr>';
        return;
    }
    tbody.innerHTML = orders.reverse().map(function(order) {
        var itemsList = order.items ? order.items.map(function(i) { return i.name; }).join(', ') : 'Productos';
        return '<tr><td><strong>#' + (order.id || '').substring(0, 8) + '</strong></td><td>' + new Date(order.date).toLocaleDateString() + '</td><td>' + itemsList + '</td><td>$' + (order.total ? order.total.toFixed(2) : '0.00') + '</td><td><span class="status-badge status-' + (order.status || 'completed') + '">' + (order.status || 'Completado') + '</span></td><td><button class="btn-sm btn-outline" onclick="downloadInvoice(\'' + order.id + '\')"><span class="material-icons">download</span></button></td></tr>';
    }).join('');
}

function loadInvoices() {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var list = document.getElementById('invoicesList');
    if (!orders.length) { list.innerHTML = '<p class="text-muted">No hay facturas disponibles</p>'; return; }
    list.innerHTML = orders.map(function(order) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + (order.id || '').substring(0, 8) + '</strong><p>' + new Date(order.date).toLocaleDateString() + ' - $' + (order.total ? order.total.toFixed(2) : '0.00') + '</p></div></div><button class="btn-sm btn-outline" onclick="downloadInvoice(\'' + order.id + '\')"><span class="material-icons">download</span> Descargar PDF</button></div>';
    }).join('');
}

window.downloadInvoice = function(orderId) {
    var orders = JSON.parse(localStorage.getItem('yxOrders') || '[]');
    var order = orders.find(function(o) { return o.id === orderId; });
    if (!order) { showNotification('Error', 'Factura no encontrada', 'error'); return; }
    var content = 'YX STUDIOS - FACTURA\n========================\nFactura: #' + order.id.substring(0, 8) + '\nFecha: ' + new Date(order.date).toLocaleDateString() + '\nTotal: $' + (order.total ? order.total.toFixed(2) : '0.00') + '\nEstado: ' + (order.status || 'Completado') + '\n========================\nGracias por tu compra!';
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'factura_' + order.id.substring(0, 8) + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Factura descargada', 'La factura se ha descargado correctamente', 'success');
};

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

function updateCartBadge() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}
