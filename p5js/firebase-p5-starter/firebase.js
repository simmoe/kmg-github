// Import Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, setDoc, updateDoc, doc  } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';


// Your web app's Firebase configuration
const firebaseConfig = {
    //INDSÆT DIN KONFIGURATION HER
    //ALTSÅ-
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optionally, initialize analytics if needed
//const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Fetch data from "Klima" collection
export async function fetchCollection(c) {
    try {
        const querySnapshot = await getDocs(collection(db, c));
        let resultJson = {}
        querySnapshot.forEach((doc) => {
            //console.log(`${doc.id} =>`, doc.data());
            resultJson[doc.id] = doc.data()
        });
        console.log("Firestore connection successful!");
        return resultJson
    } catch (error) {
        console.error("Error fetching Collection data:", error);
    }
}

export async function createDocument(collectionName, data, docId = null) {
    try {
        const db = getFirestore();

        if (!docId) {
            // Generer et nyt dokument-ID automatisk
            const docRef = await addDoc(collection(db, collectionName), {});
            docId = docRef.id;
        }

        // Brug setDoc til at oprette eller overskrive dokumentet med det angivne eller genererede ID
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data);
        console.log(`Document successfully written with ID: ${docId}`);
    } catch (e) {
        console.error("Error saving document: ", e);
    }
}


export async function updateDocument(collectionName, updatedData, docId) {
    try {
        const db = getFirestore();
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, updatedData);
        console.log(`Document with ID: ${docId} successfully updated.`);
    } catch (e) {
        console.error("Error updating document: ", e);
    }
}

// Gør funktionen tilgængelig globalt
window.fetchCollection = fetchCollection;
window.createDocument = createDocument;
window.updateDocument = updateDocument;


