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

    // Nombre y apodo
    document.getElementById('profileName').textContent = profile.nickname || profile.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    document.getElementById('userNameDisplay').textContent = profile.nickname || profile.full_name || currentUser.email.split('@')[0];
    document.getElementById('tooltipEmail').textContent = currentUser.email;
    
    // Avatar
    var avatarUrl = profile.avatar_url || currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('userAvatarTop').src = avatarUrl;
    
    // Banner
    if (profile.banner_url) {
        document.getElementById('profileBanner').style.backgroundImage = 'url(' + profile.banner_url + ')';
    }
    
    // Campos
    document.getElementById('editName').value = profile.full_name || '';
    document.getElementById('editNickname').value = profile.nickname || '';
    document.getElementById('editUsername').value = profile.username || '';
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editRoblox').value = profile.roblox || '';
    
    // Discord info
    if (profile.discord_username) {
        document.getElementById('discordStatusText').textContent = 'Vinculado como ' + profile.discord_username;
        document.getElementById('discordLinkedInfo').style.display = 'block';
        document.getElementById('discordLinkedUser').textContent = profile.discord_username;
        if (profile.discord_avatar) {
            document.getElementById('discordAvatarImg').src = profile.discord_avatar;
        }
        if (profile.discord_linked_at) {
            document.getElementById('discordLinkedDate').textContent = 'Vinculado el ' + new Date(profile.discord_linked_at).toLocaleDateString();
        }
        document.getElementById('connectDiscordBtn').innerHTML = '<i class="fab fa-discord"></i> Revincular';
    }
    
    // Roblox info
    if (profile.roblox) {
        document.getElementById('robloxStatusText').textContent = 'Vinculado como ' + profile.roblox;
        document.getElementById('robloxLinkedInfo').style.display = 'block';
        document.getElementById('robloxLinkedUser').textContent = profile.roblox;
        document.getElementById('editRobloxConn').value = profile.roblox;
        if (profile.roblox_id) {
            fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + profile.roblox_id + '&size=48x48&format=Png&isCircular=true')
                .then(function(r) { return r.json(); })
                .then(function(d) { if (d.data && d.data[0]) document.getElementById('robloxAvatarImg').src = d.data[0].imageUrl; })
                .catch(function() {});
        }
        document.getElementById('connectRobloxBtn').innerHTML = '<span class="material-icons">sync</span> Revincular';
    }
    
    // Badge
    var { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
    var badge = document.getElementById('profileBadge');
    if (count >= 10) badge.textContent = 'VIP';
    else if (count >= 5) badge.textContent = 'Cliente Frecuente';
    else if (count >= 1) badge.textContent = 'Cliente';
    else badge.innerHTML = '<span class="badge-new"><span class="material-icons">new_releases</span> Nuevo</span>';
}

async function loadPurchases() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var tbody = document.getElementById('purchasesTableBody');
    if (!orders || !orders.length) return;
    tbody.innerHTML = orders.map(function(o) {
        var items = o.items ? o.items.map(function(i) { return i.name; }).join(', ') : 'Productos';
        return '<tr><td><strong>#' + o.id + '</strong></td><td>' + new Date(o.created_at).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td><td><button class="btn-sm btn-outline" onclick="downloadInvoice(' + o.id + ')"><span class="material-icons">download</span></button></td></tr>';
    }).join('');
}

async function loadInvoices() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var list = document.getElementById('invoicesList');
    if (!orders || !orders.length) return;
    list.innerHTML = orders.map(function(o) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + o.id + '</strong><p>' + new Date(o.created_at).toLocaleDateString() + ' - $' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</p></div></div><button class="btn-sm btn-outline" onclick="downloadInvoice(' + o.id + ')"><span class="material-icons">download</span> Descargar</button></div>';
    }).join('');
}

