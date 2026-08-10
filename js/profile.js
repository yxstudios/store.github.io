import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

var BASE_URL = 'https://yxstore.linkpc.net';
var currentUser = null;
var tempAvatar = null;
var tempBanner = null;

// ============================================
// INICIAR
// ============================================
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

// ============================================
// CARGAR PERFIL
// ============================================
async function loadProfile() {
    var { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!profile) { await supabase.from('profiles').insert({ id: currentUser.id }); profile = {}; }

    // Nombres
    document.getElementById('profileName').textContent = profile.nickname || profile.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    var topName = document.getElementById('userNameDisplay');
    if (topName) topName.textContent = profile.nickname || profile.full_name || currentUser.email.split('@')[0];
    var tooltipEmail = document.getElementById('tooltipEmail');
    if (tooltipEmail) tooltipEmail.textContent = currentUser.email;
    
    // Avatar
    var avatarUrl = profile.avatar_url || currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    var topAvatar = document.getElementById('userAvatarTop');
    if (topAvatar) topAvatar.src = avatarUrl;
    
    // Banner
    if (profile.banner_url) {
        document.getElementById('profileBanner').style.backgroundImage = 'url(' + profile.banner_url + ')';
    }
    
    // Campos
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
    
    // Roblox
    if (profile.roblox_id) {
        await loadRobloxInfo(profile.roblox_id, profile.roblox);
    }
    
    // Badge
    var { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
    var badge = document.getElementById('profileBadge');
    if (badge) {
        if (count >= 10) badge.textContent = 'VIP';
        else if (count >= 5) badge.textContent = 'Cliente Frecuente';
        else if (count >= 1) badge.textContent = 'Cliente';
        else badge.innerHTML = '<span class="badge-new"><span class="material-icons">new_releases</span> Nuevo</span>';
    }
}

// ============================================
// CARGAR INFO COMPLETA DE ROBLOX
// ============================================
async function loadRobloxInfo(robloxId, username) {
    console.log('Cargando info de Roblox ID:', robloxId);
    
    setText('robloxStatusText', 'Vinculado como ' + (username || robloxId));
    showEl('robloxLinkedInfo');
    setText('robloxLinkedUser', username || 'Usuario #' + robloxId);
    setValue('editRobloxConn', username || '');
    document.getElementById('connectRobloxBtn').innerHTML = '<span class="material-icons">sync</span> Revincular';
    
    // Avatar
    try {
        var avatarUrl = 'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + robloxId + '&size=150x150&format=Png&isCircular=true';
        var avatarRes = await fetch(avatarUrl);
        if (avatarRes.ok) {
            var avatarData = await avatarRes.json();
            if (avatarData.data && avatarData.data[0] && avatarData.data[0].imageUrl) {
                document.getElementById('robloxAvatarImg').src = avatarData.data[0].imageUrl;
            }
        }
    } catch (e) { console.log('Error avatar:', e); }
    
    // Perfil
    try {
        var profileRes = await fetch('https://users.roblox.com/v1/users/' + robloxId);
        if (profileRes.ok) {
            var profileData = await profileRes.json();
            if (profileData.name) {
                setText('robloxLinkedUser', profileData.name);
                if (profileData.displayName && profileData.displayName !== profileData.name) {
                    setText('robloxDisplayName', '@' + profileData.name);
                }
                if (profileData.created) {
                    var d = new Date(profileData.created);
                    setText('robloxCreated', d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
                }
            }
        }
    } catch (e) { console.log('Error perfil:', e); }
    
    // Stats
    var statsToLoad = [
        { url: 'https://friends.roblox.com/v1/users/' + robloxId + '/friends/count', id: 'robloxFriends' },
        { url: 'https://friends.roblox.com/v1/users/' + robloxId + '/followers/count', id: 'robloxFollowers' },
        { url: 'https://friends.roblox.com/v1/users/' + robloxId + '/followings/count', id: 'robloxFollowing' }
    ];
    
    for (var i = 0; i < statsToLoad.length; i++) {
        try {
            var res = await fetch(statsToLoad[i].url);
            if (res.ok) {
                var data = await res.json();
                if (data.count !== undefined) {
                    setText(statsToLoad[i].id, data.count.toLocaleString());
                }
            }
        } catch (e) { console.log('Error stats:', e); }
    }
    
    // Link
    var profileLink = document.getElementById('robloxProfileLink');
    if (profileLink) {
        profileLink.href = 'https://www.roblox.com/users/' + robloxId + '/profile';
        profileLink.style.display = 'inline-flex';
    }
}

// ============================================
// COMPRAS Y FACTURAS
// ============================================
async function loadPurchases() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    if (!orders || !orders.length) return;
    tbody.innerHTML = orders.map(function(o) {
        var items = o.items ? o.items.map(function(i) { return i.name; }).join(', ') : 'Productos';
        return '<tr><td><strong>#' + o.id + '</strong></td><td>' + new Date(o.created_at).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td></tr>';
    }).join('');
}

async function loadInvoices() {
    var { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var list = document.getElementById('invoicesList');
    if (!list) return;
    if (!orders || !orders.length) return;
    list.innerHTML = orders.map(function(o) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + o.id + '</strong><p>' + new Date(o.created_at).toLocaleDateString() + ' - $' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</p></div></div></div>';
    }).join('');
}

// ============================================
// NAVEGACIÓN
// ============================================
function setupNavigation() {
    var links = document.querySelectorAll('.profile-menu-link');
    var sections = document.querySelectorAll('.profile-section-block');
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            links.forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            sections.forEach(function(s) { s.classList.remove('active'); });
            var sectionId = this.getAttribute('data-section') + 'Section';
            var section = document.getElementById(sectionId);
            if (section) section.classList.add('active');
        });
    });
}

