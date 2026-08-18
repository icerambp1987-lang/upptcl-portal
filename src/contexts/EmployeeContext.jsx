import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import sanctionedPosts from '../data/sanctionedPosts.json';
import { reconcileVacancies } from '../utils/reconcileVacancies';
import { 
  saveEmployeeToFirestore, 
  saveMultipleEmployeesToFirestore, 
  deleteEmployeeFromFirestore, 
  subscribeToEmployeesFirestore 
} from '../firebase';

const EmployeeContext = createContext();

export const useEmployee = () => useContext(EmployeeContext);

const defaultEmployees = [];

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState(defaultEmployees);
  const [isLoaded, setIsLoaded] = useState(false);
  const isCloudSynced = useRef(false);

  // Helper to dynamically generate EE sanctioned posts from Hierarchy Master Data
  const getDynamicEESanctionedPosts = () => {
    let hData = null;
    try {
      const hSaved = localStorage.getItem('uppcl_hierarchy_data');
      if (hSaved) hData = JSON.parse(hSaved);
    } catch (e) {}
    
    const dynamicPosts = [];
    if (hData) {
      const processUnits = (units) => {
        if (!units) return;
        units.forEach(z => {
          if (z.circles) {
            z.circles.forEach(c => {
              if (c.divisions) {
                c.divisions.forEach(d => {
                  const divName = typeof d === 'string' ? d : d.name;
                  dynamicPosts.push({
                    key: `DIVISION|${z.name}|${c.name}|${divName}`,
                    office: 'DIVISION',
                    zone: z.name,
                    circle: c.name,
                    division: divName,
                    officeName: divName,
                    dept: 'UPPTCL',
                    desig: 'Executive Engineer (E&M)',
                    count: 1
                  });
                });
              }
            });
          }
        });
      };
      processUnits(hData.zones);
      processUnits(hData.hqUnits);
    }
    return dynamicPosts;
  };

  useEffect(() => {
    // 1. Initial load from localStorage (instant display)
    const saved = localStorage.getItem('uppcl_employees_data');
    let localData = null;
    if (saved) {
      try { localData = JSON.parse(saved); } catch (e) {}
    }

    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];

    if (localData && localData.length > 0) {
      setEmployees(reconcileVacancies(localData, allSanctionedPosts));
      setIsLoaded(true);
    } else {
      setEmployees(reconcileVacancies([], allSanctionedPosts));
      setIsLoaded(true);
    }

    // 2. Real-time Firebase Firestore multi-user collection sync
    const unsubscribe = subscribeToEmployeesFirestore((cloudEmployees) => {
      console.log("Firestore cloud update received:", cloudEmployees.length, "employees");
      const allPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
      
      // If cloud has records, reconcile with cloud
      if (cloudEmployees && cloudEmployees.length > 0) {
        isCloudSynced.current = true;
        const reconciled = reconcileVacancies(cloudEmployees, allPosts);
        setEmployees(reconciled);
        localStorage.setItem('uppcl_employees_data', JSON.stringify(reconciled));
        setIsLoaded(true);
      } else if (!isCloudSynced.current && localData && localData.length > 0) {
        // If cloud is empty but local has data, push local active data to cloud
        const activeOnly = localData.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
        if (activeOnly.length > 0) {
          saveMultipleEmployeesToFirestore(activeOnly);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('uppcl_employees_data', JSON.stringify(employees));
    }
  }, [employees, isLoaded]);

  const addEmployee = (emp) => {
    const newId = emp.id || (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
    const newEmp = { ...emp, id: newId };
    
    // Save directly to Google Cloud Firestore
    saveEmployeeToFirestore(newEmp);

    // Optimistic local update
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies([...prev, newEmp], allSanctionedPosts));
  };

  const updateEmployee = (id, updatedEmp) => {
    const empWithId = { ...updatedEmp, id };
    
    // Save update directly to Google Cloud Firestore
    saveEmployeeToFirestore(empWithId);

    // Optimistic local update
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies(prev.map(emp => emp.id === id ? { ...emp, ...updatedEmp } : emp), allSanctionedPosts));
  };

  const deleteEmployee = (id) => {
    // Delete directly from Google Cloud Firestore
    deleteEmployeeFromFirestore(id);

    // Optimistic local update
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies(prev.filter(emp => emp.id !== id), allSanctionedPosts));
  };

  const addMultipleEmployees = (empList) => {
    const newEmps = empList.map((emp, idx) => ({ 
      id: emp.id || (Date.now().toString() + '-' + idx + '-' + Math.random().toString(36).substring(2, 5)), 
      ...emp 
    }));

    // Save batch directly to Google Cloud Firestore
    saveMultipleEmployeesToFirestore(newEmps);

    // Optimistic local update
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies([...prev, ...newEmps], allSanctionedPosts));
  };

  return (
    <EmployeeContext.Provider value={{ employees, setEmployees, addEmployee, updateEmployee, deleteEmployee, addMultipleEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};
