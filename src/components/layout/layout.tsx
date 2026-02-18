import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { PendingInvitations } from '../pending-invitations';

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PendingInvitations />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
