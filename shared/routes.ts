import { z } from 'zod';
import { 
  insertCaseSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard',
      responses: {
        200: z.any(),
      },
    },
    byType: {
      method: 'GET' as const,
      path: '/api/stats/by-type',
      responses: {
        200: z.array(z.any()),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/stats/history',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  cases: {
    list: {
      method: 'GET' as const,
      path: '/api/cases',
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cases/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cases',
      input: insertCaseSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/cases/:id/status',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    messages: {
      list: {
        method: 'GET' as const,
        path: '/api/cases/:id/messages',
        responses: {
          200: z.array(z.any()),
          404: errorSchemas.notFound,
        },
      },
      send: {
        method: 'POST' as const,
        path: '/api/cases/:id/messages',
        input: z.object({ content: z.string() }),
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
    },
  },
  users: {
    active: {
      method: 'GET' as const,
      path: '/api/users/active',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  reportedNumbers: {
    top: {
      method: 'GET' as const,
      path: '/api/reported-numbers/top',
      responses: {
        200: z.array(z.any()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
