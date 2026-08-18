import React, { createContext, useContext, useState, useEffect } from 'react';
import sanctionedPosts from '../data/sanctionedPosts.json';
import defaultEmpsList from '../data/defaultEmployees.json';
import { reconcileVacancies } from '../utils/reconcileVacancies';

const EmployeeContext = createContext();

export const useEmployee = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
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
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];

    // 1. Initial load from local storage
    const saved = localStorage.getItem('uppcl_employees_data');
    let localData = [];
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) localData = parsed;
      } catch (e) {}
    }

    // Filter valid active officers that have proper dept/zone
    const validActiveLocal = localData.filter(e => e && e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.dept && e.zone);
    
    // Always use full defaultEmpsList if local storage is missing valid officers or was corrupted
    const baseList = validActiveLocal.length >= defaultEmpsList.length ? validActiveLocal : defaultEmpsList;
    
    const reconciled = reconcileVacancies(baseList, allSanctionedPosts);
    setEmployees(reconciled);
    localStorage.setItem('uppcl_employees_data', JSON.stringify(reconciled));
    setIsLoaded(true);
  }, []);

  const addEmployee = (emp) => {
    const newId = emp.id && !emp.id.startsWith('VAC-') ? emp.id : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
    const newEmp = { ...emp, id: newId };
    
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.id !== newId);
      const updatedActive = [...activeFiltered, newEmp];
      const updatedList = reconcileVacancies(updatedActive, allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const updateEmployee = (id, updatedEmp) => {
    const finalId = (id && !id.startsWith('VAC-')) ? id : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
    const empWithId = { ...updatedEmp, id: finalId };
    
    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT' && e.id !== id && e.id !== finalId);
      const updatedActive = [...activeFiltered, empWithId];
      const updatedList = reconcileVacancies(updatedActive, allSanctionedPosts);
      localStorage.setItem('uppcl_employees_data', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const deleteEmployee = (id) => {
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

    const allSanctionedPosts = [...sanctionedPosts, ...getDynamicEESanctionedPosts()];
    setEmployees(prev => {
      const activeFiltered = prev.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
      const updatedActive = [...activeFiltered, ...newEmps];
      const updatedList = reconcileVacancies(updatedActive, allSanctionedPosts);
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
