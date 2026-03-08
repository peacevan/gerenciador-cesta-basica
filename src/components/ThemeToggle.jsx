import React from 'react';
import '../styles/ThemeToggle.css';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
      title={`Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativo`}
    >
      <div className="toggle-track">
        <div className={`toggle-thumb ${theme}`}>
          {theme === 'dark' ? (
            <i className="material-icons">dark_mode</i>
          ) : (
            <i className="material-icons">light_mode</i>
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
