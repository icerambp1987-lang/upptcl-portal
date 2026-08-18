import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Bell, LogOut, Building2, Shield, Activity, Globe, UserX, ClipboardList } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';

const Layout = () => {
  const location = useLocation();
  const path = location.pathname;
  const { lang, toggleLanguage, t } = useLanguage();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Establishment', path: '/establishments', icon: Building2 },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'SE (E&M/Civil) Vacancy Details', path: '/vacancy-details', icon: ClipboardList },
    { name: 'EE (E&M/Civil) Vacancy Details', path: '/ee-vacancy-details', icon: ClipboardList },
    { name: 'Retirements / Separation', path: '/retirements', icon: UserX },
    { name: 'Admin Panel', path: '/admin', icon: Shield },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div>
      <nav className="gov-navbar">
        <div className="brand">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
            alt="Emblem" 
            style={{ height: '40px', filter: 'brightness(0) invert(1)' }} 
          />
          <div>
            <div>U.P. Power Transmission Corporation Ltd. Portal</div>
            <span className="brand-subtitle">Govt. of Uttar Pradesh Undertaking</span>
          </div>
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleLanguage} title="Toggle Language (Hindi/English)" style={{ width: 'auto', padding: '0 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Globe size={16} className="me-2" />
            <span style={{ fontSize: '0.85rem' }}>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>
          <button className="icon-btn ms-2" title="Notifications">
            <Bell size={18} />
          </button>
          <div className="d-flex align-items-center gap-2 ms-3" style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rambp1987</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Administrator</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              R
            </div>
          </div>
          <button className="icon-btn ms-2" title={t('Logout')} onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <aside className="gov-sidebar">
        <ul className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li className="nav-item" key={item.name}>
                <Link to={item.path} className={`nav-link ${path === item.path ? 'active' : ''}`}>
                  <Icon />
                  {t(item.name)}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="main-wrapper">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
