import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { CrusadeProvider } from '../lib/CrusadeContext';

export default function App() {
  return (
    <CrusadeProvider>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: '#1c1917',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#e7e5e4',
          },
        }}
      />
    </CrusadeProvider>
  );
}
