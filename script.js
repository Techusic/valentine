const SIZE = 3;
const TILE_COUNT = SIZE * SIZE;
const IMG_URL = 'us.png'; 

let current = Array.from({ length: TILE_COUNT }, (_, i) => i);
const initial = [...current];
const blankPos = TILE_COUNT - 1;

// --- Puzzle Logic ---
function initPuzzle() {
    const container = document.getElementById('puzzle');
    container.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    shuffle();
    // Reveal give-up/help button after a short delay (or immediately on small screens)
    const giveup = document.getElementById('giveupBtn');
    function showGiveUp() { if (!giveup) return; giveup.classList.add('visible'); }
    if (window.innerWidth <= 520) showGiveUp(); else setTimeout(showGiveUp, 6000);
}

function render() {
    const container = document.getElementById('puzzle');
    container.innerHTML = '';
    current.forEach((tileIndex, i) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (tileIndex === blankPos) {
            tile.classList.add('blank');
        } else {
            const col = tileIndex % SIZE;
            const row = Math.floor(tileIndex / SIZE);
            tile.style.backgroundImage = `url(${IMG_URL})`;
            tile.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;
            tile.style.backgroundPosition = `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`;
            tile.onclick = () => moveTile(i);
        }
        container.appendChild(tile);
    });
}

function moveTile(pos) {
    const blankIndex = current.indexOf(blankPos);
    if (isAdjacent(pos, blankIndex)) {
        [current[pos], current[blankIndex]] = [current[blankIndex], current[pos]];
        render();
        if (JSON.stringify(current) === JSON.stringify(initial)) unlockSite();
    }
}

function isAdjacent(p1, p2) {
    const r1 = Math.floor(p1 / SIZE), c1 = p1 % SIZE;
    const r2 = Math.floor(p2 / SIZE), c2 = p2 % SIZE;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function shuffle() {
    // Solvable shuffle: simulate 100 random valid moves
    for(let i=0; i<100; i++) {
        const blank = current.indexOf(blankPos);
        const neighbors = current.map((_, idx) => idx).filter(idx => isAdjacent(idx, blank));
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        [current[blank], current[randomNeighbor]] = [current[randomNeighbor], current[blank]];
    }
    render();
}

function unlockSite() {
    document.getElementById('puzzle-container').classList.add('hidden');
    document.getElementById('welcome-msg').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

// --- Interaction Logic ---
function setupNoButton() {
    const noBtn = document.getElementById('noBtn');
    if (!noBtn) return;
    const container = document.getElementById('targetContainer') || noBtn.parentElement;
    if (!container) return;
    // disable runaway behavior on touch/small screens
    if (('ontouchstart' in window) || window.innerWidth < 600) { noBtn.style.position = 'static'; noBtn.style.marginLeft = '12px'; return; }
    container.style.position = container.style.position || 'relative';
    noBtn.style.position = 'absolute';
    noBtn.style.top = '0px';
    // place initially inside container
    const placeInitial = () => {
        const maxLeft = Math.max(0, container.clientWidth - noBtn.offsetWidth);
        const maxTop = Math.max(0, container.clientHeight - noBtn.offsetHeight);
        noBtn.style.left = Math.min(maxLeft, Math.max(0, (maxLeft * 0.6))) + 'px';
        noBtn.style.top = '0px';
    };
    placeInitial();

    function moveInside() {
        const maxLeft = Math.max(0, container.clientWidth - noBtn.offsetWidth);
        const maxTop = Math.max(0, container.clientHeight - noBtn.offsetHeight);
        const x = Math.random() * maxLeft;
        const y = Math.random() * maxTop;
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    }

    noBtn.addEventListener('mouseover', () => moveInside());
    window.addEventListener('resize', () => { if (window.innerWidth < 600) { noBtn.style.position = 'static'; noBtn.style.marginLeft = '12px'; } else placeInitial(); });
}

document.getElementById('yesBtn').onclick = () => {
    document.getElementById('questionText').innerText = "I KNEW IT! I LOVE YOU! ❤️";
    const noBtn = document.getElementById('noBtn'); if (noBtn) noBtn.style.display = 'none';
    const duration = 15 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
};

document.getElementById('giveupBtn').onclick = () => {
    current = [...initial];
    render();
    setTimeout(unlockSite, 500);
};

document.addEventListener('DOMContentLoaded', initPuzzle);

// Register service worker in production (if supported)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            console.log('SW registered', reg.scope);
        }).catch((err) => {
            console.warn('SW registration failed', err);
        });
    });
}

