import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [loginType, setLoginType] = useState('employee');
  const [useOtp, setUseOtp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-light)' }}>
      {/* Left Branding Side */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #004085, #1e3a8a)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
            alt="Emblem" 
            style={{ height: '120px', filter: 'brightness(0) invert(1)', marginBottom: '30px' }} 
          />
          <h1 style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '20px' }}>
            Government Employee & Establishment Portal
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Secure, centralized management system for personnel and office establishments.
          </p>
        </div>
      </div>

      {/* Right Login Side */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="card w-100" style={{ maxWidth: '450px', padding: '40px', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div className="text-center mb-4">
            <h4 style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Sign In</h4>
            <p className="text-muted">Access your dashboard</p>
          </div>

          {/* Login Tabs */}
          <div className="d-flex mb-4" style={{ background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
            {['employee', 'officer', 'admin'].map(type => (
              <button
                key={type}
                onClick={() => setLoginType(type)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  background: loginType === type ? 'white' : 'transparent',
                  color: loginType === type ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  boxShadow: loginType === type ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted">ID / Username</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><User size={18} className="text-muted"/></span>
                <input type="text" className="form-control" placeholder="Enter ID or HRMS ID" required value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            </div>

            {!useOtp ? (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label fw-bold small text-muted mb-0">Password</label>
                  <a href="#" className="small text-decoration-none" style={{ color: 'var(--primary-color)' }}>Forgot?</a>
                </div>
                <div className="input-group mt-2">
                  <span className="input-group-text bg-white"><Lock size={18} className="text-muted"/></span>
                  <input type="password" className="form-control" placeholder="Enter password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">OTP</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><Smartphone size={18} className="text-muted"/></span>
                  <input type="text" className="form-control" placeholder="Enter 6-digit OTP" required />
                  <button type="button" className="btn btn-outline-secondary">Get OTP</button>
                </div>
              </div>
            )}

            {/* Dummy CAPTCHA */}
            <div className="mb-4">
              <label className="form-label fw-bold small text-muted">Security Code (CAPTCHA)</label>
              <div className="d-flex gap-2">
                <div style={{ flex: 1, background: 'url(https://via.placeholder.com/150x40?text=A7X9B2)', backgroundSize: 'cover', borderRadius: '4px', border: '1px solid #dee2e6' }}></div>
                <input type="text" className="form-control" placeholder="Enter code" style={{ flex: 1 }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3 py-2 fw-bold" style={{ background: 'var(--primary-color)', border: 'none' }}>
              <Shield size={18} className="me-2" />
              Secure Login
            </button>

            <div className="text-center">
              <button 
                type="button" 
                className="btn btn-link text-decoration-none text-muted small fw-bold"
                onClick={() => setUseOtp(!useOtp)}
              >
                {useOtp ? 'Login with Password instead' : 'Login with OTP instead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
