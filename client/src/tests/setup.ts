// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';


// Add to your test setup file or at the top of GameBoard.test.tsx
if (!window.matchMedia) {
  window.matchMedia = function () {
	return {
	  matches: false,
	  addEventListener: () => {},
	  removeEventListener: () => {},
	  addListener: () => {},
	  removeListener: () => {},
	  onchange: null,
	  dispatchEvent: () => false,
	  media: '',
	};
  };
}
// Optional: Mock global browser APIs if needed
// global.matchMedia = vi.fn().mockImplementation(query => ({ ... }));