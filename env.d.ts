/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DATABASE_URL: string;
  NEXT_PUBLIC_ENABLE_LIVE_UPI?: string;
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXT_PUBLIC_ENABLE_LIVE_UPI?: string;
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_RUNTIME?: 'nodejs' | 'edge';
  }
}
