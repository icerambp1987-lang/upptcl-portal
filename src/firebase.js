import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuNKiDa6gwA-bEmJ7gW4xwUPjkcdBjLd8",
  authDomain: "upptcl-portal.firebaseapp.com",
  projectId: "upptcl-portal",
  storageBucket: "upptcl-portal.firebasestorage.app",
  messagingSenderId: "354880197422",
  appId: "1:354880197422:web:7dbe938378709f5ae660bf",
  measurementId: "G-LZPH2XN1CP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to sync employees with Firestore
export const syncEmployeesToFirestore = async (employees) => {
  try {
    const docRef = doc(db, "portal_data", "employees_master");
    await setDoc(docRef, { data: employees, lastUpdated: Date.now() }, { merge: true });
  } catch (error) {
    console.error("Firestore sync error:", error);
  }
};

// Helper to listen for real-time updates
export const subscribeToEmployeesFirestore = (callback) => {
  try {
    const docRef = doc(db, "portal_data", "employees_master");
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData && Array.isArray(cloudData.data)) {
          callback(cloudData.data);
        }
      }
    }, (error) => {
      console.warn("Firestore subscription notice:", error);
    });
  } catch (e) {
    console.error("Firestore subscription error:", e);
    return () => {};
  }
};
