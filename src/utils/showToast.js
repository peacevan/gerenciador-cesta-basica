let activeToast = null;
let activeTimer = null;

const getVariant = (classes = '') => {
  if (classes.includes('red')) return 'error';
  if (classes.includes('green')) return 'success';
  if (classes.includes('orange') || classes.includes('yellow')) return 'warning';
  return 'info';
};

const ensureToastElement = () => {
  if (activeToast && document.body.contains(activeToast)) {
    return activeToast;
  }

  activeToast = document.createElement('div');
  activeToast.className = 'app-toast';
  activeToast.setAttribute('role', 'status');
  activeToast.setAttribute('aria-live', 'polite');
  document.body.appendChild(activeToast);
  return activeToast;
};

const hideToast = () => {
  if (!activeToast) return;
  activeToast.classList.remove('app-toast--visible');
};

export const showToast = ({ html = '', classes = '', duration = 3000 } = {}) => {
  if (typeof document === 'undefined') return;

  const toast = ensureToastElement();
  toast.textContent = html;
  toast.className = `app-toast app-toast--${getVariant(classes)} app-toast--visible`;

  if (activeTimer) {
    window.clearTimeout(activeTimer);
  }

  activeTimer = window.setTimeout(hideToast, duration);
};

export default showToast;
