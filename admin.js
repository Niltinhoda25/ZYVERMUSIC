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

// Elementos da Interface
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const adminList = document.getElementById('admin-list');

// --- CONTROLE DE ACESSO ---

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Erro no login! Verifique suas credenciais.");
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginForm.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        ouvirMusicas();
    } else {
        loginForm.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
});

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- FUNÇÕES DE ADICIONAR ---

// 1. Adicionar Única
document.getElementById('add-btn').onclick = async () => {
    const title = document.getElementById('m-title').value;
    const cover = document.getElementById('m-cover').value;
    const url = document.getElementById('m-url').value;

    if(title && cover && url) {
        await salvarNoFirebase(title, cover, url);
        alert("Música adicionada!");
        document.getElementById('m-title').value = "";
        document.getElementById('m-cover').value = "";
        document.getElementById('m-url').value = "";
    }
};

// 2. Adicionar em Massa
document.getElementById('mass-btn').onclick = async () => {
    const text = document.getElementById('mass-upload').value;
    const lines = text.split('\n');
    let count = 0;

    for (let line of lines) {
        const partes = line.split('|');
        if (partes.length >= 3) {
            await salvarNoFirebase(partes[0].trim(), partes[1].trim(), partes[2].trim());
            count++;
        }
    }
    alert(`${count} músicas adicionadas com sucesso!`);
    document.getElementById('mass-upload').value = "";
};

// Função Principal para Salvar (Já corrigindo o link do Dropbox)
async function salvarNoFirebase(titulo, capa, link) {
    const linkDireto = link.replace("dl=0", "raw=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
    try {
        await addDoc(collection(db, "musics"), {
            title: titulo,
            cover: capa,
            url: linkDireto,
            plays: 0,
            likes: 0,
            createdAt: new Date()
        });
    } catch (e) {
        console.error("Erro ao salvar música: ", e);
    }
}

// --- GERENCIAMENTO DA LISTA ---

function ouvirMusicas() {
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        adminList.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const card = document.createElement('div');
            card.className = "bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center group";
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${m.cover}" class="w-10 h-10 rounded-lg object-cover">
                    <div class="overflow-hidden">
                        <p class="text-sm font-bold truncate w-32 md:w-64">${m.title}</p>
                        <p class="text-[10px] text-zinc-500">${m.plays || 0} plays</p>
                    </div>
                </div>
                <button onclick="deletar('${docSnap.id}')" class="text-zinc-600 hover:text-red-500 p-2 transition">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            adminList.appendChild(card);
        });
    });
}

window.deletar = async (id) => {
    if(confirm("Deseja mesmo excluir?")) {
        await deleteDoc(doc(db, "musics", id));
    }
};