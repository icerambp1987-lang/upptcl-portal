export const reconcileVacancies = (currentEmployees, sanctionedList) => {
  if (!sanctionedList || sanctionedList.length === 0) return currentEmployees;

  // Normalize string helper
  const norm = (s) => (s || '').toString().replace(/\s+/g, ' ').trim().toUpperCase();

  // Helper to check if designation matches broadly
  const isDesigMatch = (empDesig, postDesig) => {
    const e = norm(empDesig);
    const p = norm(postDesig);
    if (e === p) return true;
    
    // Superintending Engineer matching
    if (p.includes('SUPERINTENDING') && e.includes('SUPERINTENDING')) return true;
    if (p.includes('SE') && e.includes('SE')) return true;
    
    // Executive Engineer matching
    if (p.includes('EXECUTIVE') && e.includes('EXECUTIVE')) return true;
    if (p.includes('EE') && e.includes('EE')) return true;

    // Chief Engineer matching
    if (p.includes('CHIEF') && e.includes('CHIEF')) return true;
    if (p.includes('CE') && e.includes('CE')) return true;

    return false;
  };

  // Helper to compare HQ / Zone names flexibly
  const isZoneMatch = (empZone, postZone, empOfficeName, empCircle) => {
    const ez = norm(empZone);
    const pz = norm(postZone);
    if (!pz) return true;
    if (ez === pz) return true;

    // HQ flexible aliases
    const isEmpHQ = ez.includes('HQ') || ez.includes('HEADQUARTER') || norm(empOfficeName).includes('HQ');
    const isPostHQ = pz.includes('HQ') || pz.includes('HEADQUARTER') || pz.includes('LUCKNOW') || pz.includes('DIRECTOR') || pz.includes('DESIGN') || pz.includes('C&C') || pz.includes('D&P');
    if (isEmpHQ && isPostHQ) return true;

    return false;
  };

  // 1. Separate Active and Vacant employees
  const activeEmployees = currentEmployees.filter(e => e.status !== 'Vacant' && norm(e.name) !== 'VACANT');
  const existingVacant = currentEmployees.filter(e => e.status === 'Vacant' || norm(e.name) === 'VACANT');
  
  const newEmployeesList = [...activeEmployees];

  // 2. Process each sanctioned post
  sanctionedList.forEach(post => {
    const isSamePost = (e) => {
      // Must match designation type
      if (!isDesigMatch(e.desig, post.desig)) return false;

      // Match dept
      if (norm(e.dept) !== norm(post.dept)) return false;

      // Match zone flexibly
      if (!isZoneMatch(e.zone, post.zone, e.officeName, e.circle)) return false;

      // If post has specific circle, match circle
      if (post.circle && norm(e.circle) !== norm(post.circle) && norm(e.officeName) !== norm(post.circle)) return false;

      // If post has specific division, match division
      if (post.division && norm(e.division) !== norm(post.division) && norm(e.officeName) !== norm(post.division)) return false;

      return true;
    };
    
    // Count how many Active employees occupy this sanctioned post
    const activeOccupantsCount = activeEmployees.filter(isSamePost).length;
    
    // Calculate how many Vacant seats are needed to reach the expected 'count'
    let vacantNeeded = (post.count || 1) - activeOccupantsCount;
    
    if (vacantNeeded > 0) {
      // Find existing Vacant entries for this post
      const postVacantEntries = existingVacant.filter(isSamePost);
      
      // Keep existing Vacant entries or create new ones
      for (let i = 0; i < vacantNeeded; i++) {
        if (i < postVacantEntries.length) {
          newEmployeesList.push(postVacantEntries[i]);
        } else {
          newEmployeesList.push({
            id: 'VAC-' + (post.key || '') + '-' + i + '-' + Math.random().toString(36).substring(2, 6),
            name: 'VACANT',
            nameHi: 'रिक्त',
            internalId: 'N/A',
            dept: post.dept || 'UPPTCL',
            desig: post.desig,
            status: 'Vacant',
            office: post.office || '',
            zone: post.zone || '',
            circle: post.circle || '',
            division: post.division || '',
            subdivision: '',
            officeName: post.officeName || '',
            chargeType: 'Main',
            substantiveDesig: ''
          });
        }
      }
    }
  });

  return newEmployeesList;
};
