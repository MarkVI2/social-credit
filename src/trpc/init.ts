import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { headers } from 'next/headers';
import { getUserFromAuthHeader, requireAdmin } from '@/lib/auth';
import type { User } from '@/types/user';
import { NextRequest } from 'next/server';

// Create context with user authentication
export const createTRPCContext = cache(async () => {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization') || headersList.get('Authorization');
    const cookieHeader = headersList.get('cookie');
    
    // Create a mock NextRequest to use existing auth functions
    const mockRequest = {
      headers: new Headers({
        'authorization': authHeader || '',
        'cookie': cookieHeader || ''
      }),
      cookies: {
        get: (name: string) => {
          if (!cookieHeader) return undefined;
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map((c: string) => {
              const [key, ...v] = c.split('=');
              return [key, v.join('=')];
            })
          );
          return cookies[name] ? { value: cookies[name] } : undefined;
        }
      }
    } as unknown as NextRequest;

    const user = await getUserFromAuthHeader(mockRequest);
    return { 
      user,
      isAuthenticated: !!user,
      isAdmin: requireAdmin(user)
    };
  } catch (error) {
    console.error('createTRPCContext error:', error);
    return { 
      user: null,
      isAuthenticated: false,
      isAdmin: false
    };
  }
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Public procedure - no authentication required
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as User, // Type assertion since we know user exists
    },
  });
});

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin privileges required' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as User, // Type assertion since we know user exists and is admin
    },
  });
});

// For backward compatibility
export const baseProcedure = publicProcedure;