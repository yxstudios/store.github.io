// ============================================
// YX STUDIOS - SINCRONIZACIÓN OAUTH (DISCORD + SPOTIFY)
// ============================================
// Este archivo centraliza el guardado de datos de proveedores OAuth
// (Discord, Spotify) en la tabla `profiles`. Se carga en CUALQUIER
// página donde el usuario pueda iniciar un flujo de OAuth y volver
// a ella (login.html, register.html, profile.html), para que el
// evento SIGNED_IN siempre tenga un listener escuchando y guardando.
//
// IMPORTANTE: este archivo debe ser el ÚNICO lugar donde se registra
// un listener onAuthStateChange que guarda datos de Discord/Spotify.
// Si se registra en más de un archivo cargado en la misma página,
// el guardado se ejecutará una vez por cada listener duplicado.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var supabase = createClient(
    'https://qfgofnlvfxcmzexwuzou.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ29mbmx2ZnhjbXpleHd1em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjMxNDEsImV4cCI6MjEwMTczOTE0MX0.f-DaLy6effZWpCln1z_Ib2aHBAEs0SGjcqx647PlZCc'
);

console.log('OAuth Sync JS - Cargado');

supabase.auth.onAuthStateChange(async function(event, session) {
    console.log('=== Auth State Changed (oauth-sync) ===');
    console.log('Event:', event);

    if (event === 'SIGNED_IN' && session) {
        var user = session.user;
        var metadata = user.user_metadata || {};
        var appMetadata = user.app_metadata || {};
        var identities = user.identities || [];

        console.log('App metadata:', appMetadata);
        console.log('User metadata:', metadata);
        console.log('Identities:', identities);

        // Detectar proveedor
        var provider = appMetadata.provider || '';
        var iss = metadata.iss || '';

        // Verificar por identities también
        identities.forEach(function(id) {
            if (id.provider && !provider) provider = id.provider;
        });

        console.log('Provider detectado:', provider);

        // DISCORD
        if (provider === 'discord' || iss.includes('discord')) {
            console.log('✅ Guardando Discord...');

            var { error: discordError } = await supabase.from('profiles').upsert({
                id: user.id,
                full_name: metadata.full_name || metadata.name || '',
                nickname: metadata.full_name || metadata.name || '',
                discord_id: metadata.provider_id || '',
                discord_username: metadata.full_name || metadata.name || '',
                discord_avatar: metadata.avatar_url || metadata.picture || '',
                discord_linked_at: new Date().toISOString(),
                avatar_url: metadata.avatar_url || metadata.picture || '',
                updated_at: new Date().toISOString()
            });

            if (discordError) {
                console.error('❌ Error Discord:', discordError);
            } else {
                console.log('✅ Discord guardado');
            }
        }

        // SPOTIFY
        if (provider === 'spotify' || iss.includes('spotify')) {
            console.log('✅ Guardando Spotify...');

            var spotifyName = metadata.full_name || metadata.name || '';
            var spotifyAvatar = metadata.avatar_url || metadata.picture || '';
            var spotifyEmail = metadata.email || user.email || '';
            var spotifyUrl = '';
            var spotifyPlan = 'Free';
            var spotifyFollowers = 0;

            if (!spotifyName && spotifyEmail) {
                spotifyName = spotifyEmail.split('@')[0];
            }
            if (!spotifyName) spotifyName = 'Usuario Spotify';

            if (metadata.data) {
                spotifyUrl = metadata.data.external_urls?.spotify || '';
                spotifyPlan = metadata.data.product || 'Free';
                spotifyFollowers = metadata.data.followers?.total || 0;
            }

            var playlistsCount = 0;
            var artistsCount = 0;

            if (session.provider_token) {
                try {
                    var pr = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
                        headers: { 'Authorization': 'Bearer ' + session.provider_token }
                    });
                    if (pr.ok) { var pd = await pr.json(); playlistsCount = pd.total || 0; }
                } catch (e) { console.log('Error playlists:', e); }

                try {
                    var ar = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=1', {
                        headers: { 'Authorization': 'Bearer ' + session.provider_token }
                    });
                    if (ar.ok) { var ad = await ar.json(); artistsCount = ad.artists?.total || 0; }
                } catch (e) { console.log('Error artists:', e); }
            }

            var { error: spotifyError } = await supabase.from('profiles').upsert({
                id: user.id,
                spotify_id: metadata.provider_id || user.id,
                spotify_name: spotifyName,
                spotify_avatar: spotifyAvatar,
                spotify_email: spotifyEmail,
                spotify_url: spotifyUrl,
                spotify_plan: spotifyPlan,
                spotify_followers: spotifyFollowers,
                spotify_playlists: playlistsCount,
                spotify_artists: artistsCount,
                spotify_linked_at: new Date().toISOString(),
                avatar_url: spotifyAvatar || metadata.avatar_url,
                updated_at: new Date().toISOString()
            });

            if (spotifyError) {
                console.error('❌ Error Spotify:', spotifyError);
            } else {
                console.log('✅ Spotify guardado:', spotifyName, '| Playlists:', playlistsCount, '| Artistas:', artistsCount);
            }

            // Avisar a otras partes de la página (p.ej. profile.js) que
            // el guardado terminó, por si necesitan refrescar la UI sin
            // esperar a un recargado completo.
            window.dispatchEvent(new CustomEvent('yx-oauth-synced', {
                detail: { provider: 'spotify', userId: user.id }
            }));
        } else if (provider === 'discord' || iss.includes('discord')) {
            window.dispatchEvent(new CustomEvent('yx-oauth-synced', {
                detail: { provider: 'discord', userId: user.id }
            }));
        }
    }
});