// --- Notifications & Gallery ---
async function sendNotification(type, message) {
    const title = type === 'hug' ? 'You got a virtual hug 🤗' : type === 'valentine' ? 'Valentine Answered' : 'Notification';
    const body = message || (type === 'hug' ? 'Someone sent you a virtual hug!' : 'They said YES to your Valentine question!');

    const gasUrl = 'https://script.google.com/macros/s/AKfycbwPrkbU806enTHhCuoAjXX9BB_UWHGFiIsIv1PKuSYSdXZKwyfCvnP_jxrQEEnXSqa1/exec';

    try {
        // Send to Google Apps Script
        const response = await fetch(gasUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                title: title,
                body: body,
                timestamp: new Date().toISOString()
            })
        });
        return { ok: true };
    } catch (err) {
        console.warn('Google Apps Script notification failed:', err);
    }

    // Fallback: Browser notification API
    if ('Notification' in window) {
        try {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/favicon.png' });
                return { ok: true };
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '/favicon.png' });
                    return { ok: true };
                }
            }
        } catch (e) {
            console.warn('Browser notification failed:', e);
        }
    }

    return { ok: true };
}

// Wire up 'Send Virtual Hug' button and YES action to send notifications
document.addEventListener('DOMContentLoaded', () => {
    const hugBtn = document.getElementById('hugBtn');
    if (hugBtn) {
        const hugStatus = document.getElementById('hugStatus');
        hugBtn.addEventListener('click', async () => {
            hugBtn.disabled = true;
            hugBtn.textContent = 'Sending...';
            if (hugStatus) { hugStatus.className = 'send-status sending'; hugStatus.textContent = 'Sending…'; }
            try {
                const res = await sendNotification('hug');
                const time = new Date().toLocaleTimeString();
                if (hugStatus) { hugStatus.className = 'send-status success'; hugStatus.textContent = 'Sent at ' + time; }
                hugBtn.textContent = 'Sent! 🤗';
                // show emoji burst for celebration
                try { showHugEmojis(hugBtn); } catch (e) { /* ignore */ }
            } catch (err) {
                const msg = (err && err.message) ? err.message : 'Cannot send';
                if (hugStatus) { hugStatus.className = 'send-status error'; hugStatus.textContent = 'Error: ' + msg; }
                hugBtn.textContent = 'Send Virtual Hug 🤗';
            } finally {
                setTimeout(() => { hugBtn.disabled = false; hugBtn.textContent = 'Send Virtual Hug 🤗'; }, 1500);
            }
        });
    }

    const yes = document.getElementById('yesBtn');
    if (yes) {
        const yesStatus = document.getElementById('yesStatus');
        yes.addEventListener('click', async () => {
            if (yesStatus) { yesStatus.className = 'send-status sending'; yesStatus.textContent = 'Sending…'; }
            try {
                await sendNotification('valentine');
                const time = new Date().toLocaleTimeString();
                if (yesStatus) { yesStatus.className = 'send-status success'; yesStatus.textContent = 'Sent at ' + time; }
            } catch (err) {
                const msg = (err && err.message) ? err.message : 'Cannot send';
                if (yesStatus) { yesStatus.className = 'send-status error'; yesStatus.textContent = 'Error: ' + msg; }
            }
        });
    }

    // Setup No button bounded movement
    setupNoButton();

    // initialize gallery modal & slideshow behavior
    initGallery();
});

// Emoji burst helper: creates ephemeral emojis near the element
function showHugEmojis(anchorEl) {
    const emojis = ['🌸','💐','🌺','❤️','🌷','🌹'];
    const rect = anchorEl.getBoundingClientRect();
    const container = document.createElement('div');
    container.className = 'emoji-burst';
    container.style.left = (rect.left + window.scrollX) + 'px';
    container.style.top = (rect.top + window.scrollY - 10) + 'px';
    document.body.appendChild(container);

    for (let i = 0; i < 8; i++) {
        const span = document.createElement('div');
        span.className = 'emoji';
        span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        // randomize start position within button width
        span.style.left = (Math.random() * rect.width - rect.width*0.25) + 'px';
        span.style.top = (Math.random() * 8) + 'px';
        span.style.animationDelay = (Math.random() * 300) + 'ms';
        span.style.fontSize = (16 + Math.random() * 18) + 'px';
        container.appendChild(span);
    }

    setTimeout(() => { container.remove(); }, 1400);
}

