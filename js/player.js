/* ============================================================
   Bicicletas3000 EPK — Reproductor unificado de Spotify
   Cards livianas (tapa + título vía oEmbed, sin auth)
   + un único Embed Controller (iFrame API).
   Solo puede sonar una fuente a la vez, por diseño.
   ============================================================ */

(function () {
    'use strict';

    // Álbumes / singles de Onírico (mismo orden que antes)
    const ALBUM_IDS = [
        '1tYRBD0qTk4XWApdPFAT3Z',
        '2w64Dmh2YcyQXzvBdxW21t',
        '7L5i8I1PIEUxADY04i9Zv3',
        '3ZmjRnWlwrbVRqxjphHd3b'
    ];

    const cardsEl = document.getElementById('trackCards');
    const playerEl = document.getElementById('spotifyPlayer');
    if (!cardsEl || !playerEl) return;

    let controller = null;
    let activeId = null;
    let isPaused = true;

    /* ---------- Cards ---------- */

    function buildCard(id) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'track-card';
        card.dataset.id = id;
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
            <span class="track-cover">
                <img alt="" loading="lazy">
                <span class="track-state" aria-hidden="true">
                    <span class="eq"><i></i><i></i><i></i></span>
                    <svg class="play-icon" viewBox="0 0 24 24" width="34" height="34">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                </span>
            </span>
            <span class="track-title">Cargando…</span>
        `;
        card.addEventListener('click', () => onCardClick(id));
        cardsEl.appendChild(card);

        // Tapa + título sin autenticación, vía oEmbed
        fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`)
            .then(r => r.json())
            .then(data => {
                card.querySelector('img').src = data.thumbnail_url;
                card.querySelector('.track-title').textContent = data.title;
                card.setAttribute('aria-label', `Reproducir ${data.title}`);
            })
            .catch(() => {
                card.querySelector('.track-title').textContent = 'Escuchar en Spotify';
            });
    }

    ALBUM_IDS.forEach(buildCard);

    /* ---------- Reproductor único ---------- */

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
        IFrameAPI.createController(playerEl, {
            uri: `spotify:album:${ALBUM_IDS[0]}`,
            width: '100%',
            height: 152            // modo compacto
        }, (embedController) => {
            controller = embedController;

            controller.addListener('playback_update', (e) => {
                isPaused = e.data.isPaused;
                refreshCards();
            });
        });
    };

    function onCardClick(id) {
        if (!controller) return;

        if (id === activeId) {
            controller.togglePlay();   // misma card: play/pause
            return;
        }

        activeId = id;
        controller.loadUri(`spotify:album:${id}`);
        controller.play();
        refreshCards();
    }

    function refreshCards() {
        document.querySelectorAll('.track-card').forEach(card => {
            const isActive = card.dataset.id === activeId;
            card.classList.toggle('is-active', isActive);
            card.classList.toggle('is-playing', isActive && !isPaused);
        });
    }
})();
