// Importando os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Suas credenciais oficiais
const firebaseConfig = {
  apiKey: "AIzaSyCu1gxS5km9oaCt0ZXdCOaGLbqjiFQrfc0",
  authDomain: "zyvermusic-54d98.firebaseapp.com",
  projectId: "zyvermusic-54d98",
  storageBucket: "zyvermusic-54d98.firebasestorage.app",
  messagingSenderId: "793098105991",
  appId: "1:793098105991:web:ad6785b29315d436da7422"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Exportando as instâncias para usar nos outros arquivos (app.js e admin.js)
export const db = getFirestore(app);
export const auth = getAuth(app);