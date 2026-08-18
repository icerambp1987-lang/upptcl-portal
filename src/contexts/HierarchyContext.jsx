import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultHierarchy from '../data/hierarchyData.json';

const HierarchyContext = createContext();

export const useHierarchy = () => useContext(HierarchyContext);

export const HierarchyProvider = ({ children }) => {
  const [hierarchyData, setHierarchyData] = useState(() => {
    let data = defaultHierarchy;
    const saved = localStorage.getItem('uppcl_hierarchy_data');
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse hierarchy from localStorage', e);
      }
    }

    // Auto-inject EE (A) to SE for all circles
    let modified = false;
    
    // Auto-inject Microwave divisions
    if (data.hqUnits) {
      data.hqUnits.forEach(hq => {
        if (hq.name === 'C&C, Lucknow' && hq.circles) {
          hq.circles.forEach(c => {
            if (c.name === 'Electricity Microwave and Telecommunication Circle-I') {
              if (!c.divisions) c.divisions = [];
              const divs = [
                'Electricity Microwave & Telecommunication Division, Sarojini Nagar Lko.',
                'Electricity Microwave & Telecommunication Division, Meerut',
                'Electricity Microwave & Telecommunication Division, Agra'
              ];
              divs.forEach(d => {
                if (!c.divisions.includes(d)) {
                  c.divisions.push(d);
                  modified = true;
                }
              });
            } else if (c.name === 'Electricity Microwave and Telecommunication Circle-II') {
              if (!c.divisions) c.divisions = [];
              const divs = [
                'Electricity Microwave & Telecommunication Division, Varanasi',
                'Electricity Microwave & Telecommunication Division, Gomtinagar Lko.',
                'Electricity Microwave & Telecommunication Division, Gorakhpur'
              ];
              divs.forEach(d => {
                if (!c.divisions.includes(d)) {
                  c.divisions.push(d);
                  modified = true;
                }
              });
            }
          });
        }
      });
    }

    data.zones.forEach(z => {
      z.circles.forEach(c => {
        if (!c.divisions) c.divisions = [];
        const attachedName = `EE (A) to SE, ${c.name}`;
        if (!c.divisions.includes(attachedName)) {
          c.divisions.unshift(attachedName);
          modified = true;
        }
      });
    });

    if (modified && saved) {
      localStorage.setItem('uppcl_hierarchy_data', JSON.stringify(data));
    }

    return data;
  });

  useEffect(() => {
    localStorage.setItem('uppcl_hierarchy_data', JSON.stringify(hierarchyData));
  }, [hierarchyData]);

  const addDivision = (zoneName, circleName, divisionName) => {
    setHierarchyData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      const zone = newData.zones.find(z => z.name === zoneName);
      if (zone) {
        const circle = zone.circles.find(c => c.name === circleName);
        if (circle) {
          if (!circle.divisions) circle.divisions = [];
          if (!circle.divisions.includes(divisionName)) {
            circle.divisions.push(divisionName);
          }
        }
      }
      return newData;
    });
  };

  const removeDivision = (zoneName, circleName, divisionName) => {
    setHierarchyData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const zone = newData.zones.find(z => z.name === zoneName);
      if (zone) {
        const circle = zone.circles.find(c => c.name === circleName);
        if (circle && circle.divisions) {
          circle.divisions = circle.divisions.filter(d => d !== divisionName);
        }
      }
      return newData;
    });
  };

  return (
    <HierarchyContext.Provider value={{ hierarchyData, addDivision, removeDivision, setHierarchyData }}>
      {children}
    </HierarchyContext.Provider>
  );
};
