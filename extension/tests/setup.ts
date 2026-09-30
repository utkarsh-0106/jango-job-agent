import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'CSS', {
  value: {
    escape: (str: string) => str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1'),
  },
});

global.chrome = {
  runtime: {
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    lastError: null,
    onInstalled: { addListener: vi.fn() },
  },
  storage: {
    local: {
      get: vi.fn((keys, callback) => callback({})),
      set: vi.fn((items, callback) => callback?.()),
      remove: vi.fn((keys, callback) => callback?.()),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
  },
  action: {
    onClicked: { addListener: vi.fn() },
  },
} as unknown as typeof chrome;