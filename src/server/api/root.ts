import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { mesaRouter } from "./routers/mesa";
import { bestiarioRouter } from "./routers/bestiario";
import { questRouter } from "./routers/missoes";
import { npcRouter } from "./routers/npcs";
import { itemRouter } from "./routers/item";	
import { fichaRouter } from "./routers/ficha";
import { personagemRouter } from "./routers/personagem";
import { notaRouter } from "./routers/nota";
import { batalhaRouter } from "./routers/batalha";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	mesa: mesaRouter,
	bestiario: bestiarioRouter,
	quest: questRouter,
	npc: npcRouter,
	ficha: fichaRouter,
	item: itemRouter,
	personagem: personagemRouter,
	nota: notaRouter,
	batalha: batalhaRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
