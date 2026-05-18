// Helper to load the ESM Netlify function from CommonJS-friendly tests
exports.loadHandler = async () => {
  const mod = await import('../ai-proxy.mjs');
  return mod.default;
};

// Minimal test to satisfy Jest (this file is intended as a helper but lives under __tests__)
if (typeof describe === 'function') {
  describe('ai-proxy.testable helper', () => {
    test('exports loadHandler function', () => {
      const helper = require('./ai-proxy.testable');
      expect(typeof helper.loadHandler).toBe('function');
    });
  });
}
