import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const musicGrid = document.getElementById('music-grid');
const audio = document.getElementById('main-audio');
const playerBar = document.getElementById('player-bar');
const playPauseBtn = document.getElementById('play-pause-btn');
const progressFill = document.getElementById('progress-fill');
const searchInput = document.getElementById('search-input');

let allMusics = [];

// CARREGAR MÚSICAS EM TEMPO REAL
onSnapshot(query(collection(db, "musics"), orderBy("createdAt", "desc")), (snapshot) => {
    allMusics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMusics(allMusics);
});

function renderMusics(musics) {
    musicGrid.innerHTML = '';
    musics.forEach(m => {
        const card = document.createElement('div');
        card.className = "music-card bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 hover:border-indigo-500/50 group transition-all cursor-pointer relative";
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-xl mb-4 shadow-lg">
                <img src="${m.cover}" class="w-full aspect-square object-cover transform group-hover:scale-110 transition duration-500">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button onclick="event.stopPropagation(); playTrack('${m.id}', '${m.url}', '${m.title}', '${m.cover}', '${m.category}')" class="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition">
                        <i class="fas fa-play text-lg"></i>
                    </button>
                    <button onclick="event.stopPropagation(); shareMusic('${m.title}')" class="bg-zinc-800/80 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
            <h3 class="font-bold truncate text-base">${m.title}</h3>
            <p class="text-[10px] text-indigo-400 font-bold uppercase mb-3">${m.category || 'Geral'}</p>
            <div class="flex justify-between items-center text-zinc-500 border-t border-zinc-800 pt-3">
                <span class="text-[10px]"><i class="fas fa-headphones-alt mr-1"></i> ${m.plays || 0}</span>
                <div class="flex gap-3">
                    <a href="${m.url}" download onclick="event.stopPropagation()" class="hover:text-white transition text-xs"><i class="fas fa-download"></i></a>
                    <button onclick="event.stopPropagation(); likeMusic('${m.id}')" class="hover:text-red-500 transition-colors flex items-center gap-1">
                        <i class="fas fa-heart text-xs"></i> <small class="text-[10px]">${m.likes || 0}</small>
                    </button>
                </div>
            </div>
        `;
        musicGrid.appendChild(card);
    });
}

// BUSCA EM TEMPO REAL (Funcionalidade 1)
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allMusics.filter(m => m.title.toLowerCase().includes(term));
    renderMusics(filtered);
};

// FILTRO POR CATEGORIA (Funcionalidade 2)
window.filterCategory = (cat) => {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('bg-indigo-600'));
    event.target.classList.add('bg-indigo-600');
    
    if(cat === 'all') return renderMusics(allMusics);
    const filtered = allMusics.filter(m => m.category === cat);
    renderMusics(filtered);
};

// SHARE (Funcionalidade 6)
window.shareMusic = (title) => {
    const url = window.location.href;
    navigator.clipboard.writeText(`Escuta esta track no ZyverMusic: ${title} - ${url}`);
    alert("Link de partilha copiado para a área de transferência!");
};

// PLAYER
window.playTrack = async (id, url, title, cover, category) => {
    audio.src = url;
    audio.play();
    document.getElementById('player-title').innerText = title;
    document.getElementById('player-img').src = cover;
    document.getElementById('player-category').innerText = category || 'Geral';
    document.getElementById('download-link').href = url; // Funcionalidade 5
    playerBar.classList.remove('translate-y-full');
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    await updateDoc(doc(db, "musics", id), { plays: increment(1) });
};

// ... (Resto da lógica de volume e play/pause igual à anterior)