import { ProtectedRoute } from '../auth/protected-route';
import { Layout } from './layout';

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}
