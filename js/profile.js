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
    var sessionData = await supabase.auth.getSession();
    if (!sessionData.data.session) {
        window.location.href = BASE_URL + '/login.html';
        return;
    }
    currentUser = sessionData.data.session.user;
    await loadProfile();
    loadPurchases();
    loadInvoices();
    setupNavigation();
    setupEvents();
    updateCartBadge();
}

async function loadProfile() {
    var profileData = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    var profile = profileData.data || {};
    if (!profile.id) {
        await supabase.from('profiles').insert({ id: currentUser.id });
        profile = { id: currentUser.id };
    }

    document.getElementById('profileName').textContent = profile.nickname || profile.full_name || 'Usuario';
    document.getElementById('profileEmailDisplay').textContent = currentUser.email;
    
    var topName = document.getElementById('userNameDisplay');
    if (topName) topName.textContent = profile.nickname || profile.full_name || currentUser.email.split('@')[0];
    
    var tooltipEmail = document.getElementById('tooltipEmail');
    if (tooltipEmail) tooltipEmail.textContent = currentUser.email;

    var avatarUrl = profile.avatar_url || 'https://via.placeholder.com/140';
    document.getElementById('profileAvatar').src = avatarUrl;
    
    var topAvatar = document.getElementById('userAvatarTop');
    if (topAvatar) topAvatar.src = avatarUrl;
    
    if (profile.banner_url) {
        document.getElementById('profileBanner').style.backgroundImage = 'url(' + profile.banner_url + ')';
    }

    document.getElementById('editName').value = profile.full_name || '';
    document.getElementById('editNickname').value = profile.nickname || '';
    document.getElementById('editUsername').value = profile.username || '';
    document.getElementById('editBio').value = profile.bio || '';

    var countData = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
    var count = countData.count || 0;
    var badge = document.getElementById('profileBadge');
    if (badge) {
        if (count >= 10) badge.textContent = 'VIP';
        else if (count >= 5) badge.textContent = 'Cliente Frecuente';
        else if (count >= 1) badge.textContent = 'Cliente';
        else badge.innerHTML = '<span class="badge-new"><span class="material-icons">new_releases</span> Nuevo</span>';
    }
}

async function loadPurchases() {
    var ordersData = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var orders = ordersData.data || [];
    var tbody = document.getElementById('purchasesTableBody');
    if (!tbody || orders.length === 0) return;
    
    tbody.innerHTML = orders.map(function(o) {
        var items = o.items ? o.items.map(function(i) { return i.name; }).join(', ') : 'Productos';
        return '<tr><td><strong>#' + o.id + '</strong></td><td>' + new Date(o.created_at).toLocaleDateString() + '</td><td>' + items + '</td><td>$' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</td><td><span class="status-badge status-completed">Completado</span></td></tr>';
    }).join('');
}

async function loadInvoices() {
    var ordersData = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var orders = ordersData.data || [];
    var list = document.getElementById('invoicesList');
    if (!list || orders.length === 0) return;
    
    list.innerHTML = orders.map(function(o) {
        return '<div class="invoice-card"><div class="invoice-info"><span class="material-icons">receipt</span><div><strong>Factura #' + o.id + '</strong><p>' + new Date(o.created_at).toLocaleDateString() + ' - $' + (o.total ? parseFloat(o.total).toFixed(2) : '0.00') + '</p></div></div></div>';
    }).join('');
}

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

function setupEvents() {
    var avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                tempAvatar = ev.target.result;
                document.getElementById('profileAvatar').src = tempAvatar;
                var ta = document.getElementById('userAvatarTop');
                if (ta) ta.src = tempAvatar;
            };
            reader.readAsDataURL(file);
        });
    }

    var bannerUpload = document.getElementById('bannerUpload');
    if (bannerUpload) {
        bannerUpload.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                tempBanner = ev.target.result;
                document.getElementById('profileBanner').style.backgroundImage = 'url(' + tempBanner + ')';
            };
            reader.readAsDataURL(file);
        });
    }

    var saveBtn = document.getElementById('savePersonal');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            var data = {
                id: currentUser.id,
                full_name: document.getElementById('editName').value.trim(),
                nickname: document.getElementById('editNickname').value.trim(),
                bio: document.getElementById('editBio').value.trim(),
                updated_at: new Date().toISOString()
            };
            if (tempAvatar) data.avatar_url = tempAvatar;
            if (tempBanner) data.banner_url = tempBanner;
            
            var result = await supabase.from('profiles').upsert(data);
            if (result.error) { alert('Error: ' + result.error.message); return; }
            
            tempAvatar = null;
            tempBanner = null;
            document.getElementById('profileName').textContent = data.nickname || data.full_name || 'Usuario';
            var tn = document.getElementById('userNameDisplay');
            if (tn) tn.textContent = data.nickname || data.full_name || currentUser.email.split('@')[0];
            alert('Perfil actualizado');
        });
    }

    var passBtn = document.getElementById('changePasswordBtn');
    if (passBtn) {
        passBtn.addEventListener('click', async function() {
            var p1 = document.getElementById('newPassword').value.trim();
            var p2 = document.getElementById('confirmNewPassword').value.trim();
            if (!p1 || !p2) { alert('Completa los campos'); return; }
            if (p1 !== p2) { alert('No coinciden'); return; }
            if (p1.length < 3) { alert('Minimo 3 caracteres'); return; }
            var result = await supabase.auth.updateUser({ password: p1 });
            if (result.error) { alert('Error: ' + result.error.message); }
            else {
                alert('Contrasena actualizada');
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
            }
        });
    }

    var emailBtn = document.getElementById('changeEmailBtn');
    if (emailBtn) {
        emailBtn.addEventListener('click', async function() {
            var email = document.getElementById('newEmail').value.trim();
            if (!email) { alert('Ingresa un correo'); return; }
            var result = await supabase.auth.updateUser({ email: email });
            if (result.error) { alert('Error: ' + result.error.message); }
            else { alert('Solicitud enviada. Revisa tu correo.'); }
        });
    }

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

    document.querySelectorAll('.theme-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
            document.documentElement.setAttribute('data-theme', this.dataset.accent);
            localStorage.setItem('yx-theme', this.dataset.accent);
            document.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    var deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            document.getElementById('deleteModal').style.display = 'flex';
        });
    }

    var cancelBtn = document.getElementById('cancelDelete');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('deleteModal').style.display = 'none';
            document.getElementById('deleteConfirmInput').value = '';
        });
    }

    var confirmInput = document.getElementById('deleteConfirmInput');
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            document.getElementById('confirmDelete').disabled = this.value !== 'ELIMINAR';
        });
    }

    var confirmBtn = document.getElementById('confirmDelete');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function() {
            await supabase.from('profiles').delete().eq('id', currentUser.id);
            await supabase.from('orders').delete().eq('user_id', currentUser.id);
            await supabase.auth.signOut();
            localStorage.clear();
            window.location.href = BASE_URL + '/index.html';
        });
    }

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = BASE_URL + '/index.html';
        });
    }
}

function updateCartBadge() {
    var cart = JSON.parse(localStorage.getItem('yxCart') || '[]');
    var count = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

init();
