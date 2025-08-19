'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCookies() {
  const [cookies, setCookiesState] = useState<Record<string, string>>(() => {
    if (typeof document === 'undefined') return {};
    
    const cookieObj: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookieObj[name] = decodeURIComponent(value);
      }
    });
    return cookieObj;
  });

  const getCookie = useCallback((name: string): string | undefined => {
    return cookies[name];
  }, [cookies]);

  const setCookie = useCallback((
    name: string,
    value: string,
    options: {
      expires?: Date | number;
      maxAge?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      httpOnly?: boolean;
    } = {}
  ) => {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options.expires) {
      if (typeof options.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
        cookieString += `; expires=${date.toUTCString()}`;
      } else {
        cookieString += `; expires=${options.expires.toUTCString()}`;
      }
    }

    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += `; secure`;
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;

    // Update local state
    setCookiesState(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const removeCookie = useCallback((
    name: string,
    options: {
      path?: string;
      domain?: string;
    } = {}
  ) => {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    document.cookie = cookieString;

    // Update local state
    setCookiesState(prev => {
      const newCookies = { ...prev };
      delete newCookies[name];
      return newCookies;
    });
  }, []);

  // Sync with document.cookie changes (for external cookie modifications)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const syncCookies = () => {
      const cookieObj: Record<string, string> = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookieObj[name] = decodeURIComponent(value);
        }
      });
      setCookiesState(cookieObj);
    };

    // Check for changes periodically
    const interval = setInterval(syncCookies, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    cookies,
    getCookie,
    setCookie,
    removeCookie,
  };
}
