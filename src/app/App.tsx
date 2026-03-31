import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { ArmyProvider } from '../lib/ArmyContext';
import { CollectionProvider } from '../lib/CollectionContext';
import { ThemeProvider } from '../lib/ThemeContext';
import { GameDataProvider } from '../lib/GameDataContext';
import { AuthProvider } from '../lib/AuthContext';
import { MarketProvider } from '../lib/MarketContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <GameDataProvider>
      <AuthProvider>
      <ArmyProvider>
      <CollectionProvider>
      <MarketProvider>
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
      </MarketProvider>
      </CollectionProvider>
      </ArmyProvider>
      </AuthProvider>
      </GameDataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
