import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, child, set, query, limitToLast, orderByKey, push, update } from 'firebase/database';
import "firebase/database";
import { getAuth, signInAnonymously, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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
const database = getDatabase(app);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

signInAnonymously(auth).catch(error => {
  console.error("Authentication error:", error);
});

export { database, ref, onValue, get, child, auth, set, query, limitToLast, orderByKey, push, update };
// export default FirebaseScreen;


//////////////////////////// READINGS NODE UDAUNI CODE//////////////
// & "C:\Program Files\Git\mingw64\bin\curl.exe" -X DELETE 'https://hydroponics-a6609-default-rtdb.firebaseio.com/readings.json?auth=VV8EYMNj7ibBlw79AWwkD3IGkljPbkGLoI7EFSY1'