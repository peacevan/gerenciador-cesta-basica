import { showToast } from './showToast';

describe('showToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders a native toast message and hides it after the timeout', () => {
    showToast({ html: 'Salvo com sucesso!', classes: 'green' });

    const toast = document.querySelector('.app-toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Salvo com sucesso!');
    expect(toast.className).toContain('app-toast--success');
    expect(toast.className).toContain('app-toast--visible');

    jest.advanceTimersByTime(3000);

    expect(toast.className).not.toContain('app-toast--visible');
  });
});
