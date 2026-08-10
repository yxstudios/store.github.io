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
    console.log('Perfil cargado:', profile);

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
    
    // Spotify
    if (profile.spotify_id || profile.spotify_name) {
        console.log('Cargando Spotify...');
        loadSpotifyInfo(profile);
    } else {
        console.log('Spotify no vinculado');
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

function loadSpotifyInfo(profile) {
    setText('spotifyStatusText', 'Vinculado como ' + (profile.spotify_name || 'Usuario Spotify'));
    showEl('spotifyLinkedInfo');
    setText('spotifyLinkedUser', profile.spotify_name || 'Usuario de Spotify');
    setText('spotifyEmail', profile.spotify_email || '');
    if (profile.spotify_avatar) document.getElementById('spotifyAvatarImg').src = profile.spotify_avatar;
    setText('spotifyPlan', profile.spotify_plan || 'Free');
    setText('spotifyFollowers', (profile.spotify_followers || 0).toLocaleString());
    setText('spotifyPlaylists', (profile.spotify_playlists || 0).toLocaleString());
    setText('spotifyArtists', (profile.spotify_artists || 0).toLocaleString());
    if (profile.spotify_url) { var link = document.getElementById('spotifyProfileLink'); if (link) { link.href = profile.spotify_url; link.style.display = 'inline-flex'; } }
    document.getElementById('connectSpotifyBtn').innerHTML = '<i class="fab fa-spotify"></i> Revincular';
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
    document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempAvatar = ev.target.result; document.getElementById('profileAvatar').src = tempAvatar; var ta = document.getElementById('userAvatarTop'); if (ta) ta.src = tempAvatar; };
        reader.readAsDataURL(file);
    });
    document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { tempBanner = ev.target.result; document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')'; };
        reader.readAsDataURL(file);
    });
    document.getElementById('savePersonal')?.addEventListener('click', async function() {
        var data = { id: currentUser.id, full_name: getValue('editName'), nickname: getValue('editNickname'), bio: getValue('editBio'), updated_at: new Date().toISOString() };
        if (tempAvatar) data.avatar_url = tempAvatar; if (tempBanner) data.banner_url = tempBanner;
        var { error } = await supabase.from('profiles').upsert(data);
        if (error) { alert('Error: ' + error.message); return; }
        tempAvatar = null; tempBanner = null;
        document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
        var tn = document.getElementById('userNameDisplay'); if (tn) tn.textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
        alert('Perfil actualizado');
    });
    document.getElementById('changePasswordBtn')?.addEventListener('click', async function() {
        var p1 = getValue('newPassword'), p2 = getValue('confirmNewPassword');
        if (!p1 || !p2) { alert('Completa los campos'); return; } if (p1 !== p2) { alert('No coinciden'); return; } if (p1.length < 3) { alert('Mínimo 3 caracteres'); return; }
        var { error } = await supabase.auth.updateUser({ password: p1 });
        if (error) { alert('Error: ' + error.message); } else { alert('Contraseña actualizada'); setValue('newPassword', ''); setValue('confirmNewPassword', ''); }
    });
    document.getElementById('changeEmailBtn')?.addEventListener('click', async function() {
        var email = getValue('newEmail'); if (!email) { alert('Ingresa un correo'); return; }
        var { error } = await supabase.auth.updateUser({ email: email });
        if (error) { alert('Error: ' + error.message); } else { alert('Solicitud enviada'); }
    });
    document.querySelectorAll('.toggle-pass-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { var t = document.getElementById(this.dataset.target); if (t) { t.type = t.type === 'password' ? 'text' : 'password'; this.querySelector('.material-icons').textContent = t.type === 'password' ? 'visibility_off' : 'visibility'; } });
    });
    document.getElementById('connectDiscordBtn')?.addEventListener('click', async function() {
        await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: BASE_URL + '/profile.html' } });
    });
    document.getElementById('connectSpotifyBtn')?.addEventListener('click', async function() {
        try {
            var { error } = await supabase.auth.signInWithOAuth({ provider: 'spotify', options: { redirectTo: BASE_URL + '/profile.html', queryParams: { scope: 'user-read-email user-read-private user-follow-read playlist-read-private' } } });
            if (error) { alert('Error Spotify: ' + error.message); }
        } catch (e) { alert('Error al conectar con Spotify'); }
    });
    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() { document.documentElement.setAttribute('data-theme', this.dataset.accent); localStorage.setItem('yx-theme', this.dataset.accent); document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); }); this.classList.add('active'); });
    });
    document.getElementById('deleteAccountBtn')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'flex'; });
    document.getElementById('cancelDelete')?.addEventListener('click', function() { document.getElementById('deleteModal').style.display = 'none'; setValue('deleteConfirmInput', ''); });
    document.getElementById('deleteConfirmInput')?.addEventListener('input', function() { document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR'; });
    document.getElementById('confirmDelete')?.addEventListener('click', async function() { await supabase.from('profiles').delete().eq('id', currentUser.id); await supabase.auth.signOut(); localStorage.clear(); window.location.href = BASE_URL + '/index.html'; });
    document.getElementById('logoutBtn')?.addEventListener('click', async function(e) { e.preventDefault(); await supabase.auth.signOut(); window.location.href = BASE_URL + '/index.html'; });
}

function getValue(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setValue(id, value) { var el = document.getElementById(id); if (el) el.value = value; }
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function showEl(id) { var el = document.getElementById(id); if (el) el.style.display = 'block'; }
function updateCartBadge() { var cart = JSON.parse(localStorage.getItem('yxCart') || '[]'); var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0); var badge = document.getElementById('cartCount'); if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; } }

init();
