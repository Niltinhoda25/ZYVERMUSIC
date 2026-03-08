// Importa as funções necessárias dos SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sua configuração do Firebase (Extraída da sua mensagem)
const firebaseConfig = {
  apiKey: "AIzaSyCu1gxS5km9oaCt0ZXdCOaGLbqjiFQrfc0",
  authDomain: "zyvermusic-54d98.firebaseapp.com",
  projectId: "zyvermusic-54d98",
  storageBucket: "zyvermusic-54d98.firebasestorage.app",
  messagingSenderId: "793098105991",
  appId: "1:793098105991:web:ad6785b29315d436da7422"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore e exporta para usar nos outros arquivos
export const db = getFirestore(app);