import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock: Record<string, string> = {};

class LocalStorageMock {
  getItem(key: string): string | null { return localStorageMock[key] ?? null; }
  setItem(key: string, value: string): void { localStorageMock[key] = value; }
  removeItem(key: string): void { delete localStorageMock[key]; }
  clear(): void { Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]); }
  get length(): number { return Object.keys(localStorageMock).length; }
  key(i: number): string | null { return Object.keys(localStorageMock)[i] ?? null; }
}

// Set globals BEFORE TestBed
(globalThis as any).localStorage = new LocalStorageMock();
(globalThis as any).sessionStorage = new LocalStorageMock();

// Initialize Angular test environment - empty module array for jsdom
TestBed.initTestEnvironment([]);

// Mock crypto for encryption service
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array): Uint8Array => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id));

// Silence Angular hydration warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => undefined);