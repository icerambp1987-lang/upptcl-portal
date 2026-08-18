import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAuNkIda6gwA-bEmJ7gW4xWUPjkcdBjLd8",
  authDomain: "upptcl-portal.firebaseapp.com",
  databaseURL: "https://upptcl-portal-default-rtdb.firebaseio.com",
  projectId: "upptcl-portal",
  storageBucket: "upptcl-portal.firebasestorage.app",
  messagingSenderId: "354880197422",
  appId: "1:354880197422:web:7dbe938378789f5ae660bf",
  measurementId: "G-LZPH2XN1CP"
};

// Initialize Firebase App with Realtime Database (Unlimited free daily operations)
const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

// Save or Update an individual employee directly in Realtime Database
export const saveEmployeeToFirestore = async (emp) => {
  try {
    if (!emp || !emp.id) return;
    const cleanId = String(emp.id).replace(/[.#$\[\]]/g, '_');
    const empRef = ref(rtdb, 'employees/' + cleanId);
    await set(empRef, { ...emp, _updatedAt: Date.now() });
    console.log("Successfully synced employee to Cloud RTDB:", emp.id);
  } catch (error) {
    console.error("Cloud saveEmployee error:", error);
  }
};

// Save multiple employees (e.g. bulk CSV upload)
export const saveMultipleEmployeesToFirestore = async (empList) => {
  try {
    for (const emp of empList) {
      if (emp && emp.id) {
        const cleanId = String(emp.id).replace(/[.#$\[\]]/g, '_');
        const empRef = ref(rtdb, 'employees/' + cleanId);
        await set(empRef, { ...emp, _updatedAt: Date.now() });
      }
    }
  } catch (error) {
    console.error("Cloud saveMultiple error:", error);
  }
};

// Delete employee from Cloud
export const deleteEmployeeFromFirestore = async (id) => {
  try {
    if (!id) return;
    const cleanId = String(id).replace(/[.#$\[\]]/g, '_');
    const empRef = ref(rtdb, 'employees/' + cleanId);
    await remove(empRef);
  } catch (error) {
    console.error("Cloud delete error:", error);
  }
};

// Real-time instant live listener for all connected computers
export const subscribeToEmployeesFirestore = (callback) => {
  try {
    const empsRef = ref(rtdb, 'employees');
    return onValue(empsRef, (snapshot) => {
      const val = snapshot.val();
      const list = val ? Object.values(val) : [];
      console.log("Cloud RTDB update count:", list.length);
      callback(list);
    }, (error) => {
      console.warn("Cloud RTDB subscription notice:", error);
    });
  } catch (e) {
    console.error("Cloud subscription error:", e);
    return () => {};
  }
};
