import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { AuthProvider } from '../lib/auth-context';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider 
        router={router} 
        fallbackElement={
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600">Loading application...</p>
            </div>
          </div>
        }
      />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}