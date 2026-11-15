import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  const origConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const msg = args
        .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : String(a)))
        .join(' ');
      if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } catch {
      // Ignore inspection errors
    }
    origConsoleError(...args);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
