// import { Context } from 'telegraf';

// export interface SessionData {
//   __scenes: {
//     current: string | null;
//     state: object;
//   };
// }

// declare module 'telegraf' {
//   interface Context {
//     session: SessionData;
//   }
// }

// const sessions = new Map<number, SessionData>();

// export const sessionMiddleware =
//   () => (ctx: Context, next: () => Promise<void>) => {
//     const userId = ctx.from?.id;

//     if (!userId) {
//       return next();
//     }

//     if (!sessions.has(userId)) {
//       sessions.set(userId, {
//         __scenes: {
//           current: null,
//           state: {},
//         },
//       });
//     }

//     ctx.session = sessions.get(userId)!;

//     return next();
//   };
