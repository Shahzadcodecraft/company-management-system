import { Suspense } from 'react';
import DashboardClient from '@/components/pages/DashboardClient';

export const metadata = { title: 'Dashboard | NexusCMS' };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ color: '#6B7A99', padding: 40, textAlign: 'center' }}>Loading dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
