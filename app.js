import { db } from './firebase-config.js';
import { collection, getDocs, updateDoc, doc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const musicGrid = document.getElementById('music-grid');
const audio = document.getElementById('main-audio');
const playerBar = document.getElementById('player-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const progressFill = document.getElementById('progress-fill');

// Escutar mudanças em tempo real no Firestore
onSnapshot(collection(db, "musics"), (snapshot) => {
    musicGrid.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const music = { id: docSnap.id, ...docSnap.data() };
        renderCard(music);
    });
});

function renderCard(music) {
    const card = document.createElement('div');
    card.className = "music-card bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 hover:border-indigo-500/50 group cursor-pointer";
    card.innerHTML = `
        <div class="relative overflow-hidden rounded-xl mb-4 shadow-lg">
            <img src="${music.cover}" class="w-full aspect-square object-cover transform group-hover:scale-110 transition duration-500">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button onclick="playTrack('${music.id}', '${music.url}', '${music.title}', '${music.cover}')" class="bg-indigo-600 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl">
                    <i class="fas fa-play text-xl"></i>
                </button>
            </div>
        </div>
        <h3 class="font-bold truncate text-lg mb-1">${music.title}</h3>
        <div class="flex justify-between items-center text-zinc-500">
            <span class="text-xs font-medium"><i class="fas fa-headphones-alt mr-1"></i> ${music.plays || 0}</span>
            <button onclick="event.stopPropagation(); likeMusic('${music.id}')" class="hover:text-red-500 transition-colors flex items-center gap-1">
                <i class="fas fa-heart"></i> <small class="text-xs">${music.likes || 0}</small>
            </button>
        </div>
    `;
    musicGrid.appendChild(card);
}

window.playTrack = async (id, url, title, cover) => {
    // Ajuste para Dropbox tocar direto
    const directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "");
    
    audio.src = directUrl;
    audio.play();
    
    document.getElementById('player-title').innerText = title;
    document.getElementById('player-img').src = cover;
    playerBar.classList.remove('translate-y-full');
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

    // Incrementar Play
    const musicRef = doc(db, "musics", id);
    await updateDoc(musicRef, { plays: increment(1) });
};

window.likeMusic = async (id) => {
    const musicRef = doc(db, "musics", id);
    await updateDoc(musicRef, { likes: increment(1) });
};

// Controles do Player
playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
};

audio.ontimeupdate = () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + "%";
    document.getElementById('current-time').innerText = formatTime(audio.currentTime);
    if(audio.duration) document.getElementById('duration-time').innerText = formatTime(audio.duration);
};

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

document.getElementById('volume-slider').oninput = (e) => audio.volume = e.target.value;