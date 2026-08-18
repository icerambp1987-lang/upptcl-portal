import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

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

// Save or Update an individual employee directly in Firestore
export const saveEmployeeToFirestore = async (emp) => {
  try {
    if (!emp || !emp.id) return;
    const docRef = doc(db, "employees", String(emp.id));
    await setDoc(docRef, { ...emp, _updatedAt: Date.now() }, { merge: true });
  } catch (error) {
    console.error("Firestore saveEmployee error:", error);
  }
};

// Save multiple employees (e.g. bulk CSV upload)
export const saveMultipleEmployeesToFirestore = async (empList) => {
  try {
    for (const emp of empList) {
      if (emp && emp.id) {
        const docRef = doc(db, "employees", String(emp.id));
        await setDoc(docRef, { ...emp, _updatedAt: Date.now() }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Firestore saveMultiple error:", error);
  }
};

// Delete employee from Firestore
export const deleteEmployeeFromFirestore = async (id) => {
  try {
    if (!id) return;
    const docRef = doc(db, "employees", String(id));
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore delete error:", error);
  }
};

// Real-time listener for the entire employees collection
export const subscribeToEmployeesFirestore = (callback) => {
  try {
    const colRef = collection(db, "employees");
    return onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      callback(list);
    }, (error) => {
      console.warn("Firestore collection subscription notice:", error);
    });
  } catch (e) {
    console.error("Firestore subscription error:", e);
    return () => {};
  }
};
