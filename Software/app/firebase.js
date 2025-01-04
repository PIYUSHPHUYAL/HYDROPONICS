import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from "firebase/database";
import "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "#####################",
  authDomain: "##############",
  projectId: "#################",
  storageBucket: "############",
  messagingSenderId: "#############",
  appId: "##################",
  measurementId: "############"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();

export { database, ref, onValue };
