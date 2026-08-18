import React from 'react';
import { useEmployee } from '../contexts/EmployeeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function EEVacancyDetails({ lang = 'en' }) {
  const { employees } = useEmployee();
  const { t } = useLanguage();

  // Zones as per Excel (Sanctioned posts set to 0 initially for EE)
  const zonesData = [
    { name: 'Central-Lucknow', s: 0, keywords: ['CENTRAL-LUCKNOW', 'CENTRAL, LUCKNOW'] },
    { name: 'South-East, Prayagraj', s: 0, keywords: ['SOUTH-EAST, PRAYAGRAJ', 'SOUTH-EAST'] },
    { name: 'West-Meerut', s: 0, keywords: ['WEST-MEERUT'] },
    { name: 'South-West, Agra', s: 0, keywords: ['SOUTH-WEST, AGRA', 'SOUTH-WEST'] },
    { name: 'North-East, Gorakhpur', s: 0, keywords: ['NORTH-EAST, GORAKHPUR', 'NORTH-EAST'] },
    { name: 'South-Central, Jhansi', s: 0, keywords: ['SOUTH-CENTRAL, JHANSI', 'SOUTH-CENTRAL'] },
    { name: 'C&C, Lucknow', s: 0, keywords: ['C&C'] },
    { name: 'D&P, Lucknow', s: 0, keywords: ['D&P'] },
    { name: '765 kV, Design Unit, Lucknow', s: 0, keywords: ['765', 'DESIGN UNIT'] },
    { name: 'Director (Commercial & Planning), Lucknow', s: 0, keywords: ['COMMERCIAL', 'C&P'] },
    { name: 'Director (PM&A), Lucknow', s: 0, keywords: ['PM&A'] },
    { name: 'Director (W&P), Lucknow', s: 0, keywords: ['W&P'], exclude: ['PPP'] },
    { name: 'PPP Cell (Under Dir. (W&P), Lko.)', s: 0, keywords: ['PPP'] },
    { name: 'Director (Operation), Lucknow', s: 0, keywords: ['OPERATION'] },
    { name: 'Circle to be Created', s: 0, keywords: ['CREATE'] },
    { name: 'UP SLDC LTD.', s: 0, keywords: ['SLDC'] },
    // Civil
    { name: 'Civil-I, Lucknow', s: 0, keywords: ['CIVIL-I, LUCKNOW', 'CIVIL-I,LUCKNOW'] },
    { name: 'Civil-II, Lucknow', s: 0, keywords: ['CIVIL-II, LUCKNOW', 'CIVIL-II,LUCKNOW'] }
  ];

  const targetDesigs = ['Executive Engineer', 'EE', 'EE (E&M)', 'Executive Engineer (E&M)', 'Executive Engineer (Civil)', 'EE (Civil)'];

  const workingEmps = employees.filter(emp => {
    if (emp.status !== 'Active' || emp.chargeType === 'Additional' || (emp.name || '').toUpperCase().includes('VACANT')) return false;
    const empDesig = emp.desig || '';
    // Use exact word matches or prefix/suffix checking for 'EE' to avoid false positives in longer words
    return targetDesigs.some(d => {
        if (d === 'EE') {
            return empDesig.split(' ').includes('EE');
        }
        return empDesig.includes(d);
    });
  });

  const vacantEmps = employees.filter(emp => {
    const isVacant = (emp.name || '').toUpperCase().includes('VACANT');
    const isAdditional = emp.chargeType === 'Additional';
    
    // A post is vacant if it's explicitly marked VACANT or if it only has an Additional charge holder
    if (emp.status !== 'Active' && !isVacant) return false;
    if (!isVacant && !isAdditional) return false;

    const empDesig = emp.desig || '';
    return targetDesigs.some(d => {
        if (d === 'EE') {
            return empDesig.split(' ').includes('EE');
        }
        return empDesig.includes(d);
    });
  });

  // Dynamically add unmatched offices
  const knownKeywords = zonesData.flatMap(z => z.keywords);
  [...workingEmps, ...vacantEmps].forEach(emp => {
    const officeName = emp.officeName?.toUpperCase() || "";
    const z = emp.zone?.toUpperCase() || "";
    const c = emp.circle?.toUpperCase() || "";
    const fullText = officeName + " " + z + " " + c;
    if (fullText.trim() && !knownKeywords.some(kw => fullText.includes(kw))) {
      let prettyName = [emp.officeName, emp.zone, emp.circle].filter(Boolean)[0] || "Other";
      if (!zonesData.some(zd => zd.name === prettyName)) {
        const insertIdx = zonesData.findIndex(zd => zd.name === "UP SLDC LTD.");
        zonesData.splice(insertIdx > -1 ? insertIdx : 14, 0, { name: prettyName, s: 0, keywords: [prettyName.toUpperCase()] });
        knownKeywords.push(prettyName.toUpperCase());
      }
    }
  });

  // Calculate working per zone and vacancy breakdown
  const calculateData = (zone) => {
    let totalW = 0;
    let totalWSanctioned = 0;

    workingEmps.forEach(emp => {
      const officeName = emp.officeName?.toUpperCase() || '';
      const z = emp.zone?.toUpperCase() || '';
      const c = emp.circle?.toUpperCase() || '';
      const fullText = `${officeName} ${z} ${c}`;
      if (zone.keywords.some(kw => fullText.includes(kw))) {
        if (!(zone.exclude && zone.exclude.some(ex => fullText.includes(ex)))) {
          totalW++;
          if (emp.isSanctioned !== false) {
            totalWSanctioned++;
          }
        }
      }
    });

    let vRegular = 0, vTC = 0, vAttached = 0, vRemarks = 0;

    vacantEmps.forEach(emp => {
      const officeName = emp.officeName?.toUpperCase() || '';
      const z = emp.zone?.toUpperCase() || '';
      const c = emp.circle?.toUpperCase() || '';
      const fullText = `${officeName} ${z} ${c}`;
      
      if (zone.keywords.some(kw => fullText.includes(kw))) {
        if (zone.exclude && zone.exclude.some(ex => fullText.includes(ex))) {
           return;
        }
        const isFieldZone = ['Central-Lucknow', 'South-East, Prayagraj', 'West-Meerut', 'South-West, Agra', 'North-East, Gorakhpur', 'South-Central, Jhansi', 'Civil-I, Lucknow', 'Civil-II, Lucknow'].includes(zone.name);
        if (officeName.includes('TO CE') || officeName.includes('TO DIR') || officeName.includes('(A)') || officeName.includes('ATTACHED') || officeName.includes('TO DIRECTOR') || officeName.includes('TO SE') || officeName.includes('TO S.E.')) {
          vAttached++;
        } else if (c.includes('TESTING') || c.includes('T&C') || c.includes('COMMISSIONING')) {
          vTC++;
        } else if (c.includes('TRANSMISSION CIRCLE') || c.includes('400 KV') || c.includes('765') || c.includes('CIVIL')) {
          vRegular++;
        } else {
          if (!isFieldZone && zone.name !== 'UP SLDC LTD.') {
            vAttached++;
          } else {
            vRemarks++;
          }
        }
      }
    });

    return { totalW, totalWSanctioned, vRegular, vTC, vAttached, vRemarks, vTotalCalc: vRegular + vTC + vAttached + vRemarks };
  };

  const rows = zonesData.map((z, idx) => {
    let { totalW, totalWSanctioned, vRegular, vTC, vAttached, vRemarks, vTotalCalc } = calculateData(z);
    if (z.s === 0 && (totalWSanctioned > 0 || vTotalCalc > 0)) {
      z.s = totalWSanctioned + (vTotalCalc || 0);
    }
    const v = z.s - totalW;
    const displayV = v;
    const vPercent = z.s > 0 ? ((displayV / z.s) * 100).toFixed(1) : '0.0';

    // Special zone overrides to force all vacancies into specific columns
    if (z.name === 'C&C, Lucknow') {
      vRegular = displayV;
      vTC = 0; vAttached = 0; vRemarks = 0;
    } else if (z.name === 'D&P, Lucknow' || z.name === '765 kV, Design Unit, Lucknow' || z.name === 'Circle to be Created') {
      vAttached = displayV;
      vRegular = 0; vTC = 0; vRemarks = 0;
    } else {
      // Ensure the breakdown sums up to the total calculated vacancy (v)
      const unaccounted = displayV - (vRegular + vTC + vAttached + vRemarks);
      if (unaccounted !== 0) {
        if (unaccounted < 0) {
          vRemarks += Math.abs(unaccounted); // Show surplus as positive 'Extra' count
        } else {
          const isFieldZone = ['Central-Lucknow', 'South-East, Prayagraj', 'West-Meerut', 'South-West, Agra', 'North-East, Gorakhpur', 'South-Central, Jhansi', 'Civil-I, Lucknow', 'Civil-II, Lucknow'].includes(z.name);
          if (!isFieldZone && z.name !== 'UP SLDC LTD.') {
            vAttached += unaccounted; // HQ Sanctioned posts go to Attached
          } else {
            vRegular += unaccounted; // Field Default put missing vacancies in Regular Circle instead of Extra
          }
        }
      }
    }

    return {
      ...z,
      w: totalW,
      v: displayV,
      vPercent,
      vRegular: vRegular > 0 ? vRegular : '-',
      vTC: vTC > 0 ? vTC : '-',
      vAttached: vAttached > 0 ? vAttached : '-',
      vRemarks: vRemarks > 0 ? vRemarks : '-'
    };
  });

  // Totals and Filtering
  const sldcIdx = rows.findIndex(r => r.name === "UP SLDC LTD.");
  const emZoneRowsRaw = rows.slice(0, sldcIdx > -1 ? sldcIdx : 14).filter(row => row.s > 0 || row.w > 0);
  const emZoneRows = emZoneRowsRaw.map((row, idx) => ({ ...row, srNo: idx + 1 }));
  
  const sldcRow = rows[sldcIdx > -1 ? sldcIdx : 14];
  
  const civilRowsRaw = rows.slice((sldcIdx > -1 ? sldcIdx : 14) + 1).filter(row => row.s > 0 || row.w > 0);
  const civilRows = civilRowsRaw.map((row, idx) => ({ ...row, srNo: idx + 1 }));

  const parseVal = (val) => val === '-' ? 0 : val;

  const emTotalS = emZoneRows.reduce((a, b) => a + b.s, 0);
  const emTotalW = emZoneRows.reduce((a, b) => a + b.w, 0);
  const emTotalV = emZoneRows.reduce((a, b) => a + b.v, 0);
  const emTotalReg = emZoneRows.reduce((a, b) => a + parseVal(b.vRegular), 0);
  const emTotalTC = emZoneRows.reduce((a, b) => a + parseVal(b.vTC), 0);
  const emTotalAtt = emZoneRows.reduce((a, b) => a + parseVal(b.vAttached), 0);
  const emTotalRem = emZoneRows.reduce((a, b) => a + parseVal(b.vRemarks), 0);

  const grandEmTotalS = emTotalS + sldcRow.s;
  const grandEmTotalW = emTotalW + sldcRow.w;
  const grandEmTotalV = emTotalV + sldcRow.v;
  const grandEmTotalReg = emTotalReg + parseVal(sldcRow.vRegular);
  const grandEmTotalTC = emTotalTC + parseVal(sldcRow.vTC);
  const grandEmTotalAtt = emTotalAtt + parseVal(sldcRow.vAttached);
  const grandEmTotalRem = emTotalRem + parseVal(sldcRow.vRemarks);

  const cTotalS = civilRows.reduce((a, b) => a + b.s, 0);
  const cTotalW = civilRows.reduce((a, b) => a + b.w, 0);
  const cTotalV = civilRows.reduce((a, b) => a + b.v, 0);
  const cTotalReg = civilRows.reduce((a, b) => a + parseVal(b.vRegular), 0);
  const cTotalTC = civilRows.reduce((a, b) => a + parseVal(b.vTC), 0);
  const cTotalAtt = civilRows.reduce((a, b) => a + parseVal(b.vAttached), 0);
  const cTotalRem = civilRows.reduce((a, b) => a + parseVal(b.vRemarks), 0);

  const gTotalS = grandEmTotalS + cTotalS;
  const gTotalW = grandEmTotalW + cTotalW;
  const gTotalV = grandEmTotalV + cTotalV;
  const gTotalReg = grandEmTotalReg + cTotalReg;
  const gTotalTC = grandEmTotalTC + cTotalTC;
  const gTotalAtt = grandEmTotalAtt + cTotalAtt;
  const gTotalRem = grandEmTotalRem + cTotalRem;

  return (
    <div className="container-fluid p-4 print-report-page" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="bg-white p-0 shadow-sm rounded border border-dark">
        <div className="text-center pt-3 pb-2 border-bottom border-dark position-relative">
          <h3 className="mb-0 fw-bold text-decoration-underline" style={{ fontFamily: 'Times New Roman', letterSpacing: '0.5px' }}>
            {t('EE (E&M/Civil) Vacancy Details')}
          </h3>
        </div>
        
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-dark">
          <div>
            <button className="btn btn-outline-dark btn-sm no-print" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print
            </button>
          </div>
          <span className="fw-bold fst-italic" style={{ fontFamily: 'Times New Roman' }}>
            {t('Date :-')} {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
          </span>
        </div>

        <div className="table-responsive shadow-sm rounded border border-dark mb-4">
          <table className="table table-hover table-bordered table-sm align-middle text-center mb-0 border-dark" style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.95rem' }}>
            <thead style={{ backgroundColor: '#1e3a8a', color: '#ffffff', borderBottom: '3px solid #000' }}>
              <tr>
                <th rowSpan="2" style={{ width: '4%', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: t('Sr. No.').replace(' ', '<br/>') }}></th>
                <th rowSpan="2" style={{ width: '22%', verticalAlign: 'middle' }}>{t('Name of Zone')}</th>
                <th rowSpan="2" style={{ width: '4%', verticalAlign: 'middle' }}>S</th>
                <th rowSpan="2" style={{ width: '4%', verticalAlign: 'middle' }}>W</th>
                <th rowSpan="2" style={{ width: '4%', verticalAlign: 'middle' }}>V</th>
                <th rowSpan="2" style={{ width: '6%', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: t('% V Shortfall').replace(' ', '<br/>') }}></th>
                <th colSpan="4">{t('Vacancy')}</th>
              </tr>
              <tr>
                <th style={{ width: '9%' }} dangerouslySetInnerHTML={{ __html: t('Regular Division').replace(' ', '<br/>') }}></th>
                <th style={{ width: '9%' }} dangerouslySetInnerHTML={{ __html: t('T&C Division').replace(' ', '<br/>') }}></th>
                <th style={{ width: '9%' }}>{t('Attached')}</th>
                <th style={{ width: '9%' }} dangerouslySetInnerHTML={{ __html: t('Remarks (Extra)').replace(' ', '<br/>') }}></th>
              </tr>
            </thead>
            <tbody>
              {emZoneRows.map((row) => (
                <tr key={row.srNo}>
                  <td className="fw-bold">{row.srNo}</td>
                  <td className="text-start ps-2">{t(row.name)}</td>
                  <td>{row.s}</td>
                  <td>{row.w}</td>
                  <td>{row.v}</td>
                  <td className="fw-bold">{row.vPercent}</td>
                  <td>{row.vRegular}</td>
                  <td>{row.vTC}</td>
                  <td>{row.vAttached}</td>
                  <td>{row.vRemarks}</td>
                </tr>
              ))}
              
              {/* E&M Total */}
              <tr className="fw-bold table-active">
                <td colSpan="2" className="text-end pe-2">{t('Total')}</td>
                <td>{emTotalS}</td>
                <td>{emTotalW}</td>
                <td>{emTotalV}</td>
                <td>{emTotalS > 0 ? ((emTotalV / emTotalS) * 100).toFixed(1) : '0.0'}</td>
                <td>{emTotalReg > 0 ? emTotalReg : '-'}</td>
                <td>{emTotalTC > 0 ? emTotalTC : '-'}</td>
                <td>{emTotalAtt > 0 ? emTotalAtt : '-'}</td>
                <td>{emTotalRem > 0 ? emTotalRem : '-'}</td>
              </tr>

              {/* SLDC */}
              <tr className="table-primary">
                <td className="fw-bold">1</td>
                <td className="text-start ps-2">{t(sldcRow.name)}</td>
                <td>{sldcRow.s}</td>
                <td>{sldcRow.w}</td>
                <td>{sldcRow.v}</td>
                <td className="fw-bold">{sldcRow.vPercent}</td>
                <td>{sldcRow.vRegular}</td>
                <td>{sldcRow.vTC}</td>
                <td>{sldcRow.vAttached}</td>
                <td>{sldcRow.vRemarks}</td>
              </tr>

              {/* Grand Total E&M */}
              <tr className="fw-bold table-secondary">
                <td colSpan="2" className="text-end pe-2">{t('Grand Total (E&M)')}</td>
                <td>{grandEmTotalS}</td>
                <td>{grandEmTotalW}</td>
                <td>{grandEmTotalV}</td>
                <td>{grandEmTotalS > 0 ? ((grandEmTotalV / grandEmTotalS) * 100).toFixed(1) : '0.0'}</td>
                <td>{grandEmTotalReg > 0 ? grandEmTotalReg : '-'}</td>
                <td>{grandEmTotalTC > 0 ? grandEmTotalTC : '-'}</td>
                <td>{grandEmTotalAtt > 0 ? grandEmTotalAtt : '-'}</td>
                <td>{grandEmTotalRem > 0 ? grandEmTotalRem : '-'}</td>
              </tr>
              
              {/* Civil Rows */}
              {civilRows.map((row, idx) => (
                <tr key={row.srNo}>
                  <td className="fw-bold">{idx + 1}</td>
                  <td className="text-start ps-2">{t(row.name)}</td>
                  <td>{row.s}</td>
                  <td>{row.w}</td>
                  <td>{row.v}</td>
                  <td className="fw-bold">{row.vPercent}</td>
                  <td>{row.vRegular}</td>
                  <td>{row.vTC}</td>
                  <td>{row.vAttached}</td>
                  <td>{row.vRemarks}</td>
                </tr>
              ))}
              
              {/* Civil Total */}
              <tr className="fw-bold table-active">
                <td colSpan="2" className="text-end pe-2">{t('Total (Civil)')}</td>
                <td>{cTotalS}</td>
                <td>{cTotalW}</td>
                <td>{cTotalV}</td>
                <td>{cTotalS > 0 ? ((cTotalV / cTotalS) * 100).toFixed(1) : '0.0'}</td>
                <td>{cTotalReg > 0 ? cTotalReg : '-'}</td>
                <td>{cTotalTC > 0 ? cTotalTC : '-'}</td>
                <td>{cTotalAtt > 0 ? cTotalAtt : '-'}</td>
                <td>{cTotalRem > 0 ? cTotalRem : '-'}</td>
              </tr>
              
              {/* Transco. + SLDC GRAND TOTAL */}
              <tr className="fw-bold table-dark text-white">
                <td colSpan="2" className="text-end pe-2">{t('Total (E&M+Civil)')}</td>
                <td>{gTotalS}</td>
                <td>{gTotalW}</td>
                <td>{gTotalV}</td>
                <td>{gTotalS > 0 ? ((gTotalV / gTotalS) * 100).toFixed(1) : '0.0'}</td>
                <td>{gTotalReg > 0 ? gTotalReg : '-'}</td>
                <td>{gTotalTC > 0 ? gTotalTC : '-'}</td>
                <td>{gTotalAtt > 0 ? gTotalAtt : '-'}</td>
                <td>{gTotalRem > 0 ? gTotalRem : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
