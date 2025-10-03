import React from 'react';
import { Toast } from '../../store';

type JoinToastProps = {
  toast?: Toast;
  isMobile: boolean;
};

const JoinToast: React.FC<JoinToastProps> = ({ toast, isMobile }) => {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`join-toast ${isMobile ? 'join-toast--mobile' : 'join-toast--desktop'}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
};

export default JoinToast;
