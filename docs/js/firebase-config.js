/**
 * Firebase configuration and initialization for ITCO Trade Management
 * Requires Firebase SDK scripts to be loaded first (app, auth, firestore, storage).
 */
const firebaseConfig = {
    apiKey: "AIzaSyDrHxgN2aZhYvk32jaM7a6Ja_RRNFux8F4",
    authDomain: "ishwar-trading-company.firebaseapp.com",
    projectId: "ishwar-trading-company",
    storageBucket: "ishwar-trading-company.appspot.com",
    messagingSenderId: "497264750603",
    appId: "1:497264750603:web:2b6452967cbd712ffad70e",
    measurementId: "G-XNP2291FQK"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const SHARED_DOC_REF = db.collection("sharedData").doc("itcoApp");
let suppressNextLocalSave = false;
