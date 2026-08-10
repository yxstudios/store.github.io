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
    console.log('Profile init...');
    var { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = BASE_URL + '/login.html'; return; }
    currentUser = session.user;
    console.log('Usuario:', currentUser.email);
    await loadProfile();
    loadPurchases();
    loadInvoices();
    setupNavigation();
    setupEvents();
    updateCartBadge();
    console.log('Profile listo');
}

async function loadProfile() {
    var { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!profile) { await supabase.from('profiles').insert({ id: currentUser.id }); profile = {}; }

    document.getElementById('profileName').textContent = profile.nickname || profile.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    document.getElementById('userNameDisplay').textContent = profile.nickname || profile.full_name || currentUser.email.split('@')[0];
    document.getElementById('tooltipEmail').textContent = currentUser.email;
    
    var avatarUrl = profile.avatar_url || currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('userAvatarTop').src = avatarUrl;
    
    if (profile.banner_url) {
        document.getElementById('profileBanner').style.backgroundImage = 'url(' + profile.banner_url + ')';
    }
    
    document.getElementById('editName').value = profile.full_name || '';
    document.getElementById('editNickname').value = profile.nickname || '';
    document.getElementById('editUsername').value = profile.username || '';
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editRobloxConn').value = profile.roblox || '';
    
    // Discord
    if (profile.discord_username) {
        document.getElementById('discordStatusText').textContent = 'Vinculado: ' + profile.discord_username;
        document.getElementById('discordLinkedInfo').style.display = 'block';
        document.getElementById('discordLinkedUser').textContent = profile.discord_username;
        if (profile.discord_avatar) document.getElementById('discordAvatarImg').src = profile.discord_avatar;
        if (profile.discord_linked_at) document.getElementById('discordLinkedDate').textContent = new Date(profile.discord_linked_at).toLocaleDateString();
        document.getElementById('connectDiscordBtn').innerHTML = '<i class="fab fa-discord"></i> Revincular';
    }
    
    // Roblox
    if (profile.roblox) {
        document.getElementById('robloxStatusText').textContent = 'Vinculado: ' + profile.roblox;
        document.getElementById('robloxLinkedInfo').style.display = 'block';
        document.getElementById('robloxLinkedUser').textContent = profile.roblox;
        if (profile.roblox_id) {
            fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + profile.roblox_id + '&size=48x48&format=Png&isCircular=true')
                .then(function(r) { return r.json(); })
                .then(function(d) { if (d.data && d.data[0]) document.getElementById('robloxAvatarImg').src = d.data[0].imageUrl; })
                .catch(function() {});
        }
        document.getElementById('connectRobloxBtn').innerHTML = '<span class="material-icons">sync</span> Revincular';
    }
    
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
        return '<tr><td><strong>#' + o.id + '</strong></td><td>' + new Date(o.created_at).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td></tr>';
    }).join('');
}

async function loadInvoices() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var list = document.getElementById('invoicesList');
    if (!orders || !orders.length) return;
    list.innerHTML = orders.map(function(o) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + o.id + '</strong><p>' + new Date(o.created_at).toLocaleDateString() + ' - $' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</p></div></div></div>';
    }).join('');
}

function setupNavigation() {
    document.querySelectorAll('.profile-menu-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.profile-menu-link').forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.profile-section-block').forEach(function(s) { s.classList.remove('active'); });
            var sectionId = this.dataset.section + 'Section';
            var el = document.getElementById(sectionId);
            if (el) el.classList.add('active');
        });
    });
}

function setupEvents() {
    document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempAvatar = ev.target.result; document.getElementById('profileAvatar').src = tempAvatar; document.getElementById('userAvatarTop').src = tempAvatar; };
        reader.readAsDataURL(file);
    });

    document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempBanner = ev.target.result; document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')'; };
        reader.readAsDataURL(file);
    });

    document.getElementById('savePersonal')?.addEventListener('click', async function() {
        var data = { id: currentUser.id, full_name: document.getElementById('editName').value.trim(), nickname: document.getElementById('editNickname').value.trim(), bio: document.getElementById('editBio').value.trim(), updated_at: new Date().toISOString() };
        if (tempAvatar) data.avatar_url = tempAvatar;
        if (tempBanner) data.banner_url = tempBanner;
        var { error } = await supabase.from('profiles').upsert(data);
        if (error) { alert('Error: ' + error.message); return; }
        tempAvatar = null; tempBanner = null;
        document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
        document.getElementById('userNameDisplay').textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
        alert('Perfil actualizado correctamente');
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', async function() {
        var p1 = document.getElementById('newPassword').value;
        var p2 = document.getElementById('confirmNewPassword').value;
        if (!p1 || !p2) { alert('Completa los campos'); return; }
        if (p1 !== p2) { alert('No coinciden'); return; }
        if (p1.length < 3) { alert('Mínimo 3 caracteres'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { alert('Error: ' + error.message); }
        else { alert('Contraseña actualizada'); document.getElementById('newPassword').value = ''; document.getElementById('confirmNewPassword').value = ''; }
    });

    document.getElementById('changeEmailBtn')?.addEventListener('click', async function() {
        var email = document.getElementById('newEmail').value.trim();
        if (!email) { alert('Ingresa un correo'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { alert('Error: ' + error.message); }
        else { alert('Solicitud enviada. Revisa tu correo.'); }
    });

    document.getElementById('connectDiscordBtn')?.addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: BASE_URL + '/profile.html' } });
    });

    document.getElementById('connectRobloxBtn')?.addEventListener('click', async function() {
        var robloxUser = document.getElementById('editRobloxConn').value.trim();
        if (!robloxUser) { alert('Ingresa tu username de Roblox'); return; }
        try {
            var response = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [robloxUser] }) });
            var data = await response.json();
            if (data.data && data.data.length > 0) {
                var robloxId = data.data[0].id;
                var displayName = data.data[0].name;
                await supabase.from('profiles').upsert({ id: currentUser.id, roblox: displayName, roblox_id: robloxId, updated_at: new Date().toISOString() });
                document.getElementById('robloxStatusText').textContent = 'Vinculado: ' + displayName;
                document.getElementById('robloxLinkedInfo').style.display = 'block';
                document.getElementById('robloxLinkedUser').textContent = displayName;
                document.getElementById('editRobloxConn').value = displayName;
                var avatarRes = await fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + robloxId + '&size=48x48&format=Png&isCircular=true');
                var avatarData = await avatarRes.json();
                if (avatarData.data && avatarData.data[0]) document.getElementById('robloxAvatarImg').src = avatarData.data[0].imageUrl;
                document.getElementById('connectRobloxBtn').innerHTML = '<span class="material-icons">sync</span> Revincular';
                alert('Roblox vinculado correctamente');
            } else { alert('Usuario no encontrado'); }
        } catch (e) { alert('Error al conectar con Roblox'); }
    });

    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'flex'; });
    document.getElementById('cancelDelete')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'none'; });
    document.getElementById('deleteConfirmInput')?.addEventListener('input', function() { document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR'; });
    document.getElementById('confirmDelete')?.addEventListener('click', async function() {
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = BASE_URL + '/index.html';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async function(e) {
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

init();
