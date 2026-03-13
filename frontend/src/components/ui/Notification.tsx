import React, { useEffect } from 'react';

interface NotificationProps {
  open: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const icons = {
  success: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{marginRight:12}}><circle cx="12" cy="12" r="10"/><path d="M16 12l-4 4-2-2"/></svg>
  ),
  error: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{marginRight:12}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
  )
};

export const Notification: React.FC<NotificationProps> = ({ open, type, message, onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{
      position:'fixed',
      bottom:40,
      right:40,
      zIndex:1001,
      background:type==='success'?"linear-gradient(90deg,#2ecc40,#27ae60)":"linear-gradient(90deg,#e74c3c,#c0392b)",
      color:'#fff',
      padding:'18px 36px',
      borderRadius:12,
      boxShadow:'0 8px 32px #0003',
      fontWeight:'bold',
      fontSize:'1.15rem',
      display:'flex',
      alignItems:'center',
      minWidth:320,
      maxWidth:480,
      animation:'fadeInNotif 0.4s',
      letterSpacing:'0.02em',
      border:'2px solid #fff2',
    }}>
      {icons[type]}
      <span style={{flex:1,textAlign:'left'}}>{message}</span>
      <style>{`
        @keyframes fadeInNotif {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
