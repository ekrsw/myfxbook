import { NextResponse } from 'next/server';

const MYFXBOOK_API_BASE = 'https://www.myfxbook.com/api';

interface MyfxbookAccount {
  id: number;
  name: string;
  accountId: number;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  withdrawals: number;
  deposits: number;
  interest: number;
  profit: number;
  balance: number;
  drawdown: number;
  equity: number;
  equityPercent: number;
  demo: boolean;
  lastUpdateDate: string;
  creationDate: string;
  firstTradeDate: string;
  currency: string;
  profitFactor: number;
  pips: number;
}

interface LoginResponse {
  error: boolean;
  message: string;
  session?: string;
}

interface AccountsResponse {
  error: boolean;
  message: string;
  accounts?: MyfxbookAccount[];
}

// Cache session - sessions are IP-bound and last 1 month
let cachedSession: string | null = null;

async function login(forceNew: boolean = false): Promise<string> {
  // Return cached session unless force refresh
  if (!forceNew && cachedSession) {
    return cachedSession;
  }

  const email = process.env.MYFXBOOK_EMAIL;
  const password = process.env.MYFXBOOK_PASSWORD;

  if (!email || !password) {
    throw new Error('Myfxbook credentials not configured. Check .env.local file.');
  }

  const loginUrl = `${MYFXBOOK_API_BASE}/login.json?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

  console.log('[Myfxbook] Attempting login...');

  const response = await fetch(loginUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await response.json();

  console.log('[Myfxbook] Login raw response:', JSON.stringify(data, null, 2));

  if (data.error || !data.session) {
    cachedSession = null;
    throw new Error(data.message || 'Login failed');
  }

  cachedSession = data.session;
  console.log('[Myfxbook] Login successful, session cached');

  return data.session;
}

async function getAccounts(session: string): Promise<MyfxbookAccount[]> {
  // Session is already URL-encoded from API response, don't encode again
  const accountsUrl = `${MYFXBOOK_API_BASE}/get-my-accounts.json?session=${session}`;

  console.log('[Myfxbook] Fetching accounts...');

  const response = await fetch(accountsUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  const data: AccountsResponse = await response.json();

  console.log('[Myfxbook] Accounts response:', { error: data.error, message: data.message, accountCount: data.accounts?.length });

  if (data.error) {
    throw new Error(data.message || 'Failed to fetch accounts');
  }

  return data.accounts || [];
}

export async function GET() {
  try {
    // First attempt with cached session
    let session = await login(false);

    try {
      const accounts = await getAccounts(session);

      return NextResponse.json({
        success: true,
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          accountId: account.accountId,
          balance: account.balance,
          equity: account.equity,
          profit: account.profit,
          gain: account.gain,
          daily: account.daily,
          monthly: account.monthly,
          drawdown: account.drawdown,
          currency: account.currency,
          demo: account.demo,
          lastUpdateDate: account.lastUpdateDate,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (accountError) {
      // If session invalid, retry with fresh login
      const errorMsg = accountError instanceof Error ? accountError.message : '';

      if (errorMsg.toLowerCase().includes('session')) {
        console.log('[Myfxbook] Session invalid, retrying with fresh login...');
        cachedSession = null;
        session = await login(true);
        const accounts = await getAccounts(session);

        return NextResponse.json({
          success: true,
          accounts: accounts.map((account) => ({
            id: account.id,
            name: account.name,
            accountId: account.accountId,
            balance: account.balance,
            equity: account.equity,
            profit: account.profit,
            gain: account.gain,
            daily: account.daily,
            monthly: account.monthly,
            drawdown: account.drawdown,
            currency: account.currency,
            demo: account.demo,
            lastUpdateDate: account.lastUpdateDate,
          })),
          timestamp: new Date().toISOString(),
        });
      }

      throw accountError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Myfxbook] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Clear cache endpoint for debugging
export async function DELETE() {
  cachedSession = null;
  return NextResponse.json({ success: true, message: 'Session cache cleared' });
}
