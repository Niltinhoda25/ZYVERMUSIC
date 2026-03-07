import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const audio = document.getElementById('main-audio');
const musicGrid = document.getElementById('music-grid');
const topCharts = document.getElementById('top-charts');
const playerBar = document.getElementById('player-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const progressFill = document.getElementById('progress-fill');
const currentTimeLabel = document.getElementById('current-time');
const durationTimeLabel = document.getElementById('duration-time');
const progressContainer = document.getElementById('progress-container');
const volumeSlider = document.getElementById('volume-slider');
const searchInput = document.getElementById('search-input');

let playlist = []; // Fila de reprodução
let currentTrackIndex = -1;

// 1. CARREGAR DADOS DO FIREBASE
onSnapshot(collection(db, "musics"), (snapshot) => {
    // Mapeia os dados mantendo o ID
    playlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fallback caso não haja músicas
    if (playlist.length === 0) {
        musicGrid.innerHTML = '<p class="text-zinc-600 p-6 col-span-full text-center">Nenhuma música encontrada no catálogo.</p>';
        topCharts.innerHTML = '<p class="text-zinc-600 p-6 text-center">O ranking está vazio.</p>';
        return;
    }

    // Renderiza a grade principal (Todas as Músicas)
    renderGrid(playlist);
    
    // Gera e renderiza o Top Charts (Funcionalidade 5)
    // Ordena por 'plays' decrescente e pega as top 5
    const sortedMusics = [...playlist].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
    renderTopCharts(sortedMusics);
});

// 2. RENDERIZAÇÃO DE INTERFACE

// Grade Principal
function renderGrid(musics) {
    musicGrid.innerHTML = '';
    musics.forEach((m) => {
        // Encontra o índice real na playlist original para garantir o auto-play correto
        const realIndex = playlist.findIndex(track => track.id === m.id);
        const card = document.createElement('div');
        card.className = "music-card p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 cursor-pointer group";
        card.onclick = () => startPlayback(realIndex);
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-xl mb-4 shadow-md">
                <img src="${m.cover}" alt="${m.title}" onerror="this.src='https://placehold.co/400x400/18181b/52525b?text=Sem+Capa'">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <i class="fas fa-play text-xl text-white"></i>
                </div>
            </div>
            <h3 class="font-bold truncate text-sm text-zinc-100">${m.title}</h3>
            <div class="flex justify-between items-center text-zinc-500 mt-2 border-t border-zinc-800/50 pt-2">
                <span class="text-[10px] font-mono"><i class="fas fa-headphones-alt mr-1"></i> ${m.plays || 0}</span>
                <button onclick="event.stopPropagation(); shareMusic('${m.title}')" class="hover:text-indigo-400 text-xs transition">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        musicGrid.appendChild(card);
    });
}

// Top Charts (Ranking)
function renderTopCharts(musics) {
    topCharts.innerHTML = '';
    musics.forEach((m, index) => {
        const realIndex = playlist.findIndex(track => track.id === m.id);
        const card = document.createElement('div');
        card.className = "top-chart-card min-w-[240px] md:min-w-[280px] bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-5 cursor-pointer";
        card.onclick = () => startPlayback(realIndex);
        card.innerHTML = `
            <span class="text-4xl font-black text-indigo-500/80 italic">#${index + 1}</span>
            <img src="${m.cover}" alt="${m.title}" class="w-16 h-16 shadow-lg" onerror="this.src='https://placehold.co/400x400/18181b/52525b?text=Sem+Capa'">
            <div class="truncate overflow-hidden">
                <p class="font-bold text-sm text-white truncate">${m.title}</p>
                <p class="text-[10px] text-zinc-500 uppercase tracking-wider">${m.plays || 0} execuções</p>
            </div>
        `;
        topCharts.appendChild(card);
    });
}

// 3. LÓGICA DO PLAYER & FILA (Funcionalidade 1)

// Inicia a reprodução de uma faixa específica
async function startPlayback(index) {
    if (index < 0 || index >= playlist.length) return;
    
    currentTrackIndex = index;
    const track = playlist[index];
    
    // Define a origem e inicia
    audio.src = track.url;
    audio.play().catch(e => console.error("Erro ao dar play:", e));

    // Atualiza a Interface do Player
    document.getElementById('player-title').innerText = track.title;
    document.getElementById('player-img').src = track.cover;
    document.getElementById('player-bar').classList.remove('translate-y-full'); // Mostra o player
    playPauseBtn.innerHTML = '<i class="fas fa-pause text-white"></i>';

    // 4. NOTIFICAÇÕES DO SISTEMA (Media Session API - Funcionalidade 4)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: 'ZyverMusic Premium',
            artwork: [
                { src: track.cover, sizes: '96x96',   type: 'image/png' },
                { src: track.cover, sizes: '512x512', type: 'image/png' },
            ]
        });
        // Configura os controlos nativos (ecrã de bloqueio)
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }

    // Incrementa contador de plays no Firebase (sem await para não bloquear)
    updateDoc(doc(db, "musics", track.id), { plays: increment(1) });
}

