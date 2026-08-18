import React, { createContext, useContext, useState, useEffect } from 'react';
import sanctionedPosts from '../data/sanctionedPosts.json';
import { reconcileVacancies } from '../utils/reconcileVacancies';
import { syncEmployeesToFirestore, subscribeToEmployeesFirestore } from '../firebase';

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
    // FORCE WIPE DATA AS REQUESTED BY USER
    if (!localStorage.getItem('wiped_once_123')) {
        localStorage.removeItem('uppcl_employees_data');
        localStorage.setItem('wiped_once_123', 'true');
        fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]' }).catch(() => {});
    }
    
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];

    // 1. Initial load from localStorage / local API as fallback
    const saved = localStorage.getItem('uppcl_employees_data');
    let localData = null;
    if (saved) {
      try { localData = JSON.parse(saved); } catch (e) {}
    }

    if (localData && localData.length > 0) {
      setEmployees(reconcileVacancies(localData, allSanctionedPosts));
      setIsLoaded(true);
    } else {
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

    // 2. Real-time Firebase Firestore cloud sync listener
    const unsubscribe = subscribeToEmployeesFirestore((cloudEmployees) => {
      if (cloudEmployees && Array.isArray(cloudEmployees)) {
        console.log("Real-time cloud sync received:", cloudEmployees.length, "records");
        const allPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
        setEmployees(reconcileVacancies(cloudEmployees, allPosts));
        setIsLoaded(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Sync to local json API if available
      fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employees)
      }).catch(() => {});
      
      // Sync to localStorage
      localStorage.setItem('uppcl_employees_data', JSON.stringify(employees));

      // Sync active employees to Google Cloud Firestore (skip dummy vacant entries to keep cloud DB super clean & fast)
      const activeOnly = employees.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
      syncEmployeesToFirestore(activeOnly);
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
