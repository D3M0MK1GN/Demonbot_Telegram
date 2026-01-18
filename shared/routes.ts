import { z } from 'zod';
import { 
  insertUserSchema, 
  insertCaseSchema, 
  insertEvidenceSchema, 
  insertReportedNumberSchema,
  insertMessageSchema,
  users, cases, evidences, reportedNumbers, botInteractions, messages
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
        200: z.object({
          totalUsers: z.number(),
          totalCases: z.number(),
          activeUsers: z.number(),
          newCasesToday: z.number(),
          casesInProcess: z.number(),
          totalAmountLost: z.number(),
          casesResolved: z.number(),
        }),
      },
    },
    byType: {
      method: 'GET' as const,
      path: '/api/stats/by-type',
      responses: {
        200: z.array(z.object({
          type: z.string(),
          count: z.number(),
          fill: z.string().optional(),
        })),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/stats/history',
      responses: {
        200: z.array(z.object({
          date: z.string(),
          count: z.number(),
        })),
      },
    },
  },
  cases: {
    list: {
      method: 'GET' as const,
      path: '/api/cases',
      input: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof cases.$inferSelect & { user: typeof users.$inferSelect | null }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cases/:id',
      responses: {
        200: z.custom<typeof cases.$inferSelect & { user: typeof users.$inferSelect | null; evidences: typeof evidences.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cases',
      input: insertCaseSchema,
      responses: {
        201: z.custom<typeof cases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/cases/:id/status',
      input: z.object({ status: z.enum(["nuevo", "en_proceso", "denunciado", "resuelto", "cerrado"]) }),
      responses: {
        200: z.custom<typeof cases.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    messages: {
      list: {
        method: 'GET' as const,
        path: '/api/cases/:id/messages',
        responses: {
          200: z.array(z.custom<typeof messages.$inferSelect>()),
          404: errorSchemas.notFound,
        },
      },
      send: {
        method: 'POST' as const,
        path: '/api/cases/:id/messages',
        input: z.object({ content: z.string() }),
        responses: {
          201: z.custom<typeof messages.$inferSelect>(),
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
        200: z.array(z.custom<typeof users.$inferSelect & { lastActive: string }>()),
      },
    },
  },
  reportedNumbers: {
    top: {
      method: 'GET' as const,
      path: '/api/reported-numbers/top',
      responses: {
        200: z.array(z.custom<typeof reportedNumbers.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
