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
    let localData = [];
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) localData = parsed;
      } catch (e) {}
    }

    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(reconcileVacancies(localData, allSanctionedPosts));
    setIsLoaded(true);

    // 2. Real-time Firebase Firestore multi-user collection sync
    const unsubscribe = subscribeToEmployeesFirestore((cloudEmployees) => {
      console.log("Firestore cloud update received:", cloudEmployees ? cloudEmployees.length : 0, "employees");
      const allPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
      
      // If cloud has records, reconcile with cloud
      if (cloudEmployees && cloudEmployees.length > 0) {
        const reconciled = reconcileVacancies(cloudEmployees, allPosts);
        setEmployees(reconciled);
        localStorage.setItem('uppcl_employees_data', JSON.stringify(reconciled));
        setIsLoaded(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const addEmployee = (emp) => {
    const newId = emp.id && !emp.id.startsWith('VAC-') ? emp.id : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
    const newEmp = { ...emp, id: newId };
    
    // Save directly to Google Cloud Firestore
    saveEmployeeToFirestore(newEmp);

    // Optimistic local update & localStorage persistence
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.id !== newId);
      const updatedList = reconcileVacancies([...activeFiltered, newEmp], allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const updateEmployee = (id, updatedEmp) => {
    const finalId = (id && !id.startsWith('VAC-')) ? id : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
    const empWithId = { ...updatedEmp, id: finalId };
    
    // Save update directly to Google Cloud Firestore
    saveEmployeeToFirestore(empWithId);

    // Optimistic local update & localStorage persistence
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.id !== id && e.id !== finalId);
      const updatedList = reconcileVacancies([...activeFiltered, empWithId], allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const deleteEmployee = (id) => {
    // Delete directly from Google Cloud Firestore
    deleteEmployeeFromFirestore(id);

    // Optimistic local update & localStorage persistence
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.id !== id);
      const updatedList = reconcileVacancies(activeFiltered, allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const addMultipleEmployees = (empList) => {
    const newEmps = empList.map((emp, idx) => ({ 
      id: (emp.id && !emp.id.startsWith('VAC-')) ? emp.id : (Date.now().toString() + '-' + idx + '-' + Math.random().toString(36).substring(2, 5)), 
      ...emp 
    }));

    // Save batch directly to Google Cloud Firestore
    saveMultipleEmployeesToFirestore(newEmps);

    // Optimistic local update & localStorage persistence
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
      const updatedList = reconcileVacancies([...activeFiltered, ...newEmps], allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  return (
    <EmployeeContext.Provider value={{ employees, setEmployees, addEmployee, updateEmployee, deleteEmployee, addMultipleEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};
