import { initializeApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:  "AIzaSyAIFv5SYqGch0PuwVs_FLlG7XgASr29Cb4",
  authDomain:  "manpower-fa519.firebaseapp.com",
  projectId:  "manpower-fa519",
  storageBucket: "manpower-fa519.firebasestorage.app",
  messagingSenderId: "893964794004",
  appId: "1:893964794004:web:87ee344d57ebf810fddc81",
}

const app = initializeApp(firebaseConfig)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)

export { auth, db }
