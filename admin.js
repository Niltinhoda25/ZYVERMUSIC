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

// Seleção de elementos da página
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const adminList = document.getElementById('admin-list');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const addBtn = document.getElementById('add-btn');

// --- 1. SISTEMA DE AUTENTICAÇÃO ---

// Função de Login
loginBtn.onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Bem-vindo, Administrador!");
    } catch (error) {
        console.error(error);
        alert("Erro ao entrar: Verifique seu e-mail e senha.");
    }
};

// Monitor de estado do usuário (Logado ou não)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado: mostra painel, esconde login
        loginForm.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        carregarMusicasAdmin();
    } else {
        // Usuário deslogado: mostra login, esconde painel
        loginForm.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
});

// Função de Sair
logoutBtn.onclick = () => {
    signOut(auth);
};

// --- 2. GERENCIAMENTO DE MÚSICAS ---

// Função para Adicionar Música
addBtn.onclick = async () => {
    const title = document.getElementById('m-title').value;
    const cover = document.getElementById('m-cover').value;
    let url = document.getElementById('m-url').value;

    if (!title || !cover || !url) {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    try {
        // CORREÇÃO AUTOMÁTICA DO LINK DROPBOX
        // Troca dl=0 por raw=1 para o áudio funcionar direto no site
        const urlCorrigida = url.replace("dl=0", "raw=1");

        await addDoc(collection(db, "musics"), {
            title: title,
            cover: cover,
            url: urlCorrigida,
            plays: 0,
            likes: 0,
            createdAt: new Date()
        });

        alert("Música publicada com sucesso!");

        // Limpar campos após sucesso
        document.getElementById('m-title').value = "";
        document.getElementById('m-cover').value = "";
        document.getElementById('m-url').value = "";

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao publicar música.");
    }
};

// Função para listar as músicas no painel admin com botão de excluir
function carregarMusicasAdmin() {
    // Busca as músicas ordenadas pelas mais novas primeiro
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        adminList.innerHTML = ''; // Limpa a lista antes de reconstruir

        snapshot.forEach((docSnap) => {
            const music = docSnap.data();
            const id = docSnap.id;

            const item = document.createElement('div');
            item.className = "bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:bg-zinc-800/50 transition";
            item.innerHTML = `
                <div class="flex items-center gap-4 overflow-hidden">
                    <img src="${music.cover}" class="w-12 h-12 rounded object-cover">
                    <div class="truncate">
                        <p class="font-bold truncate">${music.title}</p>
                        <p class="text-xs text-zinc-500">${music.plays || 0} plays • ${music.likes || 0} curtidas</p>
                    </div>
                </div>
                <button onclick="deletarMusica('${id}')" class="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-lg transition">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            adminList.appendChild(item);
        });
    });
}

// Função para Deletar Música (Exposta para o HTML)
window.deletarMusica = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta música do ZyverMusic?")) {
        try {
            await deleteDoc(doc(db, "musics", id));
            alert("Música removida!");
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("Erro ao excluir música.");
        }
    }
};