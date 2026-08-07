
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = session.user;
    
    // Cargar información del usuario
    document.getElementById('userName').textContent = user.user_metadata?.full_name || 'Usuario';
    document.getElementById('userEmail').textContent = user.email;
    
    if (user.user_metadata?.avatar_url) {
        document.getElementById('userAvatar').src = user.user_metadata.avatar_url;
    }
    
    // Cargar estadísticas (aquí conectarías con tu base de datos)
    document.getElementById('purchaseCount').textContent = '0';
    document.getElementById('favoriteCount').textContent = '0';
    document.getElementById('pointsBalance').textContent = '0';
}

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Cargar al iniciar
loadDashboard();
