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

interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  error?: string;
}

const REFRESH_INTERVAL = 30000;
const INITIAL_DEPOSIT_JPY = 23000000;

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [usdJpy, setUsdJpy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [accountsRes, rateRes] = await Promise.all([
        fetch('/api/myfxbook'),
        fetch('/api/exchange-rate'),
      ]);

      const accountsData: ApiResponse = await accountsRes.json();
      const rateData: ExchangeRateResponse = await rateRes.json();

      if (accountsData.success && accountsData.accounts) {
        setAccounts(accountsData.accounts);
        setLastUpdate(accountsData.timestamp);
        setError(null);
      } else {
        setError(accountsData.error || 'Failed to fetch data');
      }

      if (rateData.success && rateData.rate) {
        setUsdJpy(rateData.rate);
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // Calculate totals
  const totalBalanceUsd = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const balanceJpy = usdJpy ? totalBalanceUsd * usdJpy : null;
  const profitJpy = balanceJpy ? balanceJpy - INITIAL_DEPOSIT_JPY : null;

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
              Last update: {formatDate(lastUpdate)}
            </span>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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

      {/* Summary Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">USD/JPY:</span>
          <span className="text-gray-900">{usdJpy ? usdJpy.toFixed(2) : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Initial Deposit(JPY):</span>
          <span className="text-gray-900">{formatNumber(INITIAL_DEPOSIT_JPY)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Balance(JPY):</span>
          <span className="text-gray-900">{balanceJpy ? formatNumber(balanceJpy) : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Profit(JPY):</span>
          <span className={profitJpy !== null ? (profitJpy >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold') : 'text-gray-900'}>
            {profitJpy !== null ? formatNumber(profitJpy) : '---'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-1.5 text-left text-sm font-semibold text-gray-700 border-b">
                EA
              </th>
              <th className="px-2 sm:px-4 py-1.5 text-left text-sm font-semibold text-gray-700 border-b">
                Account ID
              </th>
              <th className="hidden sm:table-cell px-4 py-1.5 text-right text-sm font-semibold text-gray-700 border-b">
                Balance
              </th>
              <th className="hidden sm:table-cell px-4 py-1.5 text-right text-sm font-semibold text-gray-700 border-b">
                Profit
              </th>
              <th className="sm:hidden px-2 py-1.5 text-right text-sm font-semibold text-gray-700 border-b">
                Balance / Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-1.5 text-sm text-gray-900 border-b border-gray-200">
                  {account.name}
                </td>
                <td className="px-2 sm:px-4 py-1.5 text-sm text-gray-600 border-b border-gray-200">
                  {account.accountId}
                </td>
                <td className="hidden sm:table-cell px-4 py-1.5 text-sm text-right text-gray-900 border-b border-gray-200 font-mono">
                  {formatCurrency(account.balance, account.currency)}
                </td>
                <td className="hidden sm:table-cell px-4 py-1.5 text-sm text-right border-b border-gray-200">
                  <span
                    className={`font-mono ${
                      account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.profit, account.currency)}
                  </span>
                </td>
                <td className="sm:hidden px-2 py-1.5 text-right border-b border-gray-200">
                  <div className="text-sm text-gray-900 font-mono">
                    {formatCurrency(account.balance, account.currency)}
                  </div>
                  <div
                    className={`text-sm font-mono ${
                      account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.profit, account.currency)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {accounts.length > 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-2 sm:px-4 py-1.5 text-sm font-semibold text-gray-900" colSpan={2}>
                  Total
                </td>
                <td className="hidden sm:table-cell px-4 py-1.5 text-sm text-right font-semibold text-gray-900 font-mono">
                  {formatCurrency(totalBalanceUsd, accounts[0]?.currency || 'USD')}
                </td>
                <td className="hidden sm:table-cell px-4 py-1.5 text-sm text-right">
                  <span
                    className={`font-semibold font-mono ${
                      accounts.reduce((sum, acc) => sum + acc.profit, 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(
                      accounts.reduce((sum, acc) => sum + acc.profit, 0),
                      accounts[0]?.currency || 'USD'
                    )}
                  </span>
                </td>
                <td className="sm:hidden px-2 py-1.5 text-right">
                  <div className="text-sm font-semibold text-gray-900 font-mono">
                    {formatCurrency(totalBalanceUsd, accounts[0]?.currency || 'USD')}
                  </div>
                  <div
                    className={`text-sm font-semibold font-mono ${
                      accounts.reduce((sum, acc) => sum + acc.profit, 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(
                      accounts.reduce((sum, acc) => sum + acc.profit, 0),
                      accounts[0]?.currency || 'USD'
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {accounts.length === 0 && (
        <p className="text-center text-gray-500 py-4">No accounts found</p>
      )}
    </div>
  );
}