window.downloadInvoice = function(orderId) {
    var content = 'YX STUDIOS - FACTURA\n========================\nFactura: #' + orderId + '\nGracias por tu compra!';
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'factura_' + orderId + '.txt'; a.click();
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
    // Avatar
    document.getElementById('avatarUpload').addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            tempAvatar = ev.target.result;
            document.getElementById('profileAvatar').src = tempAvatar;
            document.getElementById('userAvatarTop').src = tempAvatar;
        };
        reader.readAsDataURL(file);
    });

    // Banner
    document.getElementById('bannerUpload').addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            tempBanner = ev.target.result;
            document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')';
        };
        reader.readAsDataURL(file);
    });

    // Guardar perfil
    document.getElementById('savePersonal').addEventListener('click', async function() {
        var data = {
            id: currentUser.id,
            full_name: document.getElementById('editName').value.trim(),
            nickname: document.getElementById('editNickname').value.trim(),
            bio: document.getElementById('editBio').value.trim(),
            updated_at: new Date().toISOString()
        };
        if (tempAvatar) data.avatar_url = tempAvatar;
        if (tempBanner) data.banner_url = tempBanner;
        
        var { error } = await supabase.from('profiles').upsert(data);
        if (error) { showNotification('Error', error.message, 'error'); return; }
        
        tempAvatar = null; tempBanner = null;
        document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
        document.getElementById('userNameDisplay').textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
        showNotification(t('notif_profile_updated'), t('notif_profile_updated_desc'), 'success');
    });

    // Cambiar contraseña
    document.getElementById('changePasswordBtn').addEventListener('click', async function() {
        var p1 = document.getElementById('newPassword').value;
        var p2 = document.getElementById('confirmNewPassword').value;
        if (!p1 || !p2) { showNotification('Error', 'Completa los campos', 'error'); return; }
        if (p1 !== p2) { showNotification('Error', 'No coinciden', 'error'); return; }
        if (p1.length < 3) { showNotification('Error', 'Mínimo 3 caracteres', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification(t('notif_password_changed'), '', 'success'); document.getElementById('newPassword').value = ''; document.getElementById('confirmNewPassword').value = ''; }
    });

    // Cambiar email
    document.getElementById('changeEmailBtn').addEventListener('click', async function() {
        var email = document.getElementById('newEmail').value.trim();
        if (!email) { showNotification('Error', 'Ingresa un correo', 'error'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { showNotification('Error', error.message, 'error'); }
        else { showNotification('Solicitud enviada', 'Revisa tu correo', 'success'); }
    });

    // Toggle password
    document.querySelectorAll('.toggle-pass-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target.type === 'password') { target.type = 'text'; this.querySelector('.material-icons').textContent = 'visibility'; }
            else { target.type = 'password'; this.querySelector('.material-icons').textContent = 'visibility_off'; }
        });
    });

    // Vincular Discord
    document.getElementById('connectDiscordBtn').addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: BASE_URL + '/profile.html' } });
    });

    // Vincular Roblox
    document.getElementById('connectRobloxBtn').addEventListener('click', async function() {
        var robloxUser = document.getElementById('editRobloxConn').value.trim();
        if (!robloxUser) { showNotification('Error', 'Ingresa tu username de Roblox', 'error'); return; }
        
        try {
            var response = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames: [robloxUser] })
            });
            var data = await response.json();
            
            if (data.data && data.data.length > 0) {
                var robloxId = data.data[0].id;
                var displayName = data.data[0].name;
                
                await supabase.from('profiles').upsert({
                    id: currentUser.id, roblox: displayName, roblox_id: robloxId, updated_at: new Date().toISOString()
                });
                
                document.getElementById('robloxStatusText').textContent = 'Vinculado como ' + displayName;
                document.getElementById('robloxLinkedInfo').style.display = 'block';
                document.getElementById('robloxLinkedUser').textContent = displayName;
                document.getElementById('editRobloxConn').value = displayName;
                
                var avatarRes = await fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + robloxId + '&size=48x48&format=Png&isCircular=true');
                var avatarData = await avatarRes.json();
                if (avatarData.data && avatarData.data[0]) {
                    document.getElementById('robloxAvatarImg').src = avatarData.data[0].imageUrl;
                }
                
                document.getElementById('connectRobloxBtn').innerHTML = '<span class="material-icons">sync</span> Revincular';
                showNotification('Roblox vinculado', 'Cuenta vinculada correctamente', 'success');
            } else {
                showNotification('Error', 'Usuario de Roblox no encontrado', 'error');
            }
        } catch (e) {
            showNotification('Error', 'No se pudo conectar con Roblox', 'error');
        }
    });

    // Tema
    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
            document.documentElement.setAttribute('data-theme', this.dataset.accent);
            localStorage.setItem('yx-theme', this.dataset.accent);
            document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // Eliminar cuenta
    document.getElementById('deleteAccountBtn').addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'flex'; });
    document.getElementById('cancelDelete').addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'none'; document.getElementById('deleteConfirmInput').value = ''; });
    document.getElementById('deleteConfirmInput').addEventListener('input', function() { document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR'; });
    document.getElementById('confirmDelete').addEventListener('click', async function() {
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = BASE_URL + '/index.html';
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = BASE_URL + '/index.html';
    });
}

function updateCartBadge() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

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

init();
