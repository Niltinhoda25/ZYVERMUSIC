import { db, auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');

// LOGIN
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert("Erro!"); }
};

onAuthStateChanged(auth, (user) => {
    if (user) { loginForm.classList.add('hidden'); adminPanel.classList.remove('hidden'); loadContent(); }
    else { loginForm.classList.remove('hidden'); adminPanel.classList.add('hidden'); }
});

document.getElementById('logout-btn').onclick = () => signOut(auth);

// AUXILIAR: LIMPA LINK DROPBOX
const cleanLink = (url) => url.replace("dl=0", "raw=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");

// POSTAR MÚSICA
document.getElementById('add-btn').onclick = async () => {
    const title = document.getElementById('m-title').value;
    const cover = document.getElementById('m-cover').value;
    const url = document.getElementById('m-url').value;
    if(title && cover && url) {
        await addDoc(collection(db, "musics"), { title, cover, url: cleanLink(url), plays: 0, createdAt: new Date() });
        alert("Música OK!");
    }
};

// POSTAR EM MASSA
document.getElementById('mass-btn').onclick = async () => {
    const lines = document.getElementById('mass-upload').value.split('\n');
    for (let line of lines) {
        const p = line.split('|');
        if (p.length >= 3) await addDoc(collection(db, "musics"), { title: p[0].trim(), cover: p[1].trim(), url: cleanLink(p[2].trim()), plays: 0, createdAt: new Date() });
    }
    alert("Lista processada!");
};

// POSTAR CLIPE
document.getElementById('add-clip-btn').onclick = async () => {
    const title = document.getElementById('c-title').value;
    const url = document.getElementById('c-url').value;
    if(title && url) {
        await addDoc(collection(db, "clips"), { title, url: cleanLink(url), createdAt: new Date() });
        alert("Clipe OK!");
    }
};

// LISTA DE GERENCIAMENTO
function loadContent() {
    onSnapshot(query(collection(db, "musics"), orderBy("createdAt", "desc")), (snap) => {
        const list = document.getElementById('admin-list');
        list.innerHTML = '<p class="text-indigo-400 font-bold">Músicas:</p>';
        snap.forEach(d => {
            list.innerHTML += `<div class="flex justify-between border-b border-zinc-800 py-1"><span>${d.data().title}</span><button onclick="del('musics','${d.id}')" class="text-red-500">X</button></div>`;
        });
    });
}

window.del = async (col, id) => { if(confirm("Apagar?")) await deleteDoc(doc(db, col, id)); };