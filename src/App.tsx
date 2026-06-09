import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { BottomNav } from '@/components/Layout/BottomNav';
import { LockScreen } from '@/components/Layout/LockScreen';
import { Record } from '@/pages/Record';
import { Ledger } from '@/pages/Ledger';
import { Budget } from '@/pages/Budget';
import { Statistics } from '@/pages/Statistics';
import { Settings } from '@/pages/Settings';
import { useStore } from '@/store/useStore';

function AppContent() {
  const isUnlocked = useStore((s) => s.isUnlocked);
  const privacyLockEnabled = useStore((s) => s.settings.privacyLockEnabled);
  const processRecurring = useStore((s) => s.processRecurring);
  const initialize = useStore((s) => s.initialize);

  useEffect(() => {
    initialize();
    processRecurring();
  }, [initialize, processRecurring]);

  if (privacyLockEnabled && !isUnlocked) {
    return <LockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen lg:ml-0 pb-20 lg:pb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/record" replace />} />
            <Route path="/record" element={<Record />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/record" replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
