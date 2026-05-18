import React, { useEffect } from 'react';

const SimpleModal = ({ isOpen, onClose, children, footer, className = '', contentStyle, dialogStyle }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="simple-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`simple-modal ${className}`.trim()}
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="simple-modal__content" style={contentStyle}>
          {children}
        </div>
        {footer ? <div className="simple-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default SimpleModal;
