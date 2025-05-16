// Mock React DevTools
vi.mock('react-devtools-core', () => ({
  createDevTools: vi.fn(),
}));

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  useFocusManager: () => ({
    focus: vi.fn(),
  }),
}));
