import type { ApiResponse } from '../types';

export function jsonResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  headers: Record<string, string> = {}
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://conglomerate-eight.vercel.app/',
    'https://www.conglomerate-g.com',
    'https://conglomerate-g.com',
  ];
  
  // Allow all Vercel preview and production URLs
  const isVercelDomain = origin && origin.includes('.vercel.app');
  const isAllowed = origin && (allowedOrigins.includes(origin) || isVercelDomain);
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  headers['Access-Control-Max-Age'] = '86400';
  
  return headers;
}
