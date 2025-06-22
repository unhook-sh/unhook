/// <reference types="@testing-library/jest-dom" />

declare module 'bun:test' {
  interface Matchers<R, _T = unknown> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
  }
}
