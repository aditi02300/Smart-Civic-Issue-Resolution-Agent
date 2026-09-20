import { useEffect, useState } from 'react';

type Page = 'welcome' | 'auth' | 'landing' | 'report' | 'track' | 'admin';

interface RouterState {
  page: Page;
  params: Record<string, string>;
}

function parseHash(): RouterState {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  const params: Record<string, string> = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((v, k) => { params[k] = v; });
  }
  if (path === '/welcome') return { page: 'welcome', params };
  if (path === '/auth') return { page: 'auth', params };
  if (path === '/report') return { page: 'report', params };
  if (path === '/track') return { page: 'track', params };
  if (path === '/admin') return { page: 'admin', params };
  if (path === '/landing') return { page: 'landing', params };
  return { page: 'welcome', params };
}

export function navigate(page: Page, params: Record<string, string> = {}) {
  const path = page === 'welcome' ? '/welcome' : `/${page}`;
  const qs = new URLSearchParams(params).toString();
  window.location.hash = qs ? `${path}?${qs}` : path;
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(parseHash);

  useEffect(() => {
    const handler = () => setState(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return state;
}
