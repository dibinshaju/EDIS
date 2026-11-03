declare module '@vercel/node' {
  import type { IncomingMessage, ServerResponse } from 'http';

  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] | undefined };
    cookies: { [key: string]: string };
    body: any;
  }

  export interface VercelResponse extends ServerResponse {
    send: (body: any) => VercelResponse;
    json: (jsonBody: any) => VercelResponse;
    status: (statusCode: number) => VercelResponse;
    redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
  }
}

declare module 'firebase-admin' {
  export function initializeApp(options?: any): any;
  export function firestore(): any;
  export function auth(): any;
  export const apps: any[];
  export const credential: {
    cert: (serviceAccount: any) => any;
  };
}
