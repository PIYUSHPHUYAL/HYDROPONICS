import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from "firebase/database";
import "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkr6fF1ZmZ6DtSlKcPA3UrAYSH4Ib9pIc",
  authDomain: "hydroponics-a6609.firebaseapp.com",
  projectId: "hydroponics-a6609",
  storageBucket: "hydroponics-a6609.firebasestorage.app",
  messagingSenderId: "412721417359",
  appId: "1:412721417359:web:ccd3cd6de717645048f4fa",
  measurementId: "G-PK7SK97G2S"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();

export { database, ref, onValue };
