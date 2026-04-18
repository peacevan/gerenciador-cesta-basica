// Helper to load the ESM Netlify function from CommonJS-friendly tests
exports.loadHandler = async () => {
  const mod = await import('./ai-proxy.mjs');
  return mod.default;
};