// Alternar Play/Pause
function togglePlay() {
    if (audio.src === "") return;
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause text-white"></i>';
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play text-white"></i>';
    }
}

// Próxima Faixa (Auto-play e Manual)
window.nextTrack = () => {
    if (playlist.length === 0) return;
    let nextIndex = (currentTrackIndex + 1) % playlist.length;
    startPlayback(nextIndex);
};

// Faixa Anterior
window.prevTrack = () => {
    if (playlist.length === 0) return;
    let prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    startPlayback(prevIndex);
};

// Eventos do Player
playPauseBtn.onclick = togglePlay;
document.getElementById('next-btn').onclick = nextTrack;
document.getElementById('prev-btn').onclick = prevTrack;

// Quando a música termina -> Auto-play (Funcionalidade 1)
audio.onended = () => nextTrack();

// 5. ATUALIZAÇÃO DE PROGRESSO E VOLUME

// Utilitário para formatar tempo (0:00)
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Atualiza a barra e o tempo
audio.ontimeupdate = () => {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${progress}%`;
    currentTimeLabel.innerText = formatTime(audio.currentTime);
};

// Define duração total quando a música carrega
audio.onloadedmetadata = () => {
    durationTimeLabel.innerText = formatTime(audio.audio.duration);
};

// Clique na barra de progresso (Seek)
progressContainer.onclick = (e) => {
    if (!audio.duration) return;
    const computeUrl = (e.offsetX / progressContainer.offsetWidth) * audio.duration;
    audio.currentTime = computeUrl;
};

// Volume
volumeSlider.oninput = (e) => audio.volume = e.target.value;

// 6. COMPARTILHAR (Web Share API - Funcionalidade 6)
window.shareMusic = (title) => {
    const shareText = `Ouve "${title}" no ZyverMusic Premium! 🚀`;
    const shareUrl = window.location.href; // Pode ser personalizado para link direto se implementado

    if (navigator.share) {
        navigator.share({
            title: 'ZyverMusic',
            text: shareText,
            url: shareUrl
        }).catch(e => console.error("Erro na partilha:", e));
    } else {
        // Fallback: Copiar para área de transferência
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert("Link de partilha copiado para a área de transferência!");
    }
};

// Botão de partilha no Player (compartilha a música atual)
document.getElementById('share-btn-player').onclick = () => {
    if (currentTrackIndex !== -1) {
        shareMusic(playlist[currentTrackIndex].title);
    }
};

// 7. BUSCA EM TEMPO REAL (Funcionalidade 1 Integrada)
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filteredMusics = playlist.filter(m => m.title.toLowerCase().includes(term));
    renderGrid(filteredMusics); // Atualiza apenas a grade principal
};