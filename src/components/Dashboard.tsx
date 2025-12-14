'use client';

import { useEffect, useState, useCallback } from 'react';

interface Account {
  id: number;
  name: string;
  accountId: number;
  balance: number;
  profit: number;
  currency: string;
}

interface ApiResponse {
  success: boolean;
  accounts?: Account[];
  error?: string;
  timestamp: string;
}

const REFRESH_INTERVAL = 30000;

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/myfxbook');
      const data: ApiResponse = await response.json();

      if (data.success && data.accounts) {
        setAccounts(data.accounts);
        setLastUpdate(data.timestamp);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Myfxbook Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              更新: {formatDate(lastUpdate)}
            </span>
          )}
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            更新
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                Account ID
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                Balance
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 border-b">
                  {account.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b">
                  {account.accountId}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 border-b font-mono">
                  {formatCurrency(account.balance, account.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-right border-b">
                  <span
                    className={`font-mono ${
                      account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.profit, account.currency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts.length === 0 && (
        <p className="text-center text-gray-500 py-4">No accounts found</p>
      )}
    </div>
  );
}