// ============================================
// EVENTOS
// ============================================
function setupEvents() {
    // Avatar upload
    document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            tempAvatar = ev.target.result;
            document.getElementById('profileAvatar').src = tempAvatar;
            var ta = document.getElementById('userAvatarTop'); if (ta) ta.src = tempAvatar;
        };
        reader.readAsDataURL(file);
    });

    // Banner upload
    document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            tempBanner = ev.target.result;
            document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')';
        };
        reader.readAsDataURL(file);
    });

    // Guardar perfil
    document.getElementById('savePersonal')?.addEventListener('click', async function() {
        var data = {
            id: currentUser.id,
            full_name: getValue('editName'),
            nickname: getValue('editNickname'),
            bio: getValue('editBio'),
            updated_at: new Date().toISOString()
        };
        if (tempAvatar) data.avatar_url = tempAvatar;
        if (tempBanner) data.banner_url = tempBanner;
        
        var { error } = await supabase.from('profiles').upsert(data);
        if (error) { alert('Error: ' + error.message); return; }
        
        tempAvatar = null; tempBanner = null;
        document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
        var tn = document.getElementById('userNameDisplay'); if (tn) tn.textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
        alert('Perfil actualizado correctamente');
    });

    // Cambiar contraseña
    document.getElementById('changePasswordBtn')?.addEventListener('click', async function() {
        var p1 = getValue('newPassword'), p2 = getValue('confirmNewPassword');
        if (!p1 || !p2) { alert('Completa los campos'); return; }
        if (p1 !== p2) { alert('No coinciden'); return; }
        if (p1.length < 3) { alert('Mínimo 3 caracteres'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { alert('Error: ' + error.message); } else { alert('Contraseña actualizada'); setValue('newPassword', ''); setValue('confirmNewPassword', ''); }
    });

    // Cambiar email
    document.getElementById('changeEmailBtn')?.addEventListener('click', async function() {
        var email = getValue('newEmail');
        if (!email) { alert('Ingresa un correo'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { alert('Error: ' + error.message); } else { alert('Solicitud enviada. Revisa tu correo.'); }
    });

    // Toggle password
    document.querySelectorAll('.toggle-pass-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(this.dataset.target);
            if (target) {
                if (target.type === 'password') { target.type = 'text'; this.querySelector('.material-icons').textContent = 'visibility'; }
                else { target.type = 'password'; this.querySelector('.material-icons').textContent = 'visibility_off'; }
            }
        });
    });

    // Discord
    document.getElementById('connectDiscordBtn')?.addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: BASE_URL + '/profile.html' } });
    });

    // Roblox
    document.getElementById('connectRobloxBtn')?.addEventListener('click', async function() {
        var input = getValue('editRobloxConn');
        if (!input) { alert('Ingresa tu username o ID de Roblox'); return; }
        
        var robloxId = null;
        var displayName = null;
        
        try {
            if (/^\d+$/.test(input)) {
                robloxId = parseInt(input);
                var userRes = await fetch('https://users.roblox.com/v1/users/' + robloxId);
                if (!userRes.ok) throw new Error('Usuario no encontrado');
                var userData = await userRes.json();
                if (userData.name) { displayName = userData.name; }
                else { alert('ID de Roblox no encontrado'); return; }
            } else {
                var searchRes = await fetch('https://users.roblox.com/v1/usernames/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ usernames: [input] })
                });
                if (!searchRes.ok) throw new Error('Error en búsqueda');
                var searchData = await searchRes.json();
                if (searchData.data && searchData.data.length > 0 && searchData.data[0].name) {
                    robloxId = searchData.data[0].id;
                    displayName = searchData.data[0].name;
                } else { alert('Usuario no encontrado'); return; }
            }
            
            console.log('Roblox vinculado - ID:', robloxId, 'Nombre:', displayName);
            
            var { error } = await supabase.from('profiles').upsert({
                id: currentUser.id, roblox: displayName, roblox_id: robloxId, updated_at: new Date().toISOString()
            });
            if (error) { alert('Error al guardar'); return; }
            
            await loadRobloxInfo(robloxId, displayName);
            alert('¡Roblox vinculado correctamente!');
            
        } catch (e) {
            console.error('Error:', e);
            alert('Error al conectar con Roblox: ' + e.message);
        }
    });

    // Theme dots
    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
            document.documentElement.setAttribute('data-theme', this.dataset.accent);
            localStorage.setItem('yx-theme', this.dataset.accent);
            document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // Eliminar cuenta
    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
        var modal = document.getElementById('deleteModal'); if (modal) modal.style.display = 'flex';
    });
    document.getElementById('cancelDelete')?.addEventListener('click', function() {
        var modal = document.getElementById('deleteModal'); if (modal) modal.style.display = 'none'; setValue('deleteConfirmInput', '');
    });
    document.getElementById('deleteConfirmInput')?.addEventListener('input', function() {
        var btn = document.getElementById('confirmDelete'); if (btn) btn.disabled = this.value !== 'ELIMINAR';
    });
    document.getElementById('confirmDelete')?.addEventListener('click', async function() {
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut(); localStorage.clear();
        window.location.href = BASE_URL + '/index.html';
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async function(e) {
        e.preventDefault(); await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html';
    });
}

// ============================================
// UTILIDADES
// ============================================
function getValue(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setValue(id, value) { var el = document.getElementById(id); if (el) el.value = value; }
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function showEl(id) { var el = document.getElementById(id); if (el) el.style.display = 'block'; }
function updateCartBadge() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

// ============================================
// INICIAR
// ============================================
init();
