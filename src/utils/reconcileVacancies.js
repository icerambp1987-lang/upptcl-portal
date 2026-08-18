export const reconcileVacancies = (currentEmployees, sanctionedList) => {
  if (!sanctionedList || sanctionedList.length === 0) return currentEmployees;

  // Identify which designations are being managed by the sanctioned list
  const managedDesignations = new Set(sanctionedList.map(p => p.desig));

  // 1. Separate Active and Vacant employees
  const activeEmployees = currentEmployees.filter(e => e.status !== 'Vacant' && (e.name || '').toUpperCase() !== 'VACANT');
  const existingVacant = currentEmployees.filter(e => e.status === 'Vacant' || (e.name || '').toUpperCase() === 'VACANT');
  
  const newEmployeesList = [...activeEmployees];
  
  // 2. Keep Vacant entries for designations we are NOT managing
  const unmanagedVacant = existingVacant.filter(e => !managedDesignations.has(e.desig));
  newEmployeesList.push(...unmanagedVacant);

  // 3. Process each sanctioned post
  sanctionedList.forEach(post => {
    const isSamePost = (e) => (
      (e.office || '') === (post.office || '') &&
      (e.zone || '') === (post.zone || '') &&
      (e.circle || '') === (post.circle || '') &&
      (e.officeName || '') === (post.officeName || '') &&
      (e.dept || '') === (post.dept || '') &&
      (e.desig || '') === (post.desig || '')
    );
    
    // Count how many Active employees occupy this exact sanctioned post
    const activeOccupantsCount = activeEmployees.filter(isSamePost).length;
    
    // Calculate how many Vacant seats are needed to reach the expected 'count'
    let vacantNeeded = post.count - activeOccupantsCount;
    
    if (vacantNeeded > 0) {
      // Find existing Vacant entries for this post
      const postVacantEntries = existingVacant.filter(isSamePost);
      
      // Keep existing Vacant entries or create new ones to satisfy the requirement
      for (let i = 0; i < vacantNeeded; i++) {
        if (i < postVacantEntries.length) {
          newEmployeesList.push(postVacantEntries[i]);
        } else {
          newEmployeesList.push({
            id: 'VAC-' + Date.now().toString() + Math.random().toString(36).substring(2, 7) + '-' + i,
            name: 'VACANT',
            nameHi: 'रिक्त',
            internalId: 'N/A',
            dept: post.dept,
            desig: post.desig,
            status: 'Vacant',
            office: post.office,
            zone: post.zone,
            circle: post.circle,
            division: '',
            subdivision: '',
            officeName: post.officeName,
            chargeType: 'Main',
            substantiveDesig: ''
          });
        }
      }
    }
  });
  
  // Any managed Vacant entries that weren't selected (because they are unsanctioned or excess) 
  // are deliberately left out of newEmployeesList, effectively deleting them.
  
  return newEmployeesList;
};
