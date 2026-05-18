import React, { useEffect, useRef, useState } from 'react';

const SimpleDropdown = ({
  trigger,
  children,
  triggerClassName = '',
  menuClassName = '',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="simple-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {trigger}
      </button>
      {isOpen ? (
        <div
          className={`simple-dropdown__menu simple-dropdown__menu--${align} ${menuClassName}`.trim()}
          role="menu"
          onClick={(event) => {
            if (event.target.closest('a,button')) {
              setIsOpen(false);
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default SimpleDropdown;
