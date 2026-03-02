/// <reference types="vitest/globals" />

// This file provides global type definitions for vitest test utilities
// It makes describe, it, expect, vi, beforeEach, afterEach, etc. available globally in test files

import type { TestAPI, ExpectStatic } from 'vitest';
import type { screen as _screen, fireEvent as _fireEvent, waitFor as _waitFor } from '@testing-library/react';

declare global {
  const describe: TestAPI['describe'];
  const it: TestAPI['it'];
  const test: TestAPI['test'];
  const expect: ExpectStatic;
  const vi: typeof import('vitest')['vi'];
  const beforeEach: TestAPI['beforeEach'];
  const afterEach: TestAPI['afterEach'];
  const beforeAll: TestAPI['beforeAll'];
  const afterAll: TestAPI['afterAll'];
  // Testing library globals
  const screen: typeof _screen;
  const fireEvent: typeof _fireEvent;
  const waitFor: typeof _waitFor;
}

export {};
