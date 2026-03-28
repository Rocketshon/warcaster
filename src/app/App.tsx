import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { ArmyProvider } from '../lib/ArmyContext';
import { CollectionProvider } from '../lib/CollectionContext';
import { ThemeProvider } from '../lib/ThemeContext';
import { CrusadeProvider } from '../lib/CrusadeContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <ArmyProvider>
      <CollectionProvider>
      <CrusadeProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </CrusadeProvider>
      </CollectionProvider>
      </ArmyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
