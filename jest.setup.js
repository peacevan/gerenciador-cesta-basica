// Enable React 18 act() support in the test environment
// See: https://reactjs.org/docs/test-utils.html#act
global.IS_REACT_ACT_ENVIRONMENT = true;

// Extende os matchers do Jest com assertions do DOM (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');
