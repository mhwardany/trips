import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

export async function POST(request: NextRequest) {
  if (!GAS_URL) {
    return NextResponse.json(
      { ok: false, data: null, error: { code: 'CONFIG', message: 'API URL not configured (NEXT_PUBLIC_GAS_URL).' } },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action;
    
    // Read HttpOnly cookie if present
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    // Inject token into payload sent to GAS
    const payloadToGAS = {
      action: action,
      token: cookieToken || body.token || '',
      payload: body.payload || {}
    };

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payloadToGAS),
    });

    const json = await res.json();

    const response = NextResponse.json(json);

    // If login was successful, intercept the token and set the HttpOnly cookie
    if (action === 'auth.login' && json.ok && json.data?.token) {
      const token = json.data.token;
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days (matches GAS session length)
      });
      // Replace token with a dummy string for the frontend to satisfy existing checks
      json.data.token = 'PROXY_AUTH';
      return NextResponse.json(json, { headers: response.headers });
    }

    // If logout was called, or auth failed with clear signal, clear the cookie
    if (action === 'auth.logout' || (!json.ok && ['AUTH_REQUIRED', 'UNAUTHORIZED'].includes(json.error?.code))) {
      response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0),
      });
      return NextResponse.json(json, { headers: response.headers });
    }

    return response;
  } catch (err) {
    console.error('Proxy Error:', err);
    return NextResponse.json(
      { ok: false, data: null, error: { code: 'NETWORK', message: 'Proxy Network error' } },
      { status: 500 }
    );
  }
}
