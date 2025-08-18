declare global {
  interface Window {
    Prism?: {
      highlightAllUnder(element: Element): void;
      highlightAll(): void;
    };
  }
}

export {};