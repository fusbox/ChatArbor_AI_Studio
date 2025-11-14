// Fix: Import `vi` from vitest to resolve 'Cannot find name 'vi'' errors.
import { vi } from 'vitest';

// To make tests more robust, we can mock browser-specific APIs that
// are not available in the JSDOM environment.

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

const mockLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
};

const mockMatchMedia = () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
}

export const mocks = [mockLocalStorage, mockMatchMedia];