'use client';

import { useEffect, useState, useCallback } from 'react';

interface Account {
  id: number;
  name: string;
  accountId: number;
  balance: number;
  equity: number;
  profit: number;
  gain: number;
  daily: number;
  monthly: number;
  drawdown: number;
  currency: string;
  demo: boolean;
  lastUpdateDate: string;
}

interface ApiResponse {
  success: boolean;
  accounts?: Account[];
  error?: string;
  timestamp: string;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function BalanceDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
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
    fetchBalance();

    const interval = setInterval(fetchBalance, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button
          onClick={fetchBalance}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Myfxbook Balance</h1>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last update: {formatDate(lastUpdate)}
            </span>
          )}
          <button
            onClick={fetchBalance}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">No accounts found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {account.name}
                  </h2>
                  {account.demo && (
                    <span className="px-2 py-1 text-xs bg-yellow-400 text-yellow-900 rounded-full font-medium">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="text-blue-200 text-sm">
                  Account ID: {account.accountId}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center pb-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Equity</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatCurrency(account.equity, account.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profit</p>
                    <p
                      className={`text-lg font-semibold ${
                        account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(account.profit, account.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Gain</p>
                    <p
                      className={`text-sm font-medium ${
                        account.gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(account.gain)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Daily</p>
                    <p
                      className={`text-sm font-medium ${
                        account.daily >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(account.daily)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Monthly</p>
                    <p
                      className={`text-sm font-medium ${
                        account.monthly >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(account.monthly)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Drawdown</span>
                    <span className="text-sm font-medium text-orange-600">
                      {account.drawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(account.drawdown, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center pt-2">
                  Updated: {formatDate(account.lastUpdateDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Auto-refresh every {REFRESH_INTERVAL / 1000} seconds
      </div>
    </div>
  );
}
