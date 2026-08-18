import React from 'react';

const JanShakti = () => {
  return (
    <div style={{ height: 'calc(100vh - 120px)', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <iframe 
        src="/janshakti.html" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="जन शक्ति पोर्टल"
      />
    </div>
  );
};

export default JanShakti;
