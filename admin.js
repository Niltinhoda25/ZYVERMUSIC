import { db, auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Elementos
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const adminList = document.getElementById('admin-list');
const musicCountLabel = document.getElementById('music-count');

// --- 1. LOGIN & SEGURANÇA ---
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Acesso negado: Credenciais inválidas.");
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginForm.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        carregarDados();
    } else {
        loginForm.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
});

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- 2. FUNÇÕES DE CADASTRAR ---

// Individual
document.getElementById('add-btn').onclick = async () => {
    const title = document.getElementById('m-title').value;
    const cover = document.getElementById('m-cover').value;
    const url = document.getElementById('m-url').value;
    const category = document.getElementById('m-category').value;

    if(title && cover && url) {
        await salvarMusica(title, cover, url, category);
        alert("Publicado!");
        // Limpar
        document.getElementById('m-title').value = "";
        document.getElementById('m-cover').value = "";
        document.getElementById('m-url').value = "";
    }
};

// Massa
document.getElementById('mass-btn').onclick = async () => {
    const text = document.getElementById('mass-upload').value;
    const lines = text.split('\n');
    let total = 0;

    for (let line of lines) {
        const p = line.split('|');
        if (p.length >= 3) {
            const categoria = p[3] ? p[3].trim() : "Trap";
            await salvarMusica(p[0].trim(), p[1].trim(), p[2].trim(), categoria);
            total++;
        }
    }
    alert(`${total} músicas adicionadas!`);
    document.getElementById('mass-upload').value = "";
};

// Função Interna de Salvar
async function salvarMusica(titulo, capa, link, categoria) {
    // Corrige Dropbox automaticamente
    const linkLimpo = link.replace("dl=0", "raw=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
    try {
        await addDoc(collection(db, "musics"), {
            title: titulo,
            cover: capa,
            url: linkLimpo,
            category: categoria,
            plays: 0,
            likes: 0,
            createdAt: new Date()
        });
    } catch (e) {
        console.error("Erro ao salvar: ", e);
    }
}

// --- 3. GESTÃO DA LISTA ---

function carregarDados() {
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        adminList.innerHTML = '';
        musicCountLabel.innerText = `${snapshot.size} Músicas`;

        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const id = docSnap.id;

            const div = document.createElement('div');
            div.className = "bg-black/40 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition";
            div.innerHTML = `
                <div class="flex items-center gap-4 truncate">
                    <img src="${m.cover}" class="w-12 h-12 rounded-xl object-cover shadow-lg">
                    <div class="truncate">
                        <p class="font-bold text-sm truncate">${m.title}</p>
                        <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">${m.category}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right hidden md:block">
                        <p class="text-xs font-mono text-zinc-400">${m.plays || 0} PLAYS</p>
                        <p class="text-xs font-mono text-red-500/70">${m.likes || 0} LIKES</p>
                    </div>
                    <button onclick="excluirMusica('${id}')" class="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            adminList.appendChild(div);
        });
    });
}

window.excluirMusica = async (id) => {
    if(confirm("Deseja deletar permanentemente?")) {
        await deleteDoc(doc(db, "musics", id));
    }
};