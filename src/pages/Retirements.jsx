import React, { useState } from 'react';
import { Search, Download, UserX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployee } from '../contexts/EmployeeContext';

const Retirements = () => {
  const { t, lang } = useLanguage();
  const { employees } = useEmployee();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for remarks
  const [remarksMap, setRemarksMap] = useState({});

  const handleRemarkChange = (id, val) => {
    setRemarksMap(prev => ({ ...prev, [id]: val }));
  };

  // Filter employees who are separated (status is not Active and not Vacant)
  const allSeparated = employees.filter(emp => 
    emp.status && emp.status !== 'Active' && emp.status !== 'Vacant' && (emp.name && emp.name.toUpperCase() !== 'VACANT')
  );

  // Remove duplicates (e.g. if someone had Additional charge, they'd have two retired records)
  const seenIds = new Set();
  const separatedEmployees = [];
  for (const emp of allSeparated) {
    if (!seenIds.has(emp.internalId) || emp.internalId === 'N/A') {
      if (emp.internalId !== 'N/A') seenIds.add(emp.internalId);
      separatedEmployees.push(emp);
    }
  }

  const filteredEmployees = separatedEmployees.filter(emp => {
    const s = searchTerm.toLowerCase();
    return (emp.name || '').toLowerCase().includes(s) || 
           (emp.internalId || '').toLowerCase().includes(s) ||
           (emp.zone || '').toLowerCase().includes(s);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const groupedByZone = {};
  filteredEmployees.forEach(emp => {
    const z = emp.zone || (lang === 'hi' ? 'अन्य' : 'Other');
    if (!groupedByZone[z]) groupedByZone[z] = [];
    groupedByZone[z].push(emp);
  });

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      alert(lang === 'hi' ? 'कोई डाटा नहीं है!' : 'No data available!');
      return;
    }
    const headers = ['Department', 'Status', 'Office', 'Zone', 'Circle', 'Division', 'Subdivision', 'Name', 'SAP ID', 'Date of Posting', 'DOB', 'DOR', 'Remarks'];
    const rows = filteredEmployees.map(emp => {
      return [
        emp.dept || '',
        emp.status || '',
        emp.office || '',
        emp.zone || '',
        emp.circle || '',
        emp.division || '',
        emp.subdivision || '',
        emp.name || '',
        emp.internalId === 'N/A' ? '' : emp.internalId,
        formatDate(emp.doj),
        formatDate(emp.dob),
        formatDate(emp.dor),
        remarksMap[emp.id] || ''
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(item => `"${(item||'').toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Retirements_Separation_List.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="print-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-print-none" style={{ color: 'var(--text-dark)' }}>
          <UserX className="me-2" style={{ color: 'var(--primary-color)' }} />
          {lang === 'hi' ? 'सेवानिवृत्ति / सेपरेशन (Retirements / Separation)' : 'Retirements / Separation'}
        </h2>
        <h2 className="fw-bold d-none d-print-block text-center w-100 mb-2" style={{ color: 'var(--text-dark)' }}>
          {lang === 'hi' ? 'सेवानिवृत्ति / सेपरेशन सूची' : 'Retirements / Separation List'}
        </h2>
      </div>

      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; }
            .d-print-none { display: none !important; }
            .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
            .table-responsive { overflow: visible !important; }
            table { width: 100% !important; font-size: 12pt !important; }
            th, td { padding: 4px 8px !important; }
            input.form-control { border: none !important; background: transparent !important; }
            .mb-4 { margin-bottom: 0.5rem !important; }
          }
        `}
      </style>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex justify-content-between mb-4 d-print-none">
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white"><Search size={18} className="text-muted"/></span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder={t('Search employee...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={handleExportCSV}>
              <Download size={18} /> {t('Export List')}
            </button>
            <button className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2" onClick={() => window.print()} style={{ backgroundColor: 'var(--primary-color)', border: 'none' }}>
              <i className="fas fa-print"></i> {lang === 'hi' ? 'प्रिंट' : 'Print'}
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{lang === 'hi' ? 'ज़ोन' : 'Zone'}</th>
                <th>{lang === 'hi' ? 'ऑफिस / सर्किल' : 'Office / Circle'}</th>
                <th>{t('Name')}</th>
                <th>{t('SAP ID')}</th>
                <th>{t('Date of Posting')}</th>
                <th>{t('DOB')}</th>
                <th>{t('DOR')}</th>
                <th>{t('Status')}</th>
                <th>{lang === 'hi' ? 'रिमार्क (Remarks)' : 'Remarks'}</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedByZone).length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    {lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No employees found'}
                  </td>
                </tr>
              ) : Object.keys(groupedByZone).map(zoneName => (
                <React.Fragment key={zoneName}>
                  <tr className="table-secondary">
                    <td colSpan="9" className="fw-bold py-2">
                      {zoneName} - {lang === 'hi' ? 'कुल' : 'Total'}: {groupedByZone[zoneName].length}
                    </td>
                  </tr>
                  {groupedByZone[zoneName].map(emp => (
                    <tr key={emp.id}>
                      <td className="fw-bold text-dark">{emp.zone || '-'}</td>
                      <td className="text-muted" style={{ maxWidth: '200px' }}>
                        {[emp.circle, emp.division, emp.officeName]
                          .filter(Boolean)
                          .filter(val => !val.toString().includes('Select '))
                          .join(', ')}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-print-none" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {(emp.name || '?').charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold">{emp.name}</div>
                            {lang === 'hi' && emp.nameHi && <div className="text-muted small">{emp.nameHi}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold text-primary">{emp.internalId === 'N/A' ? '' : emp.internalId}</td>
                      <td>{formatDate(emp.doj) || '-'}</td>
                      <td>{formatDate(emp.dob) || '-'}</td>
                      <td>{formatDate(emp.dor) || '-'}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder={lang === 'hi' ? 'रिमार्क लिखें...' : 'Enter remark...'} 
                          value={remarksMap[emp.id] || ''}
                          onChange={(e) => handleRemarkChange(emp.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Retirements;