// Canvas emoji confetti
function showHugCanvasConfetti() {
    const emojis = ['🌸','💐','🌺','❤️','🌷','🌹','✨'];
    const canvas = document.createElement('canvas');
    canvas.className = 'emoji-canvas';
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    document.body.appendChild(canvas);

    const particles = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 6,
            vy: - (6 + Math.random() * 8),
            rot: Math.random() * Math.PI * 2,
            vro: (Math.random() - 0.5) * 0.2,
            txt: emojis[Math.floor(Math.random() * emojis.length)],
            size: 18 + Math.random() * 28,
            life: 0,
            ttl: 1200 + Math.random() * 600
        });
    }

    let start = performance.now();
    function frame(t) {
        const dt = t - start;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let p of particles) {
            p.life += 16.67;
            const tfrac = p.life / p.ttl;
            p.vy += 0.35; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vro;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.max(0, 1 - tfrac);
            ctx.font = `${p.size}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText(p.txt, 0, 0);
            ctx.restore();
        }
        // remove finished
        const alive = particles.filter(p => p.life < p.ttl);
        if (alive.length === 0) {
            canvas.remove();
            return;
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// Small hug sound using WebAudio
function playHugSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        gain.connect(ctx.destination);

        const freqs = [520, 660, 820];
        const oscs = freqs.map(f => {
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = f;
            o.connect(gain);
            o.start(now);
            o.stop(now + 1.1);
            return o;
        });
    } catch (e) {
        console.warn('Audio failed', e);
    }
}

// --- Media slideshow & modal logic ---
let currentMediaIndex = 0;
let mediaList = [];

function initGallery() {
    const modal = document.getElementById('mediaModal');
    const modalImg = document.getElementById('modalImg');
    const modalVid = document.getElementById('modalVid');
    const closeModal = document.querySelector('.close-modal');
    const prevBtn = document.getElementById('prevMedia');
    const nextBtn = document.getElementById('nextMedia');

    const updateMediaList = () => {
        mediaList = Array.from(document.querySelectorAll('.media-slot')).map(slot => slot.querySelector('.media-preview'));
    };
    updateMediaList();

    const showMedia = (index) => {
        if (!mediaList.length) return;
        if (index < 0) index = mediaList.length - 1;
        if (index >= mediaList.length) index = 0;
        currentMediaIndex = index;
        const preview = mediaList[index];
        modalVid.pause();
        if (!preview) return;
        if (preview.tagName === 'IMG') {
            modalImg.src = preview.src;
            modalImg.classList.remove('hidden');
            modalVid.classList.add('hidden');
        } else {
            modalVid.src = preview.currentSrc || preview.src;
            modalVid.classList.remove('hidden');
            modalImg.classList.add('hidden');
            modalVid.play();
        }
    };

    // Main click to open enlarged view
    document.querySelectorAll('.media-slot').forEach((slot, idx) => {
        slot.addEventListener('click', (e) => {
            if (e.target.closest('.edit-media-btn')) return;
            currentMediaIndex = idx;
            modal.classList.remove('hidden');
            showMedia(currentMediaIndex);
        });

        // Handle Change File
        const input = slot.querySelector('.media-input');
        const editBtn = slot.querySelector('.edit-media-btn');
        if (editBtn && input) {
            editBtn.onclick = (e) => { e.stopPropagation(); input.click(); };
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                const preview = slot.querySelector('.media-preview');
                if (file.type.startsWith('image/')) {
                    if (!preview || preview.tagName !== 'IMG') {
                        const newImg = document.createElement('img');
                        newImg.className = 'media-preview';
                        newImg.src = url;
                        if (preview) preview.replaceWith(newImg); else slot.appendChild(newImg);
                    } else {
                        preview.src = url;
                    }
                } else {
                    if (!preview || preview.tagName !== 'VIDEO') {
                        const newVid = document.createElement('video');
                        newVid.className = 'media-preview';
                        newVid.src = url;
                        newVid.controls = false;
                        if (preview) preview.replaceWith(newVid); else slot.appendChild(newVid);
                    } else {
                        preview.src = url;
                    }
                }
                updateMediaList();
            });
        }
    });

    // Navigation Controls
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showMedia(currentMediaIndex - 1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showMedia(currentMediaIndex + 1); };

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!modal || modal.classList.contains('hidden')) return;
        if (e.key === 'ArrowLeft') showMedia(currentMediaIndex - 1);
        if (e.key === 'ArrowRight') showMedia(currentMediaIndex + 1);
        if (e.key === 'Escape') closeModal && closeModal.click();
    });

    // Close functionality
    if (closeModal) closeModal.onclick = () => { modal.classList.add('hidden'); modalVid.pause(); };
    if (modal) modal.onclick = (e) => { if (e.target === modal) { closeModal && closeModal.click(); } };

    // Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;
    modal && modal.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, false);
    modal && modal.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) showMedia(currentMediaIndex + 1);
        if (touchEndX > touchStartX + 50) showMedia(currentMediaIndex - 1);
    }, false);
}
