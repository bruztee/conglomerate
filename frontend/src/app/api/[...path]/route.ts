import { NextRequest, NextResponse } from 'next/server';

const WORKER_API_URL = 'https://conglomerate-api.ravencwr3476.workers.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToWorker(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToWorker(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToWorker(request, params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToWorker(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToWorker(request, params, 'DELETE');
}

async function proxyToWorker(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params;
    const pathStr = path.join('/');
    
    // ВАЖЛИВО: Додаємо /api/ prefix бо він вже видалений з path
    const url = new URL(`/api/${pathStr}`, WORKER_API_URL);
    
    // Copy search params
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Prepare headers
    const headers = new Headers();
    
    // Copy relevant headers from client request
    const headersToForward = ['content-type', 'authorization'];
    headersToForward.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // КРИТИЧНО: Передаємо cookies від клієнта до Worker
    const cookieHeader = request.headers.get('cookie');
    console.log(`🍪 Request cookies to Worker:`, cookieHeader ? 'present' : 'MISSING');
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }

    // Set origin for CORS
    headers.set('origin', request.nextUrl.origin);

    // Prepare body
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          body = JSON.stringify(await request.json());
        } catch (e) {
          // Body already consumed or empty
          body = undefined;
        }
      } else {
        body = await request.text();
      }
    }

    console.log(`🔄 Proxying ${method} /api/${pathStr} to Worker`);

    // Make request to Worker
    const workerResponse = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    console.log(`📥 Worker response: ${workerResponse.status} ${workerResponse.statusText}`);

    // Prepare response
    const responseData = await workerResponse.text();
    const response = new NextResponse(responseData, {
      status: workerResponse.status,
      statusText: workerResponse.statusText,
      headers: {
        'Content-Type': workerResponse.headers.get('content-type') || 'application/json',
      }
    });

    // Copy response headers (excluding set-cookie, we handle it separately)
    workerResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip headers that Next.js handles automatically or we handle separately
      if (!['content-encoding', 'transfer-encoding', 'connection', 'set-cookie'].includes(lowerKey)) {
        response.headers.set(key, value);
      }
    });

    // КРИТИЧНО: Передаємо ВСІ Set-Cookie headers від Worker до клієнта
    // headers.getSetCookie() повертає масив всіх Set-Cookie headers
    const setCookieHeaders = workerResponse.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie);
      });
      console.log(`🍪 Set-Cookie forwarded (${setCookieHeaders.length} cookies)`);
    } else {
      console.log('⚠️ No Set-Cookie headers from Worker');
    }

    return response;
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'PROXY_ERROR', 
          message: `Failed to proxy request to Worker: ${error instanceof Error ? error.message : 'Unknown error'}` 
        } 
      },
      { status: 500 }
    );
  }
}
