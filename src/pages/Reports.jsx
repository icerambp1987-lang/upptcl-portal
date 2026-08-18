import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployee } from '../contexts/EmployeeContext';
import { useHierarchy } from '../contexts/HierarchyContext';
import janshaktiData from '../data/janshaktiData.json';

const Reports = () => {
  const { t, lang } = useLanguage();
  const { employees } = useEmployee();
  const { hierarchyData } = useHierarchy();

  const groupedData = useMemo(() => {
    const groups = {};
    employees.forEach(emp => {
      if (emp.status === 'Retired') return;

      const dept = emp.dept || 'Unknown Department';
      let desig = (emp.desig || 'Unknown Designation').replace(/\s+/g, ' ').trim();
      
      // Normalize any Chief Engineer variant to unified standard designation
      if (desig === 'Chief Engineer (L-I/II) (E&M)' || desig === 'Chief Engineer (L-I) (E&M)' || desig === 'Chief Engineer (L-II) (E&M)') {
        desig = 'Chief Engineer (L-II)/Additional Secretary (E&M)';
      }

      if (!groups[dept]) groups[dept] = {};
      if (!groups[dept][desig]) groups[dept][desig] = [];
      
      groups[dept][desig].push(emp);
    });

    if (hierarchyData && hierarchyData.zones) {
      const seDesig = 'Superintending Engineer/Joint Secretary (E&M)';
      const eeDesig = 'Executive Engineer/Deputy Secretary (E&M)';
      
      if (!groups['UPPTCL']) groups['UPPTCL'] = {};
      if (!groups['UPPTCL'][seDesig]) groups['UPPTCL'][seDesig] = [];
      if (!groups['UPPTCL'][eeDesig]) groups['UPPTCL'][eeDesig] = [];
      
      const seList = groups['UPPTCL'][seDesig];
      const eeList = groups['UPPTCL'][eeDesig];

      const ceDesig = 'Chief Engineer (L-II)/Additional Secretary (E&M)';
      if (!groups['UPPTCL'][ceDesig]) groups['UPPTCL'][ceDesig] = [];
      const ceList = groups['UPPTCL'][ceDesig];
      const ce1Desig = 'Chief Engineer (L-I) (E&M)';
      const ce1List = groups['UPPTCL'][ce1Desig] || [];

      const isCEOccupied = (officeName, zoneName) => {
        return ceList.some(e => (!officeName || e.officeName === officeName) && (!zoneName || e.zone === zoneName)) ||
               ce1List.some(e => (!officeName || e.officeName === officeName) && (!zoneName || e.zone === zoneName));
      };

      const hqCESanctionedOffices = ['D&P, Lucknow', '765 kV, Design Unit, Lucknow', 'C&C, Lucknow', 'CMUT, Lucknow', 'Hq, Lucknow'];
      hqCESanctionedOffices.forEach(office => {
        if (!isCEOccupied(office, null)) {
          ceList.push({ id: `vacant-ce-hq-${office}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'HQ', officeName: office, status: 'Vacant', dept: 'UPPTCL', desig: ceDesig });
        }
      });

      const zoneCEs = ['West-Meerut', 'South-East, Prayagraj', 'South-West, Agra', 'Central-Lucknow', 'North-East, Gorakhpur', 'South-Central, Jhansi'];
      zoneCEs.forEach(zone => {
        if (!isCEOccupied(null, zone)) {
          ceList.push({ id: `vacant-ce-zone-${zone}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'ZONE', zone: zone, status: 'Vacant', dept: 'UPPTCL', desig: ceDesig });
        }
      });

      hierarchyData.zones.forEach(z => {
        const isCivil = z.name.includes('Civil');
        if (isCivil) return; // For now focus on E&M fixed posts

        // Inject SE (A) to CE
        const targetSEOffice = `SE (A) to ${z.officeName}`;
        if (!seList.some(e => e.officeName === targetSEOffice)) {
          seList.push({ id: `vacant-se-${z.name}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'ZONE', zone: z.name, officeName: targetSEOffice, status: 'Vacant', dept: 'UPPTCL', desig: seDesig });
        }

        z.circles.forEach(c => {
          // Inject SE for Circle
          if (!seList.some(e => e.circle === c.name)) {
            seList.push({ id: `vacant-se-circ-${c.name}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'ZONE', zone: z.name, circle: c.name, status: 'Vacant', dept: 'UPPTCL', desig: seDesig });
          }

          // Inject EE (A) to SE
          const targetEEOffice = `EE (A) to SE, ${c.name}`;
          if (!eeList.some(e => e.officeName === targetEEOffice || e.division === targetEEOffice)) {
            eeList.push({ id: `vacant-ee-a-${c.name}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'ZONE', zone: z.name, circle: c.name, officeName: targetEEOffice, status: 'Vacant', dept: 'UPPTCL', desig: eeDesig });
          }

          // Inject EE for Divisions
          const validDivs = (c.divisions || []).filter(d => !d.startsWith('EE (A)'));
          validDivs.forEach(d => {
            if (!eeList.some(e => e.division === d)) {
              eeList.push({ id: `vacant-ee-div-${d}`, name: 'VACANT', nameHi: 'रिक्त', chargeType: 'Main', office: 'ZONE', zone: z.name, circle: c.name, division: d, status: 'Vacant', dept: 'UPPTCL', desig: eeDesig });
            }
          });
        });
      });
    }

    return groups;
  }, [employees]);

  const location = useLocation();
  const [filterOption, setFilterOption] = useState(location.state?.filter || 'all');

  useEffect(() => {
    if (location.state?.filter) {
      setFilterOption(location.state.filter);
    }
    if (location.state?.autoPrint) {
      setTimeout(() => window.print(), 800);
    }
  }, [location.state]);

  // Custom data for SE Additional Charge Report
  const seAdditionalData = useMemo(() => {
    if (filterOption !== 'se_additional') return {};
    
    const seEmDesig = 'Superintending Engineer/Joint Secretary (E&M)';
    const seCivilDesig = 'Superintending Engineer (Civil)';
    
    const additionalSEs = employees.filter(e => {
      if (!e.status || e.status === 'Retired' || e.status === 'Vacant' || e.name.toUpperCase() === 'VACANT') return false;
      if (e.chargeType !== 'Additional') return false;
      const desig = (e.desig || '').replace(/\s+/g, ' ').trim();
      return desig === seEmDesig || desig === seCivilDesig;
    });

    const groups = { 'Zone-SE (E&M)': [], 'HQ-SE (E&M)': [], 'SE (Civil)': [] };

    additionalSEs.forEach(emp => {
      const desig = (emp.desig || '').replace(/\s+/g, ' ').trim();
      if (desig === seCivilDesig) {
        groups['SE (Civil)'].push(emp);
      } else {
        if (emp.office === 'HQ' || emp.zone === 'HQ' || emp.zone === 'Headquarters (HQ)') {
          groups['HQ-SE (E&M)'].push(emp);
        } else {
          groups['Zone-SE (E&M)'].push(emp);
        }
      }
    });
    return groups;
  }, [employees, filterOption]);

  const filteredGroupedData = useMemo(() => {
    if (filterOption === 'all') return groupedData;
    
    const result = {};
    Object.keys(groupedData).forEach(dept => {
      // If the filter is 'sldc', ONLY process 'UP SLDC LTD.' department and include everything in it.
      if (filterOption === 'sldc') {
        if (dept === 'UP SLDC LTD.') {
          result[dept] = groupedData[dept];
        }
        return; // Skip other departments for 'sldc' filter
      }

      // If the filter is NOT 'sldc', hide SLDC (unless 'all' was selected, which is handled above)
      if (dept === 'UP SLDC LTD.') {
        if (filterOption === 'ce_em') return; // Hide it because we are merging it into UPPTCL
        return;
      }
      
      const filteredDesigs = {};
      Object.keys(groupedData[dept]).forEach(desig => {
        const normDesig = desig.replace(/\s+/g, ' ').trim();
        
        if (filterOption === 'ce_em' && (normDesig === 'Chief Engineer (L-I) (E&M)' || normDesig === 'Chief Engineer (L-II)/Additional Secretary (E&M)' || normDesig === 'Chief Engineer (L-II) (E&M)')) {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
        else if (filterOption === 'ce_civil' && normDesig === 'Chief Engineer (L-II) (Civil)') {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
        else if (filterOption === 'se_em' && normDesig === 'Superintending Engineer/Joint Secretary (E&M)') {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
        else if (filterOption === 'se_civil' && normDesig === 'Superintending Engineer (Civil)') {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
        else if (filterOption === 'ee_em' && normDesig === 'Executive Engineer/Deputy Secretary (E&M)') {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
        else if (filterOption === 'ee_civil' && normDesig === 'Executive Engineer (Civil)') {
          filteredDesigs[desig] = groupedData[dept][desig];
        }
      });
      
      if (Object.keys(filteredDesigs).length > 0) {
        const ce1 = filteredDesigs['Chief Engineer (L-I) (E&M)'];
        const ce2 = filteredDesigs['Chief Engineer (L-II)/Additional Secretary (E&M)'];
        
        let sldcCEs = [];
        if (dept === 'UPPTCL' && filterOption === 'ce_em' && groupedData['UP SLDC LTD.'] && groupedData['UP SLDC LTD.']['Chief Engineer (L-II)/Additional Secretary (E&M)']) {
           sldcCEs = groupedData['UP SLDC LTD.']['Chief Engineer (L-II)/Additional Secretary (E&M)'].map(e => ({
              ...e,
              zone: 'UP SLDC LTD.'
           }));
        }

        if (ce1 || ce2 || sldcCEs.length > 0) {
          filteredDesigs['Chief Engineer (L-I/II) (E&M)'] = [...(ce1 || []), ...(ce2 || []), ...sldcCEs];
          delete filteredDesigs['Chief Engineer (L-I) (E&M)'];
          delete filteredDesigs['Chief Engineer (L-II)/Additional Secretary (E&M)'];
        }
        result[dept] = filteredDesigs;
      }
    });
    return result;
  }, [groupedData, filterOption]);

  const getDesigRank = (desigName) => {
    const idx = janshaktiData.findIndex(d => d.english === desigName || d.hindi === desigName);
    return idx !== -1 ? idx : 9999;
  };

  const janshaktiWithDistribution = useMemo(() => {
    let currentData = JSON.parse(JSON.stringify(janshaktiData));
    try {
      const raw = localStorage.getItem('uppcl_dashboard_working_data_v2');
      if (raw) {
        const saved = JSON.parse(raw);
        currentData.forEach((d, idx) => {
          if (saved[idx] && saved[idx].dist) d.distribution = saved[idx].dist;
        });
      }
    } catch(e) {}
    
    currentData.forEach(d => {
      if (!d.distribution) {
        d.distribution = {
          upptcl_hq: { s: d.sanctioned || 0, w: 0 },
          upptcl_zone: { s: 0, w: 0 },
          sldc: { s: 0, w: 0 }
        };
      }
    });
    return currentData;
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr || '-';
  };

  const separatedEmployees = employees.filter(emp => emp.status && emp.status !== 'Active' && emp.status !== 'Vacant' && (emp.name && emp.name.toUpperCase() !== 'VACANT'));
  const seenIds = new Set();
  const dedupedSeparated = [];
  for (const emp of separatedEmployees) {
    if (!seenIds.has(emp.internalId) || emp.internalId === 'N/A') {
      if (emp.internalId !== 'N/A') seenIds.add(emp.internalId);
      dedupedSeparated.push(emp);
    }
  }

  const groupedByZoneSep = {};
  dedupedSeparated.forEach(emp => {
    const z = emp.zone || (lang === 'hi' ? 'अन्य' : 'Other');
    if (!groupedByZoneSep[z]) groupedByZoneSep[z] = [];
    groupedByZoneSep[z].push(emp);
  });

  return (
    <div className="print-report-page">

      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <h2 className="fw-bold" style={{ color: 'var(--text-dark)' }}>{lang === 'hi' ? 'विस्तृत कर्मचारी रिपोर्ट' : 'Detailed Employee Report'}</h2>
        <div className="d-flex gap-3">
          <select 
            className="form-select form-select-sm shadow-sm border-primary" 
            style={{ width: 'auto', fontWeight: '500' }}
            value={filterOption} 
            onChange={(e) => setFilterOption(e.target.value)}
          >
            <option value="all">{lang === 'hi' ? 'सम्पूर्ण रिपोर्ट (All)' : 'All Data'}</option>
            <option value="ce_em">Chief Engineer (L-I/II) (E&M)</option>
            <option value="ce_civil">Chief Engineer (L-II) (Civil)</option>
            <option value="se_em">Superintending Engineer (E&M)</option>
            <option value="se_civil">Superintending Engineer (Civil)</option>
            <option value="ee_em">Executive Engineer (E&M)</option>
            <option value="ee_civil">Executive Engineer (Civil)</option>
            <option value="se_additional">{lang === 'hi' ? 'अधीक्षण अभियन्ता (केवल अतिरिक्त कार्यभार)' : 'Superintending Engineer (Additional Charge Only)'}</option>
            <option value="sldc">UP SLDC LTD. (All)</option>
            <option value="retirements">{lang === 'hi' ? 'सेवानिवृत्ति / सेपरेशन लिस्ट' : 'Retirements / Separation List'}</option>
          </select>
          <button className="btn btn-primary px-4 py-2" onClick={() => window.print()} style={{ backgroundColor: 'var(--primary-color)', border: 'none' }}>
            <i className="fas fa-print me-2"></i> {lang === 'hi' ? 'रिपोर्ट प्रिंट करें' : 'Print Report'}
          </button>
        </div>
      </div>

      {['ce_em', 'ce_civil', 'se_em', 'se_civil', 'ee_em', 'ee_civil', 'se_additional'].includes(filterOption) && (
        <div className="text-center mb-2 border-bottom pb-2">
           <h3 className="fw-bold mb-1 text-decoration-underline" style={{ color: 'var(--text-dark)', fontSize: '1.4rem' }}>
             {filterOption === 'ce_em' ? 'पारेषण स्कन्ध में तैनात मुख्य अभियन्ता (स्तर-I/II) की पदधारिता का विवरण' 
               : filterOption === 'ce_civil' ? 'पारेषण स्कन्ध में तैनात मुख्य अभियन्ता (जानपद) की पदधारिता का विवरण'
               : filterOption === 'se_em' ? 'पारेषण स्कन्ध में तैनात अधीक्षण अभियन्ताओं की पदधारिता का विवरण'
               : filterOption === 'se_civil' ? 'पारेषण स्कन्ध में तैनात अधीक्षण अभियन्ताओं (जानपद) की पदधारिता का विवरण'
               : filterOption === 'ee_em' ? 'पारेषण स्कन्ध में तैनात अधिशासी अभियन्ताओं की पदधारिता का विवरण'
               : filterOption === 'ee_civil' ? 'पारेषण स्कन्ध में तैनात अधिशासी अभियन्ताओं (जानपद) की पदधारिता का विवरण'
               : filterOption === 'se_additional' ? 'पारेषण स्कन्ध में तैनात अधीक्षण अभियन्ताओं (अतिरिक्त कार्यभार) की पदधारिता का विवरण' : ''}
           </h3>
           <div className="text-muted fw-bold fs-6">
             दिनांक: {new Date().toLocaleDateString('hi-IN')}
           </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4" style={{ marginTop: filterOption === 'ce_em' ? '-10px' : '0' }}>
        {filterOption === 'retirements' ? (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light">
                <tr>
                  <th>{lang === 'hi' ? 'ज़ोन' : 'Zone'}</th>
                  <th>{lang === 'hi' ? 'ऑफिस / सर्किल' : 'Office / Circle'}</th>
                  <th>{lang === 'hi' ? 'नाम' : 'Name'}</th>
                  <th>{lang === 'hi' ? 'SAP आईडी' : 'SAP ID'}</th>
                  <th>{lang === 'hi' ? 'पोस्टिंग की तिथि' : 'Date of Posting'}</th>
                  <th>{lang === 'hi' ? 'जन्मतिथि' : 'DOB'}</th>
                  <th>{lang === 'hi' ? 'सेवानिवृत्ति तिथि' : 'DOR'}</th>
                  <th>{lang === 'hi' ? 'रिमार्क' : 'Remarks'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedByZoneSep).length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">{lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No employees found'}</td></tr>
                ) : Object.keys(groupedByZoneSep).map(zoneName => (
                  <React.Fragment key={zoneName}>
                    <tr className="table-secondary">
                      <td colSpan="8" className="fw-bold py-1">
                        {zoneName} - {lang === 'hi' ? 'कुल' : 'Total'}: {groupedByZoneSep[zoneName].length}
                      </td>
                    </tr>
                    {groupedByZoneSep[zoneName].map(emp => (
                      <tr key={emp.id}>
                        <td className="fw-bold text-dark">{emp.zone || '-'}</td>
                        <td>{[emp.circle, emp.division, emp.officeName].filter(Boolean).filter(val => !val.toString().includes('Select ')).join(', ')}</td>
                        <td>
                          <div className="fw-bold">{emp.name}</div>
                          {lang === 'hi' && emp.nameHi && <div className="text-muted small">{emp.nameHi}</div>}
                          <span className="badge bg-secondary mt-1">{emp.status}</span>
                        </td>
                        <td className="text-primary fw-bold">{emp.internalId === 'N/A' ? '' : emp.internalId}</td>
                        <td>{formatDate(emp.doj) || '-'}</td>
                        <td>{formatDate(emp.dob) || '-'}</td>
                        <td>{formatDate(emp.dor) || '-'}</td>
                        <td></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : filterOption === 'se_additional' ? (
          <div className="table-responsive">
            <style>
              {`
                @media print {
                  @page { size: A4 landscape; margin: 10mm; }
                  body { background: white; -webkit-print-color-adjust: exact; }
                  .d-print-none { display: none !important; }
                  .print-header { display: block !important; }
                  table { font-size: 11pt !important; }
                  td, th { padding: 8px !important; }
                }
                .print-header { display: none; }
              `}
            </style>
            


            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Zone</th>
                  <th>Circle</th>
                  <th>Name</th>
                  <th>SAP ID</th>
                  <th className="d-print-none">DOB</th>
                  <th>DOR</th>
                  <th>Date of Posting</th>
                  <th>OM No.</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(seAdditionalData).map(groupName => {
                  const empList = seAdditionalData[groupName];
                  if (empList.length === 0) return null;
                  
                  return (
                    <React.Fragment key={groupName}>
                      <tr className="table-secondary">
                        <td colSpan="8" className="fw-bold py-2 text-primary" style={{fontSize: '1rem'}}>
                          {groupName} - Total: {empList.length}
                        </td>
                      </tr>
                      {empList.map(emp => (
                        <tr key={emp.id}>
                          <td className="fw-bold">{emp.zone || '-'}</td>
                          <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', minWidth: '150px' }}>
                            {[emp.circle, emp.division, emp.officeName].filter(Boolean).filter(val => !val.toString().includes('Select ')).join(', ').replace(', ', ',\n')}
                          </td>
                          <td className="fw-bold">
                            {emp.name}
                            {emp.nameHi && <div className="text-muted small">{emp.nameHi}</div>}
                            <span className="badge bg-warning text-dark mt-1">Additional</span>
                          </td>
                          <td className="text-primary fw-bold">{emp.internalId === 'N/A' ? '' : emp.internalId}</td>
                          <td className="d-print-none">{formatDate(emp.dob) || '-'}</td>
                          <td>{formatDate(emp.dor) || '-'}</td>
                          <td>{formatDate(emp.doj) || '-'}</td>
                          <td>{emp.omNo || '-'}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : Object.keys(filteredGroupedData).length === 0 ? (
          <div className="text-center py-5 text-muted">
            {lang === 'hi' ? 'कोई डाटा उपलब्ध नहीं है।' : 'No data available.'}
          </div>
        ) : (
          Object.keys(filteredGroupedData).sort((a, b) => a === 'UPPTCL' ? -1 : (b === 'UPPTCL' ? 1 : a.localeCompare(b))).map(dept => {
            // Calculate department total (excluding Additional Charge)
            const deptTotal = Object.values(filteredGroupedData[dept]).reduce((acc, curr) => acc + curr.filter(e => e.chargeType !== 'Additional' && !e.name.toUpperCase().includes('VACANT')).length, 0);
            
            return (
              <div key={dept} className="mb-5">
                {filterOption === 'sldc' ? (
                  <div className="text-center mb-4 pb-2 border-bottom">
                    <h3 className="fw-bold mb-2 text-dark">निदेशक (स्टेट लोड डिस्पैच सेन्टर) में तैनात कार्मिकों की पदधारिता का विवरण</h3>
                    <h5 className="text-muted mb-0">दिनांक: {new Date().toLocaleDateString('en-IN')}</h5>
                  </div>
                ) : (
                  <div className={`d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom ${(['ce_em', 'ce_civil', 'se_em', 'se_civil', 'ee_em', 'ee_civil', 'se_additional'].includes(filterOption) && dept === 'UPPTCL') ? 'd-none' : ''}`}>
                    <h3 className="text-primary mb-0" style={{fontSize: '1.5rem'}}>🏢 {lang === 'hi' ? 'विभाग' : 'Department'}: {dept}</h3>
                    <h5 className="text-muted fw-bold mb-0">{lang === 'hi' ? 'योग (Total):' : 'Total:'} {deptTotal}</h5>
                  </div>
                )}
              
              {Object.keys(filteredGroupedData[dept]).sort((a, b) => getDesigRank(a) - getDesigRank(b)).map(desig => {
                const jData = janshaktiWithDistribution.find(d => (d.english || '').replace(/\s+/g, ' ').trim() === desig || d.hindi === desig);
                let sanctioned = 0;
                if (desig === 'Chief Engineer (L-I/II) (E&M)') {
                  const j1 = janshaktiWithDistribution.find(d => (d.english || '').replace(/\s+/g, ' ').includes('Chief Engineer (L-I) (E&M)'));
                  const j2 = janshaktiWithDistribution.find(d => (d.english || '').replace(/\s+/g, ' ').includes('Chief Engineer (L-II)/Additional Secretary (E&M)'));
                  let s1 = 0, s2 = 0;
                  if (j1) s1 = dept === 'UPPTCL' ? (j1.distribution.upptcl_hq.s + j1.distribution.upptcl_zone.s) : (j1.sanctioned || 0);
                  if (j2) s2 = dept === 'UPPTCL' ? (j2.distribution.upptcl_hq.s + j2.distribution.upptcl_zone.s) : (j2.sanctioned || 0);
                  sanctioned = (dept === 'UPPTCL' && filterOption === 'ce_em') ? 13 : s1 + s2;
                } else if (jData) {
                  if (dept === 'UP SLDC LTD.') {
                    sanctioned = jData.distribution.sldc.s;
                    if (sanctioned === 0) {
                      if (desig.includes('Superintending Engineer') && !desig.includes('Civil')) sanctioned = 6;
                      else if (desig.includes('Chief Engineer (L-I/II) (E&M)') || desig.includes('Chief Engineer (L-II)')) sanctioned = 2;
                      else sanctioned = filteredGroupedData[dept][desig].filter(e => e.chargeType !== 'Additional' && e.isSanctioned !== false).length;
                    }
                  } else if (dept === 'UPPTCL') {
                    sanctioned = jData.distribution.upptcl_hq.s + jData.distribution.upptcl_zone.s;
                  } else {
                    sanctioned = jData.sanctioned || 0;
                  }
                }
                const workingList = filteredGroupedData[dept][desig].filter(e => {
                  if (e.status === 'Retired' || e.status === 'Vacant') return false;
                  const nameUpper = (e.name || '').toUpperCase();
                  if (nameUpper.includes('VACANT') || nameUpper.includes('RETIRED')) return false;
                  return e.chargeType !== 'Additional';
                });
                const working = workingList.length;
                if (desig.includes('Executive Engineer')) console.log('Working List:', workingList);
                const vacant = sanctioned - working;

                let displayDesig = desig;
                if (filterOption === 'sldc') {
                  if (desig === 'Chief Engineer (L-II)/Additional Secretary (E&M)') displayDesig = 'Chief Engineer (L-II)';
                  if (desig === 'Superintending Engineer/Joint Secretary (E&M)') displayDesig = 'Superintending Engineer (E&M)';
                }

                return (
                  <div key={desig} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0 text-dark" style={{fontSize: '1.1rem'}}>👨‍💼 {lang === 'hi' ? 'पद' : 'Designation'}: {displayDesig}</h5>
                      <div className="d-flex">
                        <span className="badge bg-primary me-2 px-2 py-1">{lang === 'hi' ? 'स्वीकृत:' : 'Sanctioned:'} {sanctioned}</span>
                        <h5 className="mb-0 text-success fw-bold" style={{fontSize: '1rem'}}>{lang === 'hi' ? 'कार्यरत:' : 'Working:'} {working}</h5>
                        <h5 className="mb-0 text-danger fw-bold ms-3" style={{fontSize: '1rem'}}>{lang === 'hi' ? 'रिक्त:' : 'Vacant:'} {vacant}</h5>
                      </div>
                    </div>
                    
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: '0.85rem', tableLayout: 'fixed' }}>
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '5%', textAlign: 'center' }}>{lang === 'hi' ? 'क्र.सं.' : 'S.No.'}</th>
                            <th style={{ width: '20%' }}>{lang === 'hi' ? 'ज़ोन / कार्यालय / परिमंडल' : 'Zone / Office / Circle'}</th>
                            <th style={{ width: '20%' }}>{lang === 'hi' ? 'नाम' : 'Name'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'SAP आईडी' : 'SAP ID'}</span></th>
                            <th style={{ width: '15%' }}>{lang === 'hi' ? 'आईडी' : 'ID'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'ऑडिट क्र.' : 'Audit No.'}</span></th>
                            <th style={{ width: '15%' }}>{lang === 'hi' ? 'जन्मतिथि' : 'DOB'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'सेवानिवृत्ति तिथि' : 'DOR'}</span></th>
                            <th style={{ width: '15%' }}>{lang === 'hi' ? 'पोस्टिंग की तिथि' : 'Date of Posting'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'कार्यकाल' : 'Tenure'}</span></th>
                            <th style={{ width: '15%' }}>{lang === 'hi' ? 'मोब. नं. (P)' : 'Mob. No.(P)'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'CUG नं.' : 'CUG No.'}</span></th>
                            <th style={{ width: '15%' }}>{lang === 'hi' ? 'आदेश संख्या' : 'OM No.'}<br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{lang === 'hi' ? 'श्रेणी' : 'Category'}</span></th>
                          </tr>
                        </thead>
                      <tbody>
                        {(() => {
                           const zoneRank = {};
                           const circleRank = {};
                           hierarchyData.zones.forEach((z, zIdx) => {
                             zoneRank[z.name] = zIdx;
                             z.circles.forEach((c, cIdx) => {
                               circleRank[c.name] = cIdx;
                             });
                           });

                           const sortedEmps = [...filteredGroupedData[dept][desig]]
                             .sort((a, b) => {
                             const zoneA = a.zone || '';
                             const zoneB = b.zone || '';
                             const rankZA = zoneRank[zoneA] !== undefined ? zoneRank[zoneA] : 999;
                             const rankZB = zoneRank[zoneB] !== undefined ? zoneRank[zoneB] : 999;
                             if (rankZA !== rankZB) return rankZA - rankZB;
                             if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);
                             const aIsAttached = (a.officeName || '').includes('(A) to CE');
                             const bIsAttached = (b.officeName || '').includes('(A) to CE');
                             if (aIsAttached && !bIsAttached) return -1;
                             if (!aIsAttached && bIsAttached) return 1;
                             const circleA = a.circle || '';
                             const circleB = b.circle || '';
                             const rankCA = circleRank[circleA] !== undefined ? circleRank[circleA] : 999;
                             const rankCB = circleRank[circleB] !== undefined ? circleRank[circleB] : 999;
                             if (rankCA !== rankCB) return rankCA - rankCB;
                             if (circleA !== circleB) return circleA.localeCompare(circleB);

                             const aIsAttachedSE = (a.division || '').includes('(A) to SE') || (a.officeName || '').includes('(A) to SE');
                             const bIsAttachedSE = (b.division || '').includes('(A) to SE') || (b.officeName || '').includes('(A) to SE');
                             if (aIsAttachedSE && !bIsAttachedSE) return -1;
                             if (!aIsAttachedSE && bIsAttachedSE) return 1;

                             const hqOrder = [
                               'D&P, Lucknow',
                               '765 kV, Design Unit, Lucknow',
                               'C&C, Lucknow',
                               'CMUT, Lucknow',
                               'Hq, Lucknow',
                               'Operation, Lucknow',
                               'ERP, Lucknow',
                               'C&P, Lucknow'
                             ];
                             const rankOfcA = hqOrder.indexOf(a.officeName || '');
                             const rankOfcB = hqOrder.indexOf(b.officeName || '');
                             
                             if (rankOfcA !== -1 && rankOfcB !== -1) return rankOfcA - rankOfcB;
                             if (rankOfcA !== -1) return -1;
                             if (rankOfcB !== -1) return 1;

                             return (a.officeName || '').localeCompare(b.officeName || '');
                           });

                           const zoneGroups = {};
                           sortedEmps.forEach(e => {
                             let z = e.zone || (e.office === 'HQ' ? 'HQ' : 'Other');
                             if (desig === 'Chief Engineer (L-I/II) (E&M)' && (e.office === 'UP SLDC LTD.' || (e.officeName || '').toUpperCase().includes('SLDC'))) {
                               z = 'UP SLDC LTD.';
                             } else if (desig === 'Chief Engineer (L-I/II) (E&M)') {
                               const targetZones = ['West-Meerut', 'South-East, Prayagraj', 'South-West, Agra', 'Central-Lucknow', 'North-East, Gorakhpur', 'South-Central, Jhansi'];
                               if (z === 'HQ' || e.office === 'HQ') {
                                 z = 'Headquarters (HQ)';
                               } else if (targetZones.includes(z) || targetZones.some(tz => (z||'').includes(tz))) {
                                 z = lang === 'hi' ? 'ज़ोन (Zones)' : 'Zones';
                               }
                             } else if (desig === 'Chief Engineer (L-II) (Civil)') {
                                if (z === 'Civil-I, Lucknow' || z === 'Civil-II, Lucknow' || (z||'').includes('Civil') || z === 'HQ' || e.office === 'HQ') {
                                  z = lang === 'hi' ? 'ज़ोन (Zones)' : 'Zones';
                                }
                             }
                             if (!zoneGroups[z]) zoneGroups[z] = [];
                             zoneGroups[z].push(e);
                           });

                           const sortedZones = Object.keys(zoneGroups).sort((a, b) => {
                             if (a === 'Headquarters (HQ)' || a === 'HQ') return -1;
                             if (b === 'Headquarters (HQ)' || b === 'HQ') return 1;
                             if (a === 'ज़ोन (Zones)' || a === 'Zones') return -1;
                             if (b === 'ज़ोन (Zones)' || b === 'Zones') return 1;
                             if (a === 'Circle to be Created') return 1;
                             if (b === 'Circle to be Created') return -1;
                             const rankA = zoneRank[a] !== undefined ? zoneRank[a] : 999;
                             const rankB = zoneRank[b] !== undefined ? zoneRank[b] : 999;
                             if (rankA !== rankB) return rankA - rankB;
                             return a.localeCompare(b);
                           });
return sortedZones.map(z => {
                             let zSanctioned = 0;
                             if (z === 'Headquarters (HQ)' || z === 'HQ') {
                               if (desig === 'Chief Engineer (L-I/II) (E&M)') {
                                 zSanctioned = 5;
                               } else if (jData) {
                                 zSanctioned = jData.distribution?.upptcl_hq?.s || 0;
                               }
                             } else if (z === 'ज़ोन (Zones)' || z === 'Zones') {
                               if (desig === 'Chief Engineer (L-I/II) (E&M)') {
                                 zSanctioned = 6;
                               } else if (desig === 'Chief Engineer (L-II) (Civil)') {
                                 zSanctioned = 2;
                               } else if (jData) {
                                 zSanctioned = jData.distribution?.upptcl_zone?.s || 0;
                               }
                             } else if (z === 'UP SLDC LTD.' || z === 'SLDC') {
                               if (desig === 'Chief Engineer (L-I/II) (E&M)') {
                                 zSanctioned = 2;
                               } else {
                                 zSanctioned = jData ? (jData.distribution?.sldc?.s || 0) : 0;
                               }
                              } else {
                                const zoneObj = hierarchyData.zones?.find(zone => zone.name === z);
                                
                                if (desig.includes('Superintending Engineer') && !desig.includes('Civil')) {
                                  const hqSanctionedCounts = {
                                    '765 kV, Design Unit, Lucknow': 2,
                                    'C&C, Lucknow': 3,
                                    'D&P, Lucknow': 3,
                                    'Director (Commercial & Planning), Lucknow': 2,
                                    'Director (Operation), Lucknow': 0,
                                    'Director (PM&A), Lucknow': 3,
                                    'Director (W&P), Lucknow': 1,
                                    'Circle to be Created': 3,
                                    'Director (SLDC), Lucknow': 6
                                  };
                                  if (hqSanctionedCounts[z] !== undefined) {
                                    zSanctioned = hqSanctionedCounts[z];
                                  } else if (zoneObj) {
                                    zSanctioned = 1 + (zoneObj.circles?.length || 0);
                                  } else {
                                    zSanctioned = zoneGroups[z].filter(e => e.chargeType !== 'Additional' && e.isSanctioned !== false).length;
                                  }
                                } else if (desig.includes('Superintending Engineer') && desig.includes('Civil')) {
                                  const civilSanctionedCounts = {
                                    'Civil-I, Lucknow': 4,
                                    'Civil-II, Lucknow': 3
                                  };
                                  if (civilSanctionedCounts[z] !== undefined) {
                                    zSanctioned = civilSanctionedCounts[z];
                                  } else {
                                    zSanctioned = zoneGroups[z].filter(e => e.chargeType !== 'Additional' && e.isSanctioned !== false).length;
                                  }
                                } else if (zoneObj) {
                                  if (desig.includes('Executive Engineer')) {
                                    const eeA = zoneObj.circles?.length || 0;
                                    const eeDivs = zoneObj.circles?.reduce((acc, c) => acc + (c.divisions ? c.divisions.filter(d => !d.startsWith('EE (A)')).length : 0), 0) || 0;
                                    zSanctioned = eeA + eeDivs;
                                  } else {
                                    zSanctioned = 1 + (zoneObj.circles?.length || 0);
                                  }
                                } else {
                                  if (desig === 'Chief Engineer (L-II) (Civil)' && (z === 'Other' || z === 'अन्य')) {
                                    zSanctioned = 0;
                                  } else {
                                    zSanctioned = zoneGroups[z].filter(e => e.chargeType !== 'Additional' && e.isSanctioned !== false).length;
                                  }
                                }
                              }
                             
                             const zWorking = zoneGroups[z].filter(e => e.chargeType !== 'Additional' && !e.name.toUpperCase().includes('VACANT')).length;
                             const zVacant = zSanctioned - zWorking;
                             const displayVacant = zVacant;
                             const zVacantPercent = zSanctioned > 0 ? Math.round((displayVacant / zSanctioned) * 100) : 0;
                             
                             return (
                               <React.Fragment key={z}>
                                 {filterOption !== 'sldc' && !(desig === 'Chief Engineer (L-II) (Civil)' && (z === 'ज़ोन (Zones)' || z === 'Zones')) && (
                                   <tr style={{ backgroundColor: 'var(--bg-light)', pageBreakBefore: (filterOption === 'ce_em' && (z === 'ज़ोन (Zones)' || z === 'Zones')) ? 'always' : 'auto' }}>
                                     <td colSpan="8" className="py-2 border-bottom border-top border-secondary">
                                       <div className="d-flex justify-content-between align-items-center">
                                         <strong className="text-primary" style={{fontSize: '0.95rem'}}>
                                            📍 {z === 'HQ' ? (lang === 'hi' ? 'मुख्यालय (HQ)' : 'Headquarters (HQ)') : z === 'Other' ? (lang === 'hi' ? 'अन्य' : 'Other') : z}
                                         </strong>
                                         <div>
                                            <span className="badge bg-primary me-2">{lang === 'hi' ? 'स्वीकृत:' : 'Sanctioned:'} {zSanctioned}</span>
                                            <span className="badge bg-success me-2">{lang === 'hi' ? 'कार्यरत:' : 'Working:'} {zWorking}</span>
                                            <span className="badge bg-danger me-2">{lang === 'hi' ? 'रिक्त:' : 'Vacant:'} {zVacant}</span>
                                            <span className="badge bg-secondary">{lang === 'hi' ? 'रिक्त %:' : 'Vacant %:'} {zVacantPercent}%</span>
                                         </div>
                                       </div>
                                     </td>
                                   </tr>
                                 )}
                                 {zoneGroups[z].map((emp, index) => {
                                   const prevEmp = index > 0 ? zoneGroups[z][index - 1] : null;
                                   const isEE = desig.includes('Executive Engineer') || desig.includes('EE');
                                   const showCircleHeader = isEE && emp.circle && (!prevEmp || prevEmp.circle !== emp.circle);
                                   return (
                                   <React.Fragment key={emp.id}>
                                     {showCircleHeader && (
                                       <tr className="d-none d-print-table-row" style={{ backgroundColor: '#f0f0f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                                         <td colSpan="8" className="fw-bold text-center py-2" style={{ borderTop: '2px solid #aaa', borderBottom: '2px solid #aaa', fontSize: '1.2rem', color: '#000' }}>
                                           {emp.circle}
                                         </td>
                                       </tr>
                                     )}
                                   <tr style={showCircleHeader && index > 0 ? { borderTop: '3px solid #6c757d' } : {}}>
                                     <td className="text-center align-middle">
                                       <span className="fw-bold text-dark">{index + 1}</span>
                                     </td>
                                      <td>
                                        {(() => {
                                          const rawLocs = [emp.circle, emp.division, emp.subdivision, emp.officeName, emp.zone]
                                            .filter(Boolean)
                                            .filter(val => !val.toString().includes('Select '));
                                          
                                          const uniqueLocs = [];
                                          rawLocs.forEach(item => {
                                            const trimmed = item.trim();
                                            if (trimmed && !uniqueLocs.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
                                              uniqueLocs.push(trimmed);
                                            }
                                          });

                                          if (uniqueLocs.length === 0) {
                                            return <div className="fw-bold text-dark mb-1">-</div>;
                                          }

                                          return uniqueLocs.map((loc, idx) => {
                                            const isCircleText = isEE && loc === emp.circle;
                                            return (
                                              <div key={idx} className={(idx === 0 ? "fw-bold text-dark mb-1 d-flex flex-wrap align-items-center gap-1" : "text-muted small") + (isCircleText ? " d-print-none" : "")}>
                                                <span>{loc}</span>
                                                {['ERP, Lucknow', 'Operation, Lucknow', 'C&P, Lucknow'].includes(loc) && (
                                                  <span className="badge bg-warning text-dark border border-warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                                                    {lang === 'hi' ? 'अस्वीकृत पद' : 'Unsanctioned'}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          });
                                        })()}
                                      </td>
                                     <td>
                                       <div className="fw-bold text-dark mb-1">{emp.name}</div>
                                       {lang === 'hi' && emp.nameHi && <div className="text-muted small mb-1">{emp.nameHi}</div>}
                                       <div className="text-primary small">
                                         {emp.internalId !== 'N/A' ? emp.internalId : ''}
                                         {emp.chargeType === 'Additional' ? (
                                           <span className="ms-2 badge bg-warning text-dark px-1 py-0">{lang === 'hi' ? 'अतिरिक्त' : 'Additional'}</span>
                                         ) : ''}
                                       </div>
                                       {emp.substantiveDesig && emp.substantiveDesig !== emp.desig && (
                                         <div className="mt-1">
                                           <span className="badge bg-secondary px-1 py-0" style={{fontSize: '0.7rem', whiteSpace: 'normal', textAlign: 'left'}}>{emp.substantiveDesig}</span>
                                         </div>
                                       )}
                                     </td>
                                     <td>
                                       <div className="fw-bold text-dark mb-1">{emp.empIdStr || '-'}</div>
                                       <div className="text-muted small"><strong>Audit:</strong> {emp.auditNo || '-'}</div>
                                     </td>
                                     <td>
                                       <div><strong>B:</strong> {formatDate(emp.dob)}</div>
                                       <div><strong>R:</strong> {formatDate(emp.dor)}</div>
                                     </td>
                                     <td>
                                       <div><strong>P:</strong> {formatDate(emp.doj)}</div>
                                       <div className="text-muted">{emp.tenure || '-'}</div>
                                     </td>
                                     <td style={{ whiteSpace: 'nowrap' }}>
                                       <div><strong>M:</strong> {emp.mobNo || '-'}</div>
                                       <div><strong>CUG:</strong> {emp.cugNo || '-'}</div>
                                     </td>
                                     <td>
                                       <div>{emp.omNo || '-'}</div>
                                       <div className="text-muted">{emp.caste || '-'}</div>
                                     </td>
                                   </tr>
                                 </React.Fragment>
                                 );
                                 })}
                               </React.Fragment>
                             );
                           });
                        })()}
                      </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default Reports;
