// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';

const localStorageValues = new Map<string, string>();

const localStorageMock: Storage = {
    get length() {
        return localStorageValues.size;
    },
    clear: () => localStorageValues.clear(),
    getItem: (key) => localStorageValues.get(key) ?? null,
    key: (index) => [...localStorageValues.keys()][index] ?? null,
    removeItem: (key) => localStorageValues.delete(key),
    setItem: (key, value) => localStorageValues.set(key, String(value)),
};

Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
});
