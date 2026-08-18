import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserPlus, Search, Edit2, Eye, Download, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployee } from '../contexts/EmployeeContext';
import { useHierarchy } from '../contexts/HierarchyContext';
import janshaktiData from '../data/janshaktiData.json';
import upDistrictsData from '../data/upDistricts.json';

const EmployeeMaster = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const { t, lang } = useLanguage();
  const { employees, addEmployee, updateEmployee, addMultipleEmployees } = useEmployee();
  const fileInputRef = useRef(null);
  const { hierarchyData } = useHierarchy();

  const zoneRankMap = useMemo(() => {
    const map = {};
    if (hierarchyData && hierarchyData.zones) {
      hierarchyData.zones.forEach((z, index) => { map[z.name] = index; });
    }
    return map;
  }, [hierarchyData]);

  const circleRankMap = useMemo(() => {
    const map = {};
    if (hierarchyData && hierarchyData.zones) {
      hierarchyData.zones.forEach(z => {
        (z.circles || []).forEach((c, index) => { map[c.name] = index; });
      });
    }
    return map;
  }, [hierarchyData]);

  const [editId, setEditId] = useState(null);
  const [dept, setDept] = useState('');
  const [office, setOffice] = useState('');
  
  const [zone, setZone] = useState('');
  const [circle, setCircle] = useState('');
  const [division, setDivision] = useState('');
  const [subdivision, setSubdivision] = useState('');
  const [desig, setDesig] = useState('');
  const [substantiveDesig, setSubstantiveDesig] = useState('');
  const [officeNameStr, setOfficeNameStr] = useState('');
  const [viewEmployee, setViewEmployee] = useState(null);
  
  const [empName, setEmpName] = useState('');
  const [empNameHi, setEmpNameHi] = useState('');
  const [sapId, setSapId] = useState('');
  const [isVacantPost, setIsVacantPost] = useState(false);
  const [isSanctioned, setIsSanctioned] = useState(true);
  const [sapIdError, setSapIdError] = useState('');

  const [dob, setDob] = useState('');
  const [dor, setDor] = useState('');
  const [doj, setDoj] = useState('');
  const [tenure, setTenure] = useState('');
  const [homeDistrict, setHomeDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');

  const [empIdStr, setEmpIdStr] = useState('');
  const [auditNo, setAuditNo] = useState('');
  const [cugNo, setCugNo] = useState('');
  const [mobNo, setMobNo] = useState('');
  const [omNo, setOmNo] = useState('');
  const [caste, setCaste] = useState('');
  const [cpfGpfNo, setCpfGpfNo] = useState('');
  const [emailId, setEmailId] = useState('');
  const [chargeType, setChargeType] = useState('Main');
  const [searchQuery, setSearchQuery] = useState('');


  const zones = hierarchyData.zones || [];
  const hqUnits = hierarchyData.hqUnits || [];
  
  const selectedObj = office === 'ZONE' 
    ? zones.find(z => z.name === zone) 
    : office === 'HQ' ? hqUnits.find(u => u.name === zone) : null;

  const circles = selectedObj && selectedObj.circles ? selectedObj.circles : [];
  const selectedCircleObj = circles.find(c => c.name === circle);
  const divisions = selectedCircleObj && selectedCircleObj.divisions ? selectedCircleObj.divisions : [];
  const selectedDivisionObj = divisions.find(d => d.name === division);
  const subdivisions = selectedDivisionObj && selectedDivisionObj.subdivisions ? selectedDivisionObj.subdivisions : [];
  const designations = [...new Set(janshaktiData.map(d => lang === 'hi' ? d.hindi : d.english))];

  const handleDobChange = (e) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const [yearStr, monthStr, dayStr] = val.split('-');
      const dobYear = parseInt(yearStr, 10);
      const dobMonth = parseInt(monthStr, 10) - 1;
      const dobDate = parseInt(dayStr, 10);
      
      let dorYear = dobYear + 60;
      let dorMonth = dobMonth;
      
      if (dobDate === 1) {
        dorMonth = dobMonth - 1;
      }
      
      const dorDateObj = new Date(dorYear, dorMonth + 1, 0);
      const yyyy = dorDateObj.getFullYear();
      const mm = String(dorDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dorDateObj.getDate()).padStart(2, '0');
      
      setDor(`${yyyy}-${mm}-${dd}`);
    } else {
      setDor('');
    }
  };

  const handleDojChange = (e) => {
    const val = e.target.value;
    setDoj(val);
    if (val) {
      const joinDate = new Date(val);
      const today = new Date();
      if (joinDate > today) {
        setTenure('0 Y, 0 M, 0 D');
        return;
      }
      let years = today.getFullYear() - joinDate.getFullYear();
      let months = today.getMonth() - joinDate.getMonth();
      let days = today.getDate() - joinDate.getDate();
      
      if (days < 0) {
        months -= 1;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      setTenure(`${years}Y, ${months}M, ${days}D`);
    } else {
      setTenure('');
    }
  };

  const checkSapId = (idValue, cType) => {
    if (!idValue) {
      setSapIdError('');
      return;
    }
    if (isVacantPost) {
      setSapIdError('');
      return;
    }
    const existingRecords = employees.filter(e => e.internalId === idValue && e.id !== editId);
    
    if (existingRecords.length > 0) {
      // Auto-fill from the first found record
      const exists = existingRecords[0];
      
      const mainExists = existingRecords.some(e => e.chargeType === 'Main');
      
      if (cType === 'Main') {
        if (mainExists) {
           setSapIdError(lang === 'hi' ? 'इस SAP ID के लिए मूल कार्यभार (Main Charge) पहले से मौजूद है! (अतिरिक्त कार्यभार चुनें)' : 'Main Charge already exists for this SAP ID! (Select Additional Charge)');
        } else {
           // Allow Main charge if only Additional exists, and auto-fill
           setEmpName(exists.name || '');
           setEmpNameHi(exists.nameHi || '');
           setDob(exists.dob || '');
           setDor(exists.dor || '');
           setHomeDistrict(exists.homeDistrict || '');
           setEmpIdStr(exists.empIdStr || '');
           setAuditNo(exists.auditNo || '');
           setCaste(exists.caste || '');
           setMobNo(exists.mobNo || '');
           setEmailId(exists.emailId || '');
           setSapIdError(lang === 'hi' ? 'जानकारी ऑटो-फ़िल हो गई है (अतिरिक्त कार्यभार से)' : 'Details auto-filled from Additional Charge');
        }
      } else {
        // Additional charge being added
        setEmpName(exists.name || '');
        setEmpNameHi(exists.nameHi || '');
        setDob(exists.dob || '');
        setDor(exists.dor || '');
        setHomeDistrict(exists.homeDistrict || '');
        setEmpIdStr(exists.empIdStr || '');
        setAuditNo(exists.auditNo || '');
        setCaste(exists.caste || '');
        setMobNo(exists.mobNo || '');
        setEmailId(exists.emailId || '');
        setSapIdError(lang === 'hi' ? 'जानकारी ऑटो-फ़िल हो गई है (अतिरिक्त कार्यभार)' : 'Details auto-filled (Additional Charge)');
      }
    } else {
      setSapIdError('');
    }
  };

  const handleSapIdBlur = (e) => {
    checkSapId(e.target.value, chargeType);
  };

  // Auto-translate name with debounce while typing
  useEffect(() => {
    if (!empName || empName.toUpperCase() === 'VACANT' || isVacantPost) return;
    
    const timer = setTimeout(async () => {
      // If user hasn't explicitly cleared or heavily modified it, fetch transliteration
      try {
        const res = await fetch(`https://inputtools.google.com/request?text=${empName}&itc=hi-t-i0-und&num=1`);
        const data = await res.json();
        if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
          setEmpNameHi(data[1][0][1][0]);
        }
      } catch (err) {
        console.warn("Transliteration failed", err);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [empName, isVacantPost]);

  const handleNameBlur = async () => {
    if (!empName || empNameHi) return;
    try {
      const res = await fetch(`https://inputtools.google.com/request?text=${empName}&itc=hi-t-i0-und&num=1`);
      const data = await res.json();
      if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
        setEmpNameHi(data[1][0][1][0]);
      }
    } catch (err) {
      console.warn("Transliteration failed", err);
    }
  };

  const handleEditClick = (emp) => {
    setEditId(emp.id);
    const isVac = emp.status === 'Vacant' || (emp.name && emp.name.toUpperCase() === 'VACANT');
    setIsVacantPost(isVac);
    setIsSanctioned(emp.isSanctioned !== false);
    setEmpName(emp.name || '');
    setEmpNameHi(emp.nameHi || '');
    setSapId(emp.internalId === 'N/A' ? '' : emp.internalId);
    setDept(emp.dept || '');
    setDesig(emp.desig || '');
    setSubstantiveDesig(emp.substantiveDesig || '');
    setOffice(emp.office || '');
    setZone(emp.zone || '');
    setCircle(emp.circle || '');
    setDivision(emp.division || '');
    setSubdivision(emp.subdivision || '');
    setDob(emp.dob || '');
    setDor(emp.dor || '');
    setDoj(emp.doj || '');
    setTenure(emp.tenure || '');
    setOfficeNameStr(emp.officeName || '');
    
    setEmpIdStr(emp.empIdStr || '');
    setAuditNo(emp.auditNo || '');
    setCugNo(emp.cugNo || '');
    setMobNo(emp.mobNo || '');
    setOmNo(emp.omNo || '');
    setCaste(emp.caste || '');
    setCpfGpfNo(emp.cpfGpfNo || '');
    setEmailId(emp.emailId || '');
    setChargeType(emp.chargeType || 'Main');

    if (upDistrictsData.includes(emp.homeDistrict)) {
      setHomeDistrict(emp.homeDistrict);
      setCustomDistrict('');
    } else if (emp.homeDistrict) {
      setHomeDistrict('Custom');
      setCustomDistrict(emp.homeDistrict);
    } else {
      setHomeDistrict('');
      setCustomDistrict('');
    }
    setActiveTab('add');
  };

  const resetForm = () => {
    setEditId(null); setEmpName(''); setEmpNameHi(''); setSapId(''); setSapIdError('');
    setDesig(''); setSubstantiveDesig(''); setDept(''); setOffice(''); setZone(''); setCircle(''); setDivision(''); setSubdivision(''); setOfficeNameStr('');
    setDob(''); setDor(''); setDoj(''); setTenure(''); setHomeDistrict(''); setCustomDistrict('');
    setEmpIdStr(''); setAuditNo(''); setCugNo(''); setMobNo(''); setOmNo(''); setCaste('');    setCpfGpfNo('');
    setEmailId('');
    setCustomDistrict('');
    setIsVacantPost(false);
    setIsSanctioned(true);
    setSapIdError('');
  }; 
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleSave = () => {
    if (!desig || !dept || !empName) {
      alert(lang === 'hi' ? "कृपया अनिवार्य फ़ील्ड भरें (पदनाम, विभाग, नाम)" : "Please fill required fields (Designation, Department, Name)");
      return;
    }
    const hasRealSapError = sapIdError && (sapIdError.includes('पहले से मौजूद है') || sapIdError.includes('already exists'));
    if (hasRealSapError) {
      alert(lang === 'hi' ? "कृपया SAP ID त्रुटि को ठीक करें।" : "Please fix SAP ID error.");
      return;
    }
    const finalDistrict = homeDistrict === 'Custom' ? customDistrict : homeDistrict;
    const empData = {
      name: empName,
      nameHi: empNameHi,
      internalId: sapId || 'N/A',
      dept,
      desig,
      status: isVacantPost ? 'Vacant' : 'Active',
      office,
      zone,
      circle,
      division,
      subdivision,
      officeName: officeNameStr,
      dob,
      dor,
      doj,
      tenure,
      homeDistrict: finalDistrict,
      empIdStr,
      auditNo,
      cugNo,
      mobNo,
      omNo,
      caste,
      cpfGpfNo,
      emailId,
      chargeType,
      substantiveDesig,
      officeName: officeNameStr,
      isSanctioned
    };
    
    if (editId) {
      updateEmployee(editId, empData);
      alert(lang === 'hi' ? 'कर्मचारी का डेटा सफलतापूर्वक अपडेट हो गया!' : 'Employee data updated successfully!');
    } else {
      addEmployee(empData);
      alert(lang === 'hi' ? 'कर्मचारी का डेटा सफलतापूर्वक सेव हो गया!' : 'Employee data saved successfully!');
    }
    setActiveTab('list');
    resetForm();
  };

  const zoneRank = {};
  const circleRank = {};
  hierarchyData.zones.forEach((z, zIdx) => {
    zoneRank[z.name] = zIdx;
    z.circles.forEach((c, cIdx) => {
      circleRank[c.name] = cIdx;
    });
  });

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(lowerQuery)) ||
      (emp.nameHi && emp.nameHi.toLowerCase().includes(lowerQuery)) ||
      (emp.internalId && emp.internalId.toLowerCase().includes(lowerQuery)) ||
      (emp.desig && emp.desig.toLowerCase().includes(lowerQuery)) ||
      (emp.dept && emp.dept.toLowerCase().includes(lowerQuery)) ||
      (emp.zone && emp.zone.toLowerCase().includes(lowerQuery)) ||
      (emp.circle && emp.circle.toLowerCase().includes(lowerQuery))
    );
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const deptA = a.dept || '';
    const deptB = b.dept || '';
    if (deptA !== deptB) return deptA.localeCompare(deptB);
    
    const desigA = a.desig || '';
    const desigB = b.desig || '';
    if (desigA !== desigB) return desigA.localeCompare(desigB);
    
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
    
    const divA = a.division || '';
    const divB = b.division || '';
    if (divA !== divB) return divA.localeCompare(divB);
    
    const offA = a.officeName || '';
    const offB = b.officeName || '';
    return offA.localeCompare(offB);
  });

    const handleDownloadTemplate = () => {
    const headers = ['Name', 'SAP ID', 'Audit No', 'DOB (YYYY-MM-DD)', 'DOR (YYYY-MM-DD)', 'Department', 'Designation', 'Status', 'Zone', 'Circle', 'Division', 'Subdivision', 'Office Name', 'Date of Posting (YYYY-MM-DD)', 'Tenure', 'Mobile No', 'OM No', 'Charge Type (Main/Additional)'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) {
        alert(lang === 'hi' ? 'फ़ाइल खाली है या गलत फॉर्मेट है!' : 'File is empty or invalid format!');
        return;
      }
      
      const parsedEmployees = [];
      // Start from row 1, skipping header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parse (ignores commas inside quotes for now, assuming simple entries)
                const cols = [];
        let col = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '"') {
                inQuotes = !inQuotes;
            } else if (line[j] === ',' && !inQuotes) {
                cols.push(col);
                col = '';
            } else {
                col += line[j];
            }
        }
        cols.push(col);
        if (cols.length < 18) continue;
        
        parsedEmployees.push({
          name: cols[0]?.trim() || '',
          nameHi: '',
          internalId: cols[1]?.trim() || 'N/A',
          empIdStr: 'N/A',
          auditNo: cols[2]?.trim() || '-',
          dob: cols[3]?.trim() || '',
          dor: cols[4]?.trim() || '',
          dept: cols[5]?.trim() || 'UPPTCL',
          desig: cols[6]?.trim() || '',
          status: cols[7]?.trim() || 'Active',
          office: cols[8]?.trim() === 'ZONE' ? 'ZONE' : (cols[8]?.trim() ? 'ZONE' : 'HQ'),
          zone: cols[8]?.trim() || '',
          circle: cols[9]?.trim() || '',
          division: cols[10]?.trim() || '',
          subdivision: cols[11]?.trim() || '',
          officeName: cols[12]?.trim() || '',
          doj: cols[13]?.trim() || '',
          tenure: cols[14]?.trim() || '',
          cugNo: cols[15]?.trim() || '',
          omNo: cols[16]?.trim() || '',
          chargeType: cols[17]?.trim() || 'Main'
        });
      }
      
      if (parsedEmployees.length > 0 && addMultipleEmployees) {
        addMultipleEmployees(parsedEmployees);
        alert(lang === 'hi' ? `${parsedEmployees.length} कर्मचारी सफलतापूर्वक अपलोड हो गए!` : `${parsedEmployees.length} employees uploaded successfully!`);
      } else {
        alert(lang === 'hi' ? 'कोई नया डेटा नहीं मिला।' : 'No new data found.');
      }
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      alert(lang === 'hi' ? 'कोई डाटा नहीं है!' : 'No data available to export!');
      return;
    }
    const headers = ['Zone', 'Circle', 'Name', 'Name (Hindi)', 'SAP ID', 'ID', 'Audit No', 'Department', 'Designation', 'Status', 'Office', 'Division', 'Subdivision', 'DOB', 'DOR', 'Date of Posting', 'Tenure', 'Home District', 'CUG No', 'Mobile No', 'OM No', 'Caste', 'CPF/GPF No', 'Email'];
    const rows = sortedEmployees.map(emp => {
      let excelZone = emp.zone || '';
      let excelCircle = emp.circle || emp.officeName || '';
      
      const isCE = (emp.desig || '').includes('Chief Engineer');
      if (isCE && emp.office === 'HQ') {
        excelZone = emp.officeName || emp.circle || '';
        excelCircle = '';
      }

      return [
        excelZone,
        excelCircle,
        (emp.name || '') + (emp.chargeType === 'Additional' ? ' (Addi.)' : ''),
        (emp.nameHi || '') + (emp.chargeType === 'Additional' ? ' (अतिरिक्त)' : ''),
        emp.internalId || '',
        emp.empIdStr || '',
        emp.auditNo || '',
        emp.dept || '',
        emp.desig || '',
        emp.status || '',
        emp.office || '',
        emp.division || '',
        emp.subdivision || '',
        formatDate(emp.dob) || '',
        formatDate(emp.dor) || '',
        formatDate(emp.doj) || '',
        emp.tenure || '',
        emp.homeDistrict || '',
        emp.cugNo || '',
        emp.mobNo || '',
        emp.omNo || '',
        emp.caste || '',
        emp.cpfGpfNo || '',
        emp.emailId || ''
      ];
    });
    
    // Add BOM for correct UTF-8 rendering in Excel
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(item => `"${(item||'').toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "UPPTCL_Employee_List.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--text-dark)' }}>{t('Employee Master')}</h2>
        <div className="d-flex gap-2">
          <button 
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('list')}
            style={activeTab === 'list' ? { background: 'var(--primary-color)', border: 'none' } : {}}
          >
            {t('Employee List')}
          </button>
          <button 
            className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('add')}
            style={activeTab === 'add' ? { background: 'var(--primary-color)', border: 'none' } : {}}
          >
            <UserPlus size={18} className="me-2" />
            {t('Add Employee')}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex justify-content-between mb-4">
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-white"><Search size={18} className="text-muted"/></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder={t('Search employee...')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success d-flex align-items-center gap-2" onClick={handleDownloadTemplate} title={lang === 'hi' ? 'एक्सेल (CSV) टेम्पलेट डाउनलोड करें' : 'Download Excel (CSV) Template'}>
                <Download size={18} /> {lang === 'hi' ? 'टेम्पलेट' : 'Template'}
              </button>
              <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
              <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => fileInputRef.current?.click()} title={lang === 'hi' ? 'CSV फ़ाइल अपलोड करें' : 'Upload CSV file'}>
                <Upload size={18} /> {lang === 'hi' ? 'अपलोड' : 'Upload'}
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={handleExportCSV}>
                <Download size={18} /> {t('Export List')}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>{t('SAP ID')}</th>
                  <th>{t('ID')}</th>
                  <th>{t('Name')}</th>
                  <th>{t('Department')}</th>
                  <th>{t('Designation')}</th>
                  <th>{lang === 'hi' ? 'ज़ोन / ऑफिस' : 'Zone / Office'}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      {lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No employees found'}
                    </td>
                  </tr>
                ) : sortedEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td className="fw-bold text-primary">{emp.internalId === 'N/A' ? '' : emp.internalId}</td>
                    <td>{emp.empIdStr || ''}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div>{emp.name}</div>
                          {lang === 'hi' && emp.nameHi && <div className="text-muted small">{emp.nameHi}</div>}
                          {emp.chargeType === 'Additional' && <span className="badge bg-warning text-dark mt-1" style={{fontSize: '0.65rem'}}>{lang==='hi'?'अतिरिक्त कार्यभार':'Additional Charge'}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="small text-muted">{emp.dept}</td>
                    <td className="small text-muted">
                      {lang === 'hi' 
                        ? (janshaktiData.find(d => d.english === emp.desig)?.hindi || emp.desig)
                        : emp.desig}
                      {emp.substantiveDesig && emp.substantiveDesig !== emp.desig && (
                        <div className="mt-1">
                          <span className="badge bg-secondary px-1 py-0" style={{fontSize: '0.65rem'}}>{emp.substantiveDesig}</span>
                        </div>
                      )}
                    </td>
                    <td className="fw-bold text-dark" style={{ maxWidth: '200px' }}>
                      {[emp.office, emp.zone, emp.circle, emp.division, emp.subdivision, emp.officeName]
                        .filter(Boolean)
                        .filter(val => !val.toString().includes('Select '))
                        .join(', ')}
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'bg-success' : (emp.status === 'Vacant' ? 'bg-danger' : 'bg-secondary')}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-light me-2" onClick={() => setViewEmployee(emp)}><Eye size={16} className="text-muted" /></button>
                      <button className="btn btn-sm btn-light" onClick={() => handleEditClick(emp)}><Edit2 size={16} className="text-muted" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h5 className="mb-4 text-primary border-bottom pb-2">{t('Add New Employee')}</h5>
          
          <form>
            <div className="row g-4">
              <div className="col-12"><h6 className="fw-bold text-muted mb-0 mt-2">{t('Designation')}</h6></div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">{t('Designation')} *</label>
                <select className="form-select" value={desig} onChange={(e) => setDesig(e.target.value)}>
                  <option value="">{t('Select Desig')}</option>
                  {designations.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="col-12"><h6 className="fw-bold text-muted mb-0 mt-4">{t('Official Details')}</h6></div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">{t('Department')} *</label>
                <select className="form-select" value={dept} onChange={(e) => { setDept(e.target.value); setOffice(''); }}>
                  <option value="">{t('Select Dept')}</option>
                  <option value="UPPTCL">UPPTCL</option>
                  <option value="UP SLDC LTD.">UP SLDC LTD.</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">{t('Office Type')}</label>
                <select className="form-select" value={office} onChange={(e) => setOffice(e.target.value)} disabled={!dept}>
                  <option value="">{t('Select Office')}</option>
                  {dept === 'UPPTCL' && (
                    <>
                      <option value="HQ">HQ</option>
                      <option value="ZONE">ZONE</option>
                    </>
                  )}
                  {dept === 'UP SLDC LTD.' && (
                    <option value="HQ">HQ</option>
                  )}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">{t('Zone / Unit Name')}</label>
                <input 
                  type="text" 
                  list="zoneDatalist" 
                  className="form-control" 
                  placeholder={office === 'ZONE' ? t('Select Zone') : (lang === 'hi' ? 'यूनिट चुनें (या नया टाइप करें)' : 'Select Unit (or type new)')} 
                  value={zone} 
                  onChange={(e) => { 
                    const val = e.target.value;
                    setZone(val); 
                    if (office === 'ZONE') {
                       const zObj = zones.find(z => z.name === val);
                       if (zObj) { setOfficeNameStr(zObj.officeName || ''); setCircle(''); setDivision(''); setSubdivision(''); }
                    } else if (office === 'HQ' && dept === 'UPPTCL') {
                       const uObj = hqUnits.find(u => u.name === val);
                       if (uObj) { setOfficeNameStr(uObj.officeName || ''); setCircle(''); setDivision(''); setSubdivision(''); }
                    } else if (office === 'HQ' && dept === 'UP SLDC LTD.') {
                       const uObj = hierarchyData.sldcUnits?.find(u => u.name === val);
                       if (uObj) { setOfficeNameStr(uObj.officeName || ''); setCircle(''); setDivision(''); setSubdivision(''); }
                    }
                  }} 
                  disabled={!office} 
                />
                <datalist id="zoneDatalist">
                  {office === 'ZONE' && zones.map((z, idx) => <option key={idx} value={z.name} />)}
                  {office === 'ZONE' && Array.from(new Set(employees.filter(e => e.office === 'ZONE').map(e => e.zone))).filter(z => z && !zones.some(u => u.name === z)).map((z, idx) => <option key={`cz-${idx}`} value={z} />)}
                  
                  {office === 'HQ' && dept === 'UPPTCL' && hqUnits.map((u, idx) => <option key={idx} value={u.name} />)}
                  {office === 'HQ' && dept === 'UPPTCL' && Array.from(new Set(employees.filter(e => e.office === 'HQ' && e.dept === 'UPPTCL').map(e => e.zone))).filter(z => z && !hqUnits.some(u => u.name === z)).map((z, idx) => <option key={`chq-${idx}`} value={z} />)}
                  
                  {office === 'HQ' && dept === 'UP SLDC LTD.' && hierarchyData.sldcUnits?.map((u, idx) => <option key={idx} value={u.name} />)}
                  {office === 'HQ' && dept === 'UP SLDC LTD.' && Array.from(new Set(employees.filter(e => e.office === 'HQ' && e.dept === 'UP SLDC LTD.').map(e => e.zone))).filter(z => z && !(hierarchyData.sldcUnits || []).some(u => u.name === z)).map((z, idx) => <option key={`csldc-${idx}`} value={z} />)}
                </datalist>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">{t('Office Name')}</label>
                <input type="text" list="officeNameSuggestions" className="form-control" placeholder={t('Office Name')} value={officeNameStr} onChange={(e) => setOfficeNameStr(e.target.value)} disabled={!office} />
                <datalist id="officeNameSuggestions">
                  {zone && zones.find(z => z.name === zone) && (
                    <>
                      <option value={zones.find(z => z.name === zone).officeName} />
                      <option value={`SE (A) to ${zones.find(z => z.name === zone).officeName}`} />
                      <option value={`EE (A) to ${zones.find(z => z.name === zone).officeName}`} />
                    </>
                  )}
                  {zone && hqUnits.find(u => u.name === zone) && (() => {
                    const uObj = hqUnits.find(u => u.name === zone);
                    return (
                      <>
                        <option value={uObj.officeName} />
                        {zone !== 'C&C, Lucknow' && <option value={`SE (A) to ${uObj.officeName}`} />}
                        <option value={`EE (A) to ${uObj.officeName}`} />
                      </>
                    );
                  })()}
                  {zone && hierarchyData.sldcUnits?.find(u => u.name === zone) && (() => {
                    const uObj = hierarchyData.sldcUnits.find(u => u.name === zone);
                    return (
                      <>
                        <option value={uObj.officeName} />
                        <option value={`SE (A) to ${uObj.officeName}`} />
                        <option value={`EE (A) to ${uObj.officeName}`} />
                      </>
                    );
                  })()}
                </datalist>
              </div>

              {dept === 'UPPTCL' && (office === 'ZONE' || office === 'HQ') && circles.length > 0 && (
                <>
                  <div className="col-md-4 mt-3">
                    <label className="form-label small fw-bold">{t('Circle')}</label>
                    <select className="form-select" value={circle} onChange={(e) => { setCircle(e.target.value); setDivision(''); setSubdivision(''); }} disabled={!zone}>
                      <option value="">{t('Select Circle')}</option>
                      {circles.map((c, idx) => <option key={idx} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label small fw-bold">{t('Division')}</label>
                    <select className="form-select" value={division} onChange={(e) => { setDivision(e.target.value); setSubdivision(''); }} disabled={!circle}>
                      <option value="">{t('Select Division')}</option>
                      {divisions.map((d, idx) => { const dVal = typeof d === 'object' ? d.name : d; return <option key={idx} value={dVal}>{dVal}</option>; })}
                    </select>
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label small fw-bold">{t('Sub-division')}</label>
                    <select className="form-select" value={subdivision} onChange={(e) => setSubdivision(e.target.value)} disabled={!division}>
                      <option value="">{t('Select Sub-division')}</option>
                      {subdivisions.map((sd, idx) => <option key={idx} value={sd}>{sd}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="col-md-6 mt-3">
                <label className="form-label small fw-bold">
                  {lang === 'hi' ? 'मूल कैडर / पद (Substantive Cadre)' : 'Substantive Cadre / Original Post'} 
                  <span className="text-muted fw-normal ms-2">({lang === 'hi' ? 'यदि वर्तमान पद से अलग है' : 'If different from current designation'})</span>
                </label>
                <select className="form-select" value={substantiveDesig} onChange={(e) => setSubstantiveDesig(e.target.value)}>
                  <option value="">-- {lang === 'hi' ? 'वर्तमान पद के समान' : 'Same as Current Designation'} --</option>
                  {designations.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="col-12 d-flex align-items-center mt-4 mb-0">
                <h6 className="fw-bold text-muted mb-0 me-4">{t('Employee Details')}</h6>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" id="vacantSwitch" checked={isVacantPost} onChange={e => {
                    setIsVacantPost(e.target.checked);
                    if (e.target.checked) {
                      setEmpName('VACANT'); setEmpNameHi('रिक्त'); setChargeType('Main'); setSapId(''); setSapIdError('');
                    } else {
                      if (empName === 'VACANT') { setEmpName(''); setEmpNameHi(''); }
                    }
                  }} />
                  <label className="form-check-label fw-bold text-danger" htmlFor="vacantSwitch">
                    {lang === 'hi' ? 'इस पद को पूरी तरह रिक्त (Vacant) चिह्नित करें' : 'Mark this post as completely Vacant'}
                  </label>
                </div>
              </div>
              <div className="col-12 d-flex align-items-center mt-2 mb-0">
                <div className="form-check form-switch mb-0" style={{ marginLeft: '160px' }}>
                  <input className="form-check-input" type="checkbox" id="sanctionedSwitch" checked={isSanctioned} onChange={e => setIsSanctioned(e.target.checked)} />
                  <label className="form-check-label fw-bold text-primary" htmlFor="sanctionedSwitch">
                    {lang === 'hi' ? 'यह एक स्वीकृत पद (Sanctioned Post) है' : 'This is a Sanctioned Post'}
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{lang === 'hi' ? 'कार्यभार का प्रकार' : 'Charge Type'}</label>
                <select className="form-select" value={chargeType} onChange={(e) => { setChargeType(e.target.value); checkSapId(sapId, e.target.value); }} disabled={isVacantPost}>
                  <option value="Main">{lang === 'hi' ? 'मूल कार्यभार (Main)' : 'Main Charge'}</option>
                  <option value="Additional">{lang === 'hi' ? 'अतिरिक्त कार्यभार (Additional)' : 'Additional Charge'}</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Name')} *</label>
                <input type="text" className="form-control" value={empName} onChange={e => setEmpName(e.target.value)} onBlur={handleNameBlur} disabled={isVacantPost} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{lang === 'hi' ? 'नाम (हिन्दी में)' : 'Name (Hindi)'}</label>
                <input type="text" className="form-control" value={empNameHi} onChange={e => setEmpNameHi(e.target.value)} disabled={isVacantPost} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('SAP ID')}</label>
                <input type="text" className={`form-control ${sapIdError && (sapIdError.includes('पहले से मौजूद है') || sapIdError.includes('already exists')) ? 'is-invalid' : sapIdError ? 'is-valid' : ''}`} value={sapId} onChange={e => setSapId(e.target.value)} onBlur={handleSapIdBlur} />
                {sapIdError && <div className={(sapIdError.includes('पहले से मौजूद है') || sapIdError.includes('already exists')) ? 'invalid-feedback' : 'valid-feedback'}>{sapIdError}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('ID')}</label>
                <input type="text" className="form-control" value={empIdStr} onChange={e => setEmpIdStr(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Audit No.')}</label>
                <input type="text" className="form-control" value={auditNo} onChange={e => setAuditNo(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Home District')}</label>
                <select className="form-select" value={homeDistrict} onChange={e => setHomeDistrict(e.target.value)}>
                  <option value="">{t('Select District')}</option>
                  {upDistrictsData.map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="Custom">Custom (Other)</option>
                </select>
                {homeDistrict === 'Custom' && (
                  <input type="text" className="form-control mt-2" placeholder="Enter District" value={customDistrict} onChange={e => setCustomDistrict(e.target.value)} />
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('DOB')}</label>
                <input type="date" className="form-control" value={dob} onChange={handleDobChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('DOR')}</label>
                <input type="date" className="form-control" value={dor} onChange={e => setDor(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('CUG No.')}</label>
                <input type="text" className="form-control" value={cugNo} onChange={e => setCugNo(e.target.value)} />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Mob. No.(P)')}</label>
                <input type="tel" className="form-control" value={mobNo} onChange={e => setMobNo(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('OM No.')}</label>
                <input type="text" className="form-control" value={omNo} onChange={e => setOmNo(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Date of Posting')}</label>
                <input type="date" className="form-control" value={doj} onChange={handleDojChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Tenure')}</label>
                <input type="text" className="form-control" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="Y, M, D" />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{lang === 'hi' ? 'श्रेणी (Category)' : 'Category'}</label>
                <select className="form-select" value={caste} onChange={e => setCaste(e.target.value)}>
                  <option value="">{lang === 'hi' ? 'श्रेणी चुनें' : 'Select Category'}</option>
                  <option value="General">General (सामान्य)</option>
                  <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                  <option value="SC">SC (अनुसूचित जाति)</option>
                  <option value="ST">ST (अनुसूचित जनजाति)</option>
                  <option value="EWS">EWS (आर्थिक रूप से कमजोर)</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('CPF/GPF No.')}</label>
                <input type="text" className="form-control" value={cpfGpfNo} onChange={e => setCpfGpfNo(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">{t('Email ID')}</label>
                <input type="email" className="form-control" value={emailId} onChange={e => setEmailId(e.target.value)} />
              </div>
              
              <div className="col-12 mt-5 text-end">
                <button type="button" className="btn btn-light px-4 me-2" onClick={() => { setActiveTab('list'); resetForm(); }}>{t('Cancel')}</button>
                <button type="button" className="btn btn-primary px-5" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleSave}>
                  {editId ? (lang === 'hi' ? 'अपडेट करें' : 'Update Employee') : t('Save Employee')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {viewEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content print-profile-card">
              <div className="modal-header d-print-none text-white" style={{ background: 'var(--primary-color)' }}>
                <h5 className="modal-title">{lang === 'hi' ? 'कर्मचारी विवरण' : 'Employee Details'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewEmployee(null)}></button>
              </div>
              <div className="modal-body p-4" id="print-area">
                <div className="d-flex align-items-center mb-4 border-bottom pb-3">
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {viewEmployee.name.charAt(0)}
                  </div>
                  <div className="ms-4">
                    <h3 className="mb-1 fw-bold text-dark">{viewEmployee.name}</h3>
                    {viewEmployee.nameHi && <h5 className="mb-1 text-muted">{viewEmployee.nameHi}</h5>}
                    <div className="badge bg-primary fs-6 mt-1">{lang === 'hi' ? (janshaktiData.find(d => d.english === viewEmployee.desig)?.hindi || viewEmployee.desig) : viewEmployee.desig}</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">SAP ID</div>
                    <div className="fw-semibold">{viewEmployee.internalId !== 'N/A' ? viewEmployee.internalId : '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">ID</div>
                    <div className="fw-semibold">{viewEmployee.empIdStr || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Department</div>
                    <div className="fw-semibold">{viewEmployee.dept || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Office</div>
                    <div className="fw-semibold">{[viewEmployee.office, viewEmployee.zone, viewEmployee.circle, viewEmployee.division, viewEmployee.subdivision].filter(Boolean).join(', ')}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">DOB</div>
                    <div className="fw-semibold">{formatDate(viewEmployee.dob) || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">DOR</div>
                    <div className="fw-semibold">{formatDate(viewEmployee.dor) || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Date of Posting</div>
                    <div className="fw-semibold">{formatDate(viewEmployee.doj) || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Tenure</div>
                    <div className="fw-semibold">{viewEmployee.tenure || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Home District</div>
                    <div className="fw-semibold">{viewEmployee.homeDistrict || '-'}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Mobile / CUG</div>
                    <div className="fw-semibold">{viewEmployee.mobNo || '-'}{viewEmployee.cugNo ? ` / ${viewEmployee.cugNo}` : ''}</div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div className="text-muted small fw-bold">Email</div>
                    <div className="fw-semibold">{viewEmployee.emailId || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-print-none">
                <button type="button" className="btn btn-secondary" onClick={() => setViewEmployee(null)}>{t('Close')}</button>
                <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> {t('Print Profile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
