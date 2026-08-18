import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import sanctionedPosts from '../data/sanctionedPosts.json';
import { reconcileVacancies } from '../utils/reconcileVacancies';
import { syncEmployeesToFirestore, subscribeToEmployeesFirestore } from '../firebase';

const EmployeeContext = createContext();

export const useEmployee = () => useContext(EmployeeContext);

const defaultEmployees = [];

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState(defaultEmployees);
  const [isLoaded, setIsLoaded] = useState(false);
  const isIncomingFromCloud = useRef(false);
  const lastUploadedJson = useRef('');

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
    // 1. Initial load from localStorage
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
      // Try local JSON API
      fetch('/api/employees')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setEmployees(reconcileVacancies(data, allSanctionedPosts));
          } else {
            setEmployees(reconcileVacancies([], allSanctionedPosts));
          }
          setIsLoaded(true);
        })
        .catch(() => {
          setEmployees(reconcileVacancies([], allSanctionedPosts));
          setIsLoaded(true);
        });
    }

    // 2. Real-time Firebase Firestore cloud sync listener (Debounced & Safe)
    const unsubscribe = subscribeToEmployeesFirestore((cloudEmployees) => {
      if (cloudEmployees && Array.isArray(cloudEmployees)) {
        const cloudStr = JSON.stringify(cloudEmployees);
        if (cloudStr !== lastUploadedJson.current) {
          isIncomingFromCloud.current = true;
          lastUploadedJson.current = cloudStr;
          const allPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
          setEmployees(reconcileVacancies(cloudEmployees, allPosts));
          setIsLoaded(true);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Sync to local json API if on dev server
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employees)
      }).catch(() => {});
      
      // Sync to localStorage
      localStorage.setItem('uppcl_employees_data', JSON.stringify(employees));

      // Check if update came from cloud to avoid infinite echo loop
      if (isIncomingFromCloud.current) {
        isIncomingFromCloud.current = false;
        return;
      }

      // Sync active employees to Cloud Firestore only if changed locally
      const activeOnly = employees.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
      const activeStr = JSON.stringify(activeOnly);
      if (activeStr !== lastUploadedJson.current) {
        lastUploadedJson.current = activeStr;
        syncEmployeesToFirestore(activeOnly);
      }
    }
  }, [employees, isLoaded]);

  const addEmployee = (emp) => {
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies([...prev, { id: Date.now().toString(), ...emp }], allSanctionedPosts));
  };

  const updateEmployee = (id, updatedEmp) => {
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies(prev.map(emp => emp.id === id ? { ...emp, ...updatedEmp } : emp), allSanctionedPosts));
  };

  const deleteEmployee = (id) => {
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => reconcileVacancies(prev.filter(emp => emp.id !== id), allSanctionedPosts));
  };

  const addMultipleEmployees = (empList) => {
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const newEmps = empList.map((emp, idx) => ({ id: Date.now().toString() + '-' + idx, ...emp }));
      return reconcileVacancies([...prev, ...newEmps], allSanctionedPosts);
    });
  };

  return (
    <EmployeeContext.Provider value={{ employees, setEmployees, addEmployee, updateEmployee, deleteEmployee, addMultipleEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};
