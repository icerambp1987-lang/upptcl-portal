import React, { useState, useEffect } from 'react';
import { Building2, Search, Download, Edit2, X, Save, AlertCircle } from 'lucide-react';
import janshaktiData from '../data/janshaktiData.json';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployee } from '../contexts/EmployeeContext';

const Establishment = () => {
  const [data, setData] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedOffice, setSelectedOffice] = useState('All');
  const { t, lang } = useLanguage();
  const { employees } = useEmployee();

  // Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [dist, setDist] = useState({
    upptcl_hq: { s: 0, w: 0 },
    upptcl_zone: { s: 0, w: 0 },
    sldc: { s: 0, w: 0 }
  });

  const loadData = () => {
    let currentData = JSON.parse(JSON.stringify(janshaktiData));
    try {
      const raw = localStorage.getItem('uppcl_dashboard_working_data_v2');
      if (raw) {
        const saved = JSON.parse(raw);
        currentData.forEach((d, idx) => {
          if (saved[idx]) {
            if (typeof saved[idx].w === 'number') d.working = saved[idx].w;
            if (saved[idx].h) d.hindi = saved[idx].h;
            if (saved[idx].e) d.english = saved[idx].e;
            if (saved[idx].dist) d.distribution = saved[idx].dist;
          }
        });
      }
    } catch(e) {}
    
    // Set default distribution if not exists
    currentData.forEach(d => {
      if (!d.distribution) {
        d.distribution = {
          upptcl_hq: { s: d.sanctioned || 0, w: d.working || 0 },
          upptcl_zone: { s: 0, w: 0 },
          sldc: { s: 0, w: 0 }
        };
      }
      
      // Dynamically calculate working from employees context
      const normEnglish = d.english.replace(/\s+/g, ' ').trim();
      const getNormDesig = (e) => (e.substantiveDesig || e.desig || '').replace(/\s+/g, ' ').trim();
      
      const isValidWorkingEmp = (e) => {
        if (e.status === 'Retired' || e.status === 'Vacant') return false;
        const nameUpper = (e.name || '').toUpperCase();
        if (nameUpper.includes('VACANT') || nameUpper.includes('RETIRED')) return false;
        return getNormDesig(e) === normEnglish && e.chargeType !== 'Additional';
      };

      const empHq = employees.filter(e => isValidWorkingEmp(e) && e.dept === 'UPPTCL' && e.office === 'HQ').length;
      const empZone = employees.filter(e => isValidWorkingEmp(e) && e.dept === 'UPPTCL' && e.office === 'ZONE').length;
      const empSldc = employees.filter(e => isValidWorkingEmp(e) && e.dept === 'UP SLDC LTD.').length;
      
      if (d.group === 'A' || d.group === 'B') {
        d.distribution.upptcl_hq.w = empHq;
        d.distribution.upptcl_zone.w = empZone;
        d.distribution.sldc.w = empSldc;
      } else {
        d.distribution.upptcl_hq.w = Math.max(d.distribution.upptcl_hq.w || 0, empHq);
        d.distribution.upptcl_zone.w = Math.max(d.distribution.upptcl_zone.w || 0, empZone);
        d.distribution.sldc.w = Math.max(d.distribution.sldc.w || 0, empSldc);
      }
      
      d.working = (d.distribution.upptcl_hq.w || 0) + (d.distribution.upptcl_zone.w || 0) + (d.distribution.sldc.w || 0);
    });
    
    setData(currentData);
  };

  useEffect(() => {
    loadData();
  }, [employees]);

  const handleEditClick = (row) => {
    setEditingRow(row);
    setDist(JSON.parse(JSON.stringify(row.distribution)));
  };

  const handleDistChange = (dept, field, value) => {
    const val = parseInt(value) || 0;
    setDist(prev => ({
      ...prev,
      [dept]: { ...prev[dept], [field]: val }
    }));
  };

  const saveEdit = () => {
    if (!editingRow) return;
    try {
      const raw = localStorage.getItem('uppcl_dashboard_working_data_v2');
      let saved = raw ? JSON.parse(raw) : {};
      const idx = editingRow.originalIndex;
      if (!saved[idx]) saved[idx] = {};
      
      saved[idx].dist = dist;
      const jsonStr = JSON.stringify(saved);
      localStorage.setItem('uppcl_dashboard_working_data_v2', jsonStr);
      
      // Save to permanent file storage via capture server
      fetch('http://localhost:8080/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr
      }).catch(e => console.error('Failed to sync distribution:', e));
      
      loadData();
      setEditingRow(null);
    } catch(e) {
      console.error(e);
    }
  };

  const processedData = data.map((row, index) => ({ ...row, originalIndex: index }));
  
  // Transform data based on selection to show distributed numbers
  const displayData = processedData.map(row => {
    let s = 0, w = 0;
    
    if (selectedDept === 'All') {
      // Sum all distributed values instead of original totals, in case they changed it
      s = row.distribution.upptcl_hq.s + row.distribution.upptcl_zone.s + row.distribution.sldc.s;
      w = row.distribution.upptcl_hq.w + row.distribution.upptcl_zone.w + row.distribution.sldc.w;
    } else if (selectedDept === 'UP SLDC LTD.') {
      s = row.distribution.sldc.s;
      w = row.distribution.sldc.w;
    } else if (selectedDept === 'UPPTCL') {
      if (selectedOffice === 'All') {
        s = row.distribution.upptcl_hq.s + row.distribution.upptcl_zone.s;
        w = row.distribution.upptcl_hq.w + row.distribution.upptcl_zone.w;
      } else if (selectedOffice === 'HQ') {
        s = row.distribution.upptcl_hq.s;
        w = row.distribution.upptcl_hq.w;
      } else if (selectedOffice === 'ZONE') {
        s = row.distribution.upptcl_zone.s;
        w = row.distribution.upptcl_zone.w;
      }
    }
    
    return { ...row, display_s: s, display_w: w, display_v: s - w };
  }).filter(row => row.display_s > 0 || row.display_w > 0); // only show rows that have some allocation

  // Validation logic for modal
  const distTotalS = editingRow ? dist.upptcl_hq.s + dist.upptcl_zone.s + dist.sldc.s : 0;
  const distTotalW = editingRow ? dist.upptcl_hq.w + dist.upptcl_zone.w + dist.sldc.w : 0;
  const isInvalidS = editingRow && distTotalS !== editingRow.sanctioned;
  const isInvalidW = editingRow && distTotalW !== editingRow.working;

  const renderTableRows = () => {
    const groupedData = { 'A': [], 'B': [], 'C': [], 'D': [], 'Others': [] };
    let grandTotalS = 0;
    let grandTotalW = 0;
    let grandTotalV = 0;

    displayData.forEach(row => {
      grandTotalS += row.display_s;
      grandTotalW += row.display_w;
      grandTotalV += row.display_v;
      let g = row.group;
      if (!g || !groupedData[g]) g = 'Others';
      groupedData[g].push(row);
    });

    const rows = [];
    ['A', 'B', 'C', 'D', 'Others'].forEach(g => {
      const groupRows = groupedData[g];
      if (!groupRows || groupRows.length === 0) return;

      let groupTotalS = 0;
      let groupTotalW = 0;
      let groupTotalV = 0;

      groupRows.forEach(row => {
        groupTotalS += row.display_s;
        groupTotalW += row.display_w;
        groupTotalV += row.display_v;

        const dispDept = selectedDept === 'All' ? 'Mixed' : selectedDept;
        const dispOffice = selectedDept === 'All' ? 'Mixed' : (selectedDept === 'UP SLDC LTD.' ? 'N/A' : (selectedOffice === 'All' ? 'Mixed' : selectedOffice));

        rows.push(
          <tr key={row.originalIndex}>
            <td className="text-start">
              <span className="badge bg-light text-dark border">{dispDept}</span>
            </td>
            <td className="text-start">
              <span className="badge bg-light text-dark border">{dispOffice}</span>
            </td>
            <td className="text-start">{row.subgroup || 'N/A'}</td>
            <td>{row.group ? `Group ${row.group}` : 'N/A'}</td>
            <td className="fw-bold text-start">{lang === 'hi' ? row.hindi : (row.english || row.hindi)}</td>
            <td className="fw-bold text-primary">{row.display_s}</td>
            <td className="fw-bold text-success">{row.display_w}</td>
            <td className="fw-bold text-danger">
              <span className={`badge ${row.display_v > 0 ? 'bg-danger' : 'bg-success'}`}>
                {row.display_v}
              </span>
            </td>
            <td>
              <button className="btn btn-sm btn-light" onClick={() => handleEditClick(row)} title="Split Post Distribution">
                <Edit2 size={16} className="text-muted" />
              </button>
            </td>
          </tr>
        );
      });

      const groupLabel = g === 'Others' ? (lang === 'hi' ? 'अन्य' : 'Others') : `${t('Group')} ${g}`;
      rows.push(
        <tr key={`total-${g}`} className="table-secondary fw-bold">
          <td colSpan="5" className="text-end">{t('Total')} ({groupLabel})</td>
          <td className="text-primary">{groupTotalS}</td>
          <td className="text-success">{groupTotalW}</td>
          <td className="text-danger">{groupTotalV}</td>
          <td></td>
        </tr>
      );
    });

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="text-center py-4 text-muted">
            No data available for the selected department/office.
          </td>
        </tr>
      );
    }

    rows.push(
      <tr key="grand-total" className="table-dark fw-bold fs-6">
        <td colSpan="5" className="text-end">{t('Grand Total')}</td>
        <td className="text-primary">{grandTotalS}</td>
        <td className="text-success">{grandTotalW}</td>
        <td className="text-danger">{grandTotalV}</td>
        <td></td>
      </tr>
    );

    return rows;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--text-dark)' }}>{t('Establishment Management')}</h2>
        <button className="btn btn-primary px-4" style={{ background: 'var(--primary-color)', border: 'none' }}>
          <Building2 size={18} className="me-2" /> {t('Add New Post')}
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 text-center">
            <h6 className="text-muted mb-1">{t('Total Sanctioned')}</h6>
            <h4 className="fw-bold text-primary mb-0">{displayData.reduce((acc, curr) => acc + curr.display_s, 0)}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 text-center">
            <h6 className="text-muted mb-1">{t('Total Working')}</h6>
            <h4 className="fw-bold text-success mb-0">{displayData.reduce((acc, curr) => acc + curr.display_w, 0)}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 text-center">
            <h6 className="text-muted mb-1">{t('Total Vacant')}</h6>
            <h4 className="fw-bold text-danger mb-0">{displayData.reduce((acc, curr) => acc + curr.display_v, 0)}</h4>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex justify-content-between mb-4">
          <div className="d-flex gap-3">
            <div className="input-group" style={{ maxWidth: '250px' }}>
              <span className="input-group-text bg-white"><Search size={18} className="text-muted"/></span>
              <input type="text" className="form-control border-start-0 ps-0" placeholder={t('Search office...')} />
            </div>
            
            <select 
              className="form-select" 
              style={{ maxWidth: '200px' }}
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedOffice('All');
              }}
            >
              <option value="All">All Departments</option>
              <option value="UPPTCL">UPPTCL</option>
              <option value="UP SLDC LTD.">UP SLDC LTD.</option>
            </select>

            {selectedDept === 'UPPTCL' && (
              <select 
                className="form-select" 
                style={{ maxWidth: '200px' }}
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <option value="All">{t('All Offices') || 'All Offices'}</option>
                <option value="ZONE">ZONE</option>
                <option value="HQ">HQ</option>
              </select>
            )}

          </div>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <Download size={18} /> {t('Export')}
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle table-bordered">
            <thead className="table-light text-center">
              <tr>
                <th>{t('Department')}</th>
                <th>{t('Office')}</th>
                <th>{t('Subgroup')}</th>
                <th>{t('Cadre')}</th>
                <th>{t('Designation')}</th>
                <th className="text-primary">{t('Sanctioned')}</th>
                <th className="text-success">{t('Working')}</th>
                <th className="text-danger">{t('Vacant (Auto)')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Distribution Modal */}
      {editingRow && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom bg-light">
                <h5 className="modal-title fw-bold text-primary">Split Post Distribution</h5>
                <button type="button" className="btn-close" onClick={() => setEditingRow(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded border">
                  <div>
                    <h6 className="fw-bold mb-1">{lang === 'hi' ? editingRow.hindi : editingRow.english}</h6>
                    <span className="text-muted small">Total Master Counts from Jan Shakti</span>
                  </div>
                  <div className="text-end d-flex gap-3">
                    <div>
                      <span className="d-block small text-muted">Sanctioned</span>
                      <span className="fw-bold fs-5 text-primary">{editingRow.sanctioned}</span>
                    </div>
                    <div>
                      <span className="d-block small text-muted">Working</span>
                      <span className="fw-bold fs-5 text-success">{editingRow.working}</span>
                    </div>
                  </div>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle text-center">
                    <thead className="table-light">
                      <tr>
                        <th>Department & Office</th>
                        <th style={{ width: '150px' }}>Sanctioned (S)</th>
                        <th style={{ width: '150px' }}>Working (W)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-start fw-bold">UPPTCL - HQ</td>
                        <td><input type="number" className="form-control text-center fw-bold text-primary" value={dist.upptcl_hq.s} onChange={e => handleDistChange('upptcl_hq', 's', e.target.value)} min="0" /></td>
                        <td><input type="number" className="form-control text-center fw-bold text-success" value={dist.upptcl_hq.w} onChange={e => handleDistChange('upptcl_hq', 'w', e.target.value)} min="0" /></td>
                      </tr>
                      <tr>
                        <td className="text-start fw-bold">UPPTCL - ZONE</td>
                        <td><input type="number" className="form-control text-center fw-bold text-primary" value={dist.upptcl_zone.s} onChange={e => handleDistChange('upptcl_zone', 's', e.target.value)} min="0" /></td>
                        <td><input type="number" className="form-control text-center fw-bold text-success" value={dist.upptcl_zone.w} onChange={e => handleDistChange('upptcl_zone', 'w', e.target.value)} min="0" /></td>
                      </tr>
                      <tr>
                        <td className="text-start fw-bold">UP SLDC LTD.</td>
                        <td><input type="number" className="form-control text-center fw-bold text-primary" value={dist.sldc.s} onChange={e => handleDistChange('sldc', 's', e.target.value)} min="0" /></td>
                        <td><input type="number" className="form-control text-center fw-bold text-success" value={dist.sldc.w} onChange={e => handleDistChange('sldc', 'w', e.target.value)} min="0" /></td>
                      </tr>
                    </tbody>
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td className="text-end">Distributed Total:</td>
                        <td className={isInvalidS ? 'text-danger' : 'text-success'}>
                          {distTotalS} {isInvalidS && <AlertCircle size={14} className="ms-1"/>}
                        </td>
                        <td className={isInvalidW ? 'text-danger' : 'text-success'}>
                          {distTotalW} {isInvalidW && <AlertCircle size={14} className="ms-1"/>}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {(isInvalidS || isInvalidW) && (
                  <div className="alert alert-danger py-2 small mb-0 d-flex align-items-center gap-2">
                    <AlertCircle size={16} /> 
                    <span>The distributed totals must exactly match the master counts ({editingRow.sanctioned} Sanctioned, {editingRow.working} Working) before saving!</span>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingRow(null)}>Cancel</button>
                <button type="button" className="btn btn-primary d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--primary-color)' }} onClick={saveEdit} disabled={isInvalidS || isInvalidW}>
                  <Save size={16} /> Save Distribution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Establishment;
