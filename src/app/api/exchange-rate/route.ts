import { NextResponse } from 'next/server';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// Get proxy from environment
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

// Custom fetch that uses proxy
async function proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (proxyAgent) {
    return undiciFetch(url, {
      ...options,
      dispatcher: proxyAgent,
    } as Parameters<typeof undiciFetch>[1]) as unknown as Response;
  }
  return fetch(url, options);
}

export async function GET() {
  try {
    const response = await proxyFetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
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
