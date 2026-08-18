import React, { useState, useEffect } from 'react';
import { useHierarchy } from '../contexts/HierarchyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Trash2, Building, ChevronDown, ChevronRight, Users, Activity, Layers, Lock, Key, ShieldCheck, LogOut } from 'lucide-react';
import EmployeeMaster from './EmployeeMaster';
import JanShakti from './JanShakti';

const AdminPanel = () => {
  const { hierarchyData, addDivision, removeDivision } = useHierarchy();
  const { t, lang } = useLanguage();
  
  // Password protection state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('upptcl_admin_unlocked') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy', 'employees', 'janshakti'
  const [expandedZones, setExpandedZones] = useState({});
  const [expandedCircles, setExpandedCircles] = useState({});
  const [newDivisionData, setNewDivisionData] = useState({ zoneName: '', circleName: '', name: '' });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Default admin password
    if (passwordInput === 'admin123' || passwordInput === 'upptcl@123') {
      setIsUnlocked(true);
      sessionStorage.setItem('upptcl_admin_unlocked', 'true');
      setPasswordError('');
    } else {
      setPasswordError(lang === 'hi' ? 'गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।' : 'Incorrect password! Please enter the valid password.');
    }
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('upptcl_admin_unlocked');
    setPasswordInput('');
  };

  const toggleZone = (zoneName) => {
    setExpandedZones(prev => ({ ...prev, [zoneName]: !prev[zoneName] }));
  };

  const toggleCircle = (circleName) => {
    setExpandedCircles(prev => ({ ...prev, [circleName]: !prev[circleName] }));
  };

  const handleAddDivision = (e) => {
    e.preventDefault();
    if (newDivisionData.zoneName && newDivisionData.circleName && newDivisionData.name.trim()) {
      addDivision(newDivisionData.zoneName, newDivisionData.circleName, newDivisionData.name.trim());
      setNewDivisionData({ ...newDivisionData, name: '' });
      setExpandedCircles(prev => ({ ...prev, [newDivisionData.circleName]: true }));
      setExpandedZones(prev => ({ ...prev, [newDivisionData.zoneName]: true }));
    }
  };

  // If locked, display clean password lock screen
  if (!isUnlocked) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
        <div className="card border-0 shadow-lg rounded-4 p-4 text-center" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="mx-auto mb-3 bg-primary bg-opacity-10 p-3 rounded-circle" style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={36} className="text-primary" />
          </div>
          
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>
            {lang === 'hi' ? 'एडमिन पैनल सुरक्षित है' : 'Admin Panel Locked'}
          </h3>
          <p className="text-muted small mb-4">
            {lang === 'hi' 
              ? 'इस पैनल में मास्टर डेटा व कर्मचारियों के बदलाव हेतु अधिकृत पासवर्ड दर्ज करें।' 
              : 'Please enter the authorized security password to access admin controls.'}
          </p>

          {passwordError && (
            <div className="alert alert-danger py-2 small fw-bold mb-3">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white border-end-0">
                <Key size={18} className="text-muted" />
              </span>
              <input 
                type="password" 
                className="form-control border-start-0 ps-0" 
                placeholder={lang === 'hi' ? 'एडमिन पासवर्ड दर्ज करें...' : 'Enter Admin Password...'}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
              <ShieldCheck size={18} />
              {lang === 'hi' ? 'अनलॉक करें (Unlock)' : 'Unlock Access'}
            </button>
          </form>
          
          <div className="mt-4 pt-3 border-top text-muted small">
            🔒 {lang === 'hi' ? 'केवल अधिकृत अधिकारियों के उपयोग के लिए' : 'For Authorized Personnel Only'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>
            {lang === 'hi' ? 'एडमिन पैनल' : 'Admin Panel'}
          </h2>
          <p className="text-muted small mb-0">
            {lang === 'hi' ? 'मास्टर डेटा, कर्मचारी प्रबंधन एवं जन शक्ति पोर्टल नियंत्रण' : 'Master Data, Employee Management & Manpower Portal Control'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-outline-warning btn-sm fw-semibold rounded-pill px-3 shadow-sm"
            onClick={() => {
              if (window.confirm(lang === 'hi' ? 'क्या आप लोकल डेटा रीसेट करना चाहते हैं?' : 'Reset local cached data?')) {
                localStorage.removeItem('uppcl_employees_data');
                window.location.reload();
              }
            }}
          >
            🧹 {lang === 'hi' ? 'रीसेट (Reset)' : 'Reset'}
          </button>
          <button 
            className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill d-flex align-items-center gap-1 btn btn-sm"
            onClick={async () => {
              try {
                const { ref, get } = await import('firebase/database');
                const { rtdb } = await import('../firebase');
                const snap = await get(ref(rtdb, 'employees'));
                const val = snap.val();
                const list = val ? Object.values(val) : [];
                if (list.length > 0) {
                  localStorage.setItem('uppcl_employees_data', JSON.stringify(list));
                  window.location.reload();
                } else {
                  alert(lang === 'hi' ? 'क्लाउड पर 0 रिकॉर्ड मिले।' : '0 records found in cloud.');
                }
              } catch(e) {
                alert('Cloud Sync Error: ' + e.message);
              }
            }}
            title={lang === 'hi' ? 'क्लाउड से डेटा सिंक करें' : 'Force Sync from Cloud'}
          >
            <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }}></span>
            <span>Google Cloud Live (Sync Now 🔄)</span>
          </button>
          <button 
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-pill shadow-sm"
            onClick={handleLockAdmin}
            title={lang === 'hi' ? 'एडमिन पैनल लॉक करें' : 'Lock Admin Panel'}
          >
            <Lock size={15} />
            {lang === 'hi' ? 'पैनल लॉक करें' : 'Lock Panel'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs inside Admin Panel */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-2 bg-white">
        <ul className="nav nav-pills nav-fill gap-2">
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold py-2 d-flex align-items-center justify-content-center gap-2 ${activeTab === 'hierarchy' ? 'active shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('hierarchy')}
              style={activeTab === 'hierarchy' ? { backgroundColor: 'var(--primary-color)' } : {}}
            >
              <Layers size={18} />
              {lang === 'hi' ? 'मास्टर डेटा (संरचना / Hierarchy)' : 'Master Data (Hierarchy)'}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold py-2 d-flex align-items-center justify-content-center gap-2 ${activeTab === 'employees' ? 'active shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('employees')}
              style={activeTab === 'employees' ? { backgroundColor: 'var(--primary-color)' } : {}}
            >
              <Users size={18} />
              {lang === 'hi' ? 'कर्मचारी मास्टर (Employee Master)' : 'Employee Master'}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold py-2 d-flex align-items-center justify-content-center gap-2 ${activeTab === 'janshakti' ? 'active shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('janshakti')}
              style={activeTab === 'janshakti' ? { backgroundColor: 'var(--primary-color)' } : {}}
            >
              <Activity size={18} />
              {lang === 'hi' ? 'जन शक्ति (Jan Shakti Manpower)' : 'Jan Shakti (Manpower)'}
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Contents */}
      {activeTab === 'hierarchy' && (
        <div className="row">
          <div className="col-md-5">
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="fw-bold mb-0 text-primary"><Building className="me-2" size={20} /> {lang === 'hi' ? 'नया डिविजन जोड़ें' : 'Add New Division'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddDivision}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">{lang === 'hi' ? 'ज़ोन चुनें' : 'Select Zone'}</label>
                    <select 
                      className="form-select" 
                      value={newDivisionData.zoneName}
                      onChange={(e) => setNewDivisionData({ zoneName: e.target.value, circleName: '', name: '' })}
                      required
                    >
                      <option value="">{lang === 'hi' ? 'ज़ोन चुनें...' : 'Select Zone...'}</option>
                      {hierarchyData.zones.map(z => (
                        <option key={z.name} value={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold">{lang === 'hi' ? 'सर्किल चुनें' : 'Select Circle'}</label>
                    <select 
                      className="form-select" 
                      value={newDivisionData.circleName}
                      onChange={(e) => setNewDivisionData({ ...newDivisionData, circleName: e.target.value })}
                      required
                      disabled={!newDivisionData.zoneName}
                    >
                      <option value="">{lang === 'hi' ? 'सर्किल चुनें...' : 'Select Circle...'}</option>
                      {newDivisionData.zoneName && hierarchyData.zones.find(z => z.name === newDivisionData.zoneName)?.circles.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold">{lang === 'hi' ? 'डिविजन का नाम' : 'Division Name'}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Electricity Transmission Division"
                      value={newDivisionData.name}
                      onChange={(e) => setNewDivisionData({ ...newDivisionData, name: e.target.value })}
                      required
                      disabled={!newDivisionData.circleName}
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={!newDivisionData.name.trim()}>
                    <Plus size={18} className="me-1" /> {lang === 'hi' ? 'डिविजन सेव करें' : 'Save Division'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="fw-bold mb-0 text-primary">{lang === 'hi' ? 'संगठनात्मक संरचना (Hierarchy)' : 'Organizational Hierarchy'}</h5>
              </div>
              <div className="card-body p-0">
                <div className="accordion accordion-flush" id="hierarchyAccordion">
                  {hierarchyData.zones.map((zone, zIdx) => (
                    <div className="accordion-item border-bottom-0" key={zIdx}>
                      <h2 className="accordion-header">
                        <button 
                          className={`accordion-button ${!expandedZones[zone.name] ? 'collapsed' : ''} bg-light fw-bold`} 
                          type="button" 
                          onClick={() => toggleZone(zone.name)}
                          style={{ boxShadow: 'none' }}
                        >
                          {zone.name}
                        </button>
                      </h2>
                      <div className={`accordion-collapse collapse ${expandedZones[zone.name] ? 'show' : ''}`}>
                        <div className="accordion-body p-0">
                          <ul className="list-group list-group-flush">
                            {zone.circles.map((circle, cIdx) => (
                              <li className="list-group-item border-0 p-0" key={cIdx}>
                                <div 
                                  className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                  style={{ backgroundColor: '#fdfdfd', cursor: 'pointer' }}
                                  onClick={() => toggleCircle(circle.name)}
                                >
                                  <span className="fw-semibold text-secondary">
                                    {expandedCircles[circle.name] ? <ChevronDown size={16} className="me-2" /> : <ChevronRight size={16} className="me-2" />}
                                    {circle.name}
                                  </span>
                                  <span className="badge bg-secondary rounded-pill">
                                    {(circle.divisions || []).length} {lang === 'hi' ? 'डिविजन' : 'Divs'}
                                  </span>
                                </div>
                                
                                {expandedCircles[circle.name] && (
                                  <div className="bg-white p-3 ps-5 border-bottom">
                                    {(circle.divisions || []).length === 0 ? (
                                      <div className="text-muted small fst-italic">
                                        {lang === 'hi' ? 'कोई डिविजन नहीं है' : 'No divisions added yet'}
                                      </div>
                                    ) : (
                                      <div className="d-flex flex-wrap gap-2">
                                        {circle.divisions.map((div, dIdx) => (
                                          <div key={dIdx} className="badge bg-light text-dark border p-2 d-flex align-items-center">
                                            {div}
                                            <button 
                                              className="btn btn-link text-danger p-0 ms-2" 
                                              onClick={(e) => { e.stopPropagation(); removeDivision(zone.name, circle.name, div); }}
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div>
          <EmployeeMaster />
        </div>
      )}

      {activeTab === 'janshakti' && (
        <div>
          <JanShakti />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
