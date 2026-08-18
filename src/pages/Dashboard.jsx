import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Briefcase, Building, ShieldAlert } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import janshaktiData from '../data/janshaktiData.json';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployee } from '../contexts/EmployeeContext';
import { useHierarchy } from '../contexts/HierarchyContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const KPICard = ({ title, value, icon: Icon, type = 'primary', onClick }) => (
  <div className={`kpi-card ${type}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-content">
      <h6>{title}</h6>
      <h3>{value}</h3>
    </div>
    <div className="kpi-icon">
      <Icon size={28} />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [showRetirementsModal, setShowRetirementsModal] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const { t, lang } = useLanguage();
  const { employees } = useEmployee();
  const { hierarchyData } = useHierarchy();

  const hierarchyStats = useMemo(() => {
    let zCount = 0;
    let cCount = 0;
    let dCount = 0;
    let emCircles = 0;
    let civilCircles = 0;
    let emDivisions = 0;
    let civilDivisions = 0;
    
    const emZones = [];
    const civilZones = [];
    
    if (hierarchyData && hierarchyData.zones) {
      zCount = hierarchyData.zones.length;
      hierarchyData.zones.forEach(z => {
        const isCivil = z.name.includes('Civil');
        
        let zoneCircles = 0;
        let zoneDivisions = 0;
        const list = [];
        
        if (z.circles) {
          cCount += z.circles.length;
          if (isCivil) civilCircles += z.circles.length;
          else emCircles += z.circles.length;
          
          zoneCircles = z.circles.length;
          
          z.circles.forEach(c => {
            const validDivs = (c.divisions || []).filter(d => !d.startsWith('EE (A)'));
            
            if (validDivs.length === 0) {
              list.push({ circle: c.name, division: '-' });
            } else {
              validDivs.forEach(d => {
                dCount++;
                zoneDivisions++;
                if (isCivil) civilDivisions++;
                else emDivisions++;
                list.push({ circle: c.name, division: d });
              });
            }
          });
        }
        
        const zoneObj = {
          name: z.name,
          circleCount: zoneCircles,
          divisionCount: zoneDivisions,
          list: list
        };
        
        if (isCivil) civilZones.push(zoneObj);
        else emZones.push(zoneObj);
      });
    }
    
    return { zCount, cCount, dCount, emZones, civilZones, emCircles, civilCircles, emDivisions, civilDivisions };
  }, [hierarchyData]);

  useEffect(() => {
    let currentData = JSON.parse(JSON.stringify(janshaktiData));

    // Restore from permanent storage in background
    fetch('http://localhost:8080/')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          localStorage.setItem('uppcl_dashboard_working_data_v2', JSON.stringify(data));
        }
      }).catch(e => console.log('No backup server running'));

    try {
      const raw = localStorage.getItem('uppcl_dashboard_working_data_v2');
      if (raw) {
        const saved = JSON.parse(raw);
        currentData.forEach((d, idx) => {
          if (saved[idx]) {
            if (typeof saved[idx].w === 'number') d.working = saved[idx].w;
            if (saved[idx].h) d.hindi = saved[idx].h;
            if (saved[idx].e) d.english = saved[idx].e;
            if (saved[idx].dist) {
              const dist = saved[idx].dist;
              d.sanctioned = (dist.upptcl_hq?.s || 0) + (dist.upptcl_zone?.s || 0) + (dist.sldc?.s || 0);
            }
          }
        });
      }
    } catch(e) {}
    
    currentData.forEach(d => {
      const normEnglish = d.english.replace(/\s+/g, ' ').trim();
      const getNormDesig = (e) => (e.substantiveDesig || e.desig || '').replace(/\s+/g, ' ').trim();
      const regularWorkingCount = employees.filter(e => {
        if (e.status === 'Retired' || e.status === 'Vacant') return false;
        const nameUpper = (e.name || '').toUpperCase();
        if (nameUpper.includes('VACANT') || nameUpper.includes('RETIRED')) return false;
        return getNormDesig(e) === normEnglish && e.chargeType !== 'Additional' && e.isSanctioned !== false;
      }).length;

      const totalWorkingCount = employees.filter(e => {
        if (e.status === 'Retired' || e.status === 'Vacant') return false;
        const nameUpper = (e.name || '').toUpperCase();
        if (nameUpper.includes('VACANT') || nameUpper.includes('RETIRED')) return false;
        return getNormDesig(e) === normEnglish && e.chargeType !== 'Additional';
      }).length;
      
      if (d.group === 'A' || d.group === 'B') {
        d.working = totalWorkingCount;
      } else {
        d.working = Math.max(d.working || 0, totalWorkingCount);
      }
      d.vacant = (d.sanctioned || 0) - regularWorkingCount;
    });

    setData(currentData);
  }, [employees]);

  const totalSanctioned = data.reduce((acc, curr) => acc + (curr.sanctioned || 0), 0);
  const totalWorking = data.reduce((acc, curr) => acc + (curr.working || 0), 0);
  const totalVacant = data.reduce((acc, curr) => acc + (curr.vacant || (curr.sanctioned - curr.working) || 0), 0);
  const vacancyPercent = totalSanctioned > 0 ? ((totalVacant / totalSanctioned) * 100).toFixed(1) : 0;

  // Calculate Group wise distribution for Pie Chart
  const groupWorking = { A: 0, B: 0, C: 0, D: 0 };
  data.forEach(d => {
    if (d.group && groupWorking[d.group] !== undefined) {
      groupWorking[d.group] += (d.working || 0);
    }
  });

  // Calculate Subgroup wise for Bar Chart
  const subgroups = {};
  data.forEach(d => {
    if (d.subgroup) {
      if (!subgroups[d.subgroup]) subgroups[d.subgroup] = { working: 0, vacant: 0 };
      subgroups[d.subgroup].working += (d.working || 0);
      subgroups[d.subgroup].vacant += (d.vacant || (d.sanctioned - d.working) || 0);
    }
  });
  
  const barLabels = Object.keys(subgroups).slice(0, 5); // top 5
  const barWorking = barLabels.map(l => subgroups[l].working);
  const barVacant = barLabels.map(l => subgroups[l].vacant);

  // Calculate upcoming retirements (Specific rule: 02-07-2026 to 01-07-2027)
  const upcomingRetirementsRaw = employees.filter(e => {
    if (!e.dor || e.status !== 'Active') return false;
    const dorDate = new Date(e.dor);
    const startDate = new Date('2026-07-02');
    const endDate = new Date('2027-07-01');
    return dorDate >= startDate && dorDate <= endDate;
  });
  
  const seenRetirementIds = new Set();
  const upcomingRetirements = [];
  for (const emp of upcomingRetirementsRaw) {
    const idToCheck = emp.internalId && emp.internalId !== 'N/A' ? emp.internalId : (emp.name + (emp.dob || ''));
    if (!seenRetirementIds.has(idToCheck)) {
      seenRetirementIds.add(idToCheck);
      upcomingRetirements.push(emp);
    }
  }

  const upcomingRetirementsCount = upcomingRetirements.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  const barData = {
    labels: barLabels.length > 0 ? barLabels : ['HQ', 'Zone A', 'Zone B', 'Zone C', 'Zone D'],
    datasets: [
      {
        label: t('Working Employees'),
        data: barLabels.length > 0 ? barWorking : [0, 0, 0, 0, 0],
        backgroundColor: '#004085',
      },
      {
        label: t('Vacant Posts'),
        data: barLabels.length > 0 ? barVacant : [0, 0, 0, 0, 0],
        backgroundColor: '#ef4444',
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    }
  };

  const pieData = {
    labels: ['Group A', 'Group B', 'Group C', 'Group D'],
    datasets: [
      {
        data: [groupWorking.A, groupWorking.B, groupWorking.C, groupWorking.D],
        backgroundColor: ['#004085', '#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="print-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <h2 className="fw-bold" style={{ color: 'var(--text-dark)' }}>{t('MD / Director Dashboard')}</h2>
        <button className="btn btn-primary px-4 py-2" style={{ backgroundColor: 'var(--primary-color)', border: 'none' }} onClick={() => window.print()}>
          <i className="fas fa-file-pdf me-2"></i> {t('Generate PDF Report')}
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Total Sanctioned Posts')} value={totalSanctioned} icon={Briefcase} />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Total Working Posts')} value={totalWorking} icon={UserCheck} type="success" />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Total Vacant Posts')} value={totalVacant} icon={UserX} type="danger" />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Vacancy Percentage')} value={`${vacancyPercent}%`} icon={ShieldAlert} type="warning" />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Total Departments')} value={Object.keys(subgroups).length || 0} icon={Building} />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard 
            title="Total - Zone, Circle, Div." 
            value={
              <div className="d-flex align-items-center mt-2" style={{ gap: '15px' }}>
                <div className="text-center border-end pe-3">
                  <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '-3px'}}>Zone</div>
                  <div style={{fontSize: '1.4rem'}} className="fw-bold">{hierarchyStats.zCount}</div>
                </div>
                <div className="text-center border-end pe-3">
                  <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '-3px'}}>Circle</div>
                  <div style={{fontSize: '1.4rem'}} className="fw-bold">{hierarchyStats.cCount}</div>
                </div>
                <div className="text-center">
                  <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '-3px'}}>Div</div>
                  <div style={{fontSize: '1.4rem'}} className="fw-bold">{hierarchyStats.dCount}</div>
                </div>
              </div>
            } 
            icon={Building} 
            type="primary"
            onClick={() => setShowHierarchyModal(true)} 
          />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard title={t('Total Employees')} value={totalWorking} icon={Users} />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard 
            title={lang === 'hi' ? 'अतिरिक्त कार्यभार' : 'Additional Charges'} 
            value={employees.filter(e => e.chargeType === 'Additional' && e.name.toUpperCase() !== 'VACANT').length} 
            icon={Briefcase} 
            type="info" 
            onClick={() => navigate('/reports', { state: { filter: 'se_additional', autoPrint: true } })} 
          />
        </div>
        <div className="col-md-4 col-lg-3">
          <KPICard 
            title={t('Upcoming Retirements')} 
            value={upcomingRetirementsCount} 
            icon={Users} 
            type="warning" 
            onClick={() => setShowRetirementsModal(true)} 
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="chart-card">
            <h5>{t('Office-wise Statistics (Working vs Vacant)')}</h5>
            <div style={{ height: '350px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h5>{t('Employee Distribution (By Group)')}</h5>
            <div style={{ height: '350px', display: 'flex', justifyContent: 'center' }}>
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy List Modal */}
      {showHierarchyModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header d-print-none text-white" style={{ background: 'var(--primary-color)' }}>
                <h5 className="modal-title">Total - Zone ({hierarchyStats.zCount}), Circle ({hierarchyStats.cCount}), Division ({hierarchyStats.dCount})</h5>
                <div>
                  <button className="btn btn-light btn-sm me-2 fw-bold px-3" onClick={() => window.print()}>
                    <i className="fas fa-print me-2"></i> Print
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowHierarchyModal(false)}></button>
                </div>
              </div>
              <div className="modal-body p-4" id="hierarchyPrintArea">
                <style>
                  {`
                    @media print {
                      @page { size: A4 portrait; margin: 10mm; }
                      body { background: white; -webkit-print-color-adjust: exact; }
                      .print-dashboard > :not(.modal) { display: none !important; }
                      .modal { position: relative !important; display: block !important; background: transparent !important; padding: 0 !important; }
                      .modal-dialog { display: block !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; transform: none !important; }
                      .modal-content { border: none !important; box-shadow: none !important; background: transparent !important; }
                      .modal-backdrop { display: none !important; }
                      .modal-header { display: none !important; }
                      .modal-body { padding: 0 !important; overflow: visible !important; }
                      .table-responsive { overflow: visible !important; }
                      table { page-break-inside: auto; font-size: 10pt; }
                      tr { page-break-inside: avoid; page-break-after: auto; }
                      thead { display: table-header-group; }
                      tfoot { display: table-footer-group; }
                    }
                  `}
                </style>
                <div className="table-responsive">
                  
                  {/* E&M Section */}
                  <div className="text-center mb-4">
                    <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-color)' }}>No. of Circle and Division in UPPTCL (E&M)</h4>
                    <h6 className="fw-bold text-muted">Total - Zones: {hierarchyStats.emZones.length} | Circles: {hierarchyStats.emCircles} | Divisions: {hierarchyStats.emDivisions}</h6>
                  </div>
                  
                  {hierarchyStats.emZones.map((z, idx) => (
                    <div key={idx} className="mb-4">
                      <h6 className="fw-bold bg-light p-2 border border-bottom-0 mb-0 d-flex justify-content-between" style={{ color: 'black', fontSize: '15px', pageBreakAfter: 'avoid' }}>
                        <span>{z.name}</span>
                        <span>Circles: {z.circleCount < 10 ? `0${z.circleCount}` : z.circleCount} &nbsp;&nbsp;&nbsp;&nbsp; Divisions: {z.divisionCount < 10 ? `0${z.divisionCount}` : z.divisionCount}</span>
                      </h6>
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{width: '6%'}} className="text-center">#</th>
                            <th style={{width: '47%'}}>Circle</th>
                            <th style={{width: '47%'}}>Division</th>
                          </tr>
                        </thead>
                        <tbody>
                          {z.list.map((item, i) => (
                            <tr key={i}>
                              <td className="text-muted fw-bold text-center">{i + 1}</td>
                              <td className="fw-bold text-dark">{item.circle}</td>
                              <td className="text-primary fw-bold">{item.division}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  {/* Civil Section */}
                  <div style={{ pageBreakBefore: 'always' }} className="mt-5 mb-4 text-center">
                    <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-color)' }}>No. of Circle and Division in UPPTCL (Civil)</h4>
                    <h6 className="fw-bold text-muted">Total - Zones: {hierarchyStats.civilZones.length} | Circles: {hierarchyStats.civilCircles} | Divisions: {hierarchyStats.civilDivisions}</h6>
                  </div>
                  
                  {hierarchyStats.civilZones.map((z, idx) => (
                    <div key={idx} className="mb-4">
                      <h6 className="fw-bold bg-light p-2 border border-bottom-0 mb-0 d-flex justify-content-between" style={{ color: 'black', fontSize: '15px', pageBreakAfter: 'avoid' }}>
                        <span>{z.name}</span>
                        <span>Circles: {z.circleCount < 10 ? `0${z.circleCount}` : z.circleCount} &nbsp;&nbsp;&nbsp;&nbsp; Divisions: {z.divisionCount < 10 ? `0${z.divisionCount}` : z.divisionCount}</span>
                      </h6>
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{width: '6%'}} className="text-center">#</th>
                            <th style={{width: '47%'}}>Circle</th>
                            <th style={{width: '47%'}}>Division</th>
                          </tr>
                        </thead>
                        <tbody>
                          {z.list.map((item, i) => (
                            <tr key={i}>
                              <td className="text-muted fw-bold text-center">{i + 1}</td>
                              <td className="fw-bold text-dark">{item.circle}</td>
                              <td className="text-primary fw-bold">{item.division}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRetirementsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header d-print-none text-white" style={{ background: 'var(--primary-color)' }}>
                <h5 className="modal-title">{lang === 'hi' ? 'दिनांक 02-07-2026 से दिनांक 01-07-2027 के मध्य 60 वर्ष की अधिवर्षता पूर्ण करने वाले अधिकारियों की सूची' : 'List of officers completing 60 years of superannuation between 02-07-2026 and 01-07-2027'}</h5>
                <div className="d-flex gap-3 align-items-center">
                  <button type="button" className="btn btn-light btn-sm px-3 fw-bold d-flex align-items-center gap-2" onClick={() => window.print()}>
                    <i className="fas fa-print"></i> {lang === 'hi' ? 'प्रिंट करें' : 'Print'}
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowRetirementsModal(false)}></button>
                </div>
              </div>
              
              <style>
                {`
                  @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; background: white; }
                    /* Hide EVERYTHING */
                    body * { visibility: hidden !important; }
                    /* Show only modal and its children */
                    .modal.show, .modal.show * { visibility: visible !important; }
                    
                    /* Reset modal position for printing */
                    .modal.show { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; background: transparent !important; }
                    .modal-dialog { max-width: 100% !important; margin: 0 !important; transform: none !important; }
                    .modal-content { border: none !important; box-shadow: none !important; }
                    .modal-header, .modal-body { padding: 0 !important; }
                    
                    /* Hide non-print items */
                    .d-print-none, .btn-close { display: none !important; }
                    
                    /* Table styling */
                    .table-responsive { overflow: visible !important; }
                    table { width: 100% !important; font-size: 12pt !important; margin-top: 20px !important; }
                    th, td { padding: 6px 8px !important; border: 1px solid #ddd !important; }
                  }
                `}
              </style>

              <div className="modal-body p-4">
                <h4 className="fw-bold d-none d-print-block text-center w-100 mb-4" style={{ color: 'black' }}>
                  {lang === 'hi' ? 'दिनांक 02-07-2026 से दिनांक 01-07-2027 के मध्य 60 वर्ष की अधिवर्षता पूर्ण करने वाले अधिकारियों की सूची' : 'List of officers completing 60 years of superannuation between 02-07-2026 and 01-07-2027'}
                </h4>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>{lang === 'hi' ? 'ज़ोन' : 'Zone'}</th>
                        <th>{lang === 'hi' ? 'ऑफिस / सर्किल' : 'Office / Circle'}</th>
                        <th>{lang === 'hi' ? 'नाम' : 'Name'}</th>
                        <th>{lang === 'hi' ? 'SAP आईडी' : 'SAP ID'}</th>
                        <th>{lang === 'hi' ? 'जन्मतिथि' : 'DOB'}</th>
                        <th>{lang === 'hi' ? 'सेवानिवृत्ति तिथि' : 'DOR'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingRetirements.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">{lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No employees found'}</td></tr>
                      ) : upcomingRetirements.map(emp => (
                        <tr key={emp.id}>
                          <td className="fw-bold text-dark">{emp.zone || '-'}</td>
                          <td>{[emp.circle, emp.division, emp.officeName].filter(Boolean).join(', ')}</td>
                          <td className="fw-bold">{emp.name}</td>
                          <td className="text-primary fw-bold">{emp.internalId === 'N/A' ? '' : emp.internalId}</td>
                          <td>{formatDate(emp.dob) || '-'}</td>
                          <td>{formatDate(emp.dor) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
