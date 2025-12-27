import { NextResponse } from 'next/server';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Custom fetch that uses SOCKS5 proxy
async function proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  
  if (proxyUrl) {
    console.log('[ExchangeRate] Using SOCKS proxy:', proxyUrl.replace(/:[^:@]+@/, ':****@'));
    try {
      const socksUrl = proxyUrl.replace(/^http:\/\//, 'socks5://');
      const agent = new SocksProxyAgent(socksUrl);
      
      const response = await fetch(url, {
        ...options,
        // @ts-expect-error - agent is valid for Node.js fetch
        agent,
      });
      return response;
    } catch (error) {
      console.error('[ExchangeRate] Proxy fetch error:', error instanceof Error ? error.message : error);
      throw error;
    }
  }
  
  return fetch(url, options);
}

export async function GET() {
  try {
    // Frankfurter API (ECB rates, free, no API key required)
    const response = await proxyFetch(
      'https://api.frankfurter.app/latest?from=USD&to=JPY',
      { cache: 'no-store' } as RequestInit
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const usdJpy = data.rates?.JPY;

    if (!usdJpy) {
      throw new Error('JPY rate not found');
    }

    return NextResponse.json({
      success: true,
      rate: usdJpy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ExchangeRate] Error:', errorMessage);

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
