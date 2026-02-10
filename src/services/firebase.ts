import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7P041hWSO-I4tmbPZHD--y_LH4mYLFVQ",
  authDomain: "arbol-genealogico-asoiaf.firebaseapp.com",
  projectId: "arbol-genealogico-asoiaf",
  storageBucket: "arbol-genealogico-asoiaf.firebasestorage.app",
  messagingSenderId: "582222396267",
  appId: "1:582222396267:web:21da337c8e056576a5ea2e"
};

let app: any, auth: any, db: any;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase no se pudo inicializar. La app funcionará en modo local.", e);
}

export { app, auth, db };
