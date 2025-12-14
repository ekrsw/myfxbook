import BalanceDashboard from '@/components/BalanceDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <BalanceDashboard />
      </div>
    </main>
  );
}
