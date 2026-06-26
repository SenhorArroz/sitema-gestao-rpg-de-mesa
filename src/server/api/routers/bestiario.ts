import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bestiarioRouter = createTRPCRouter({
  // Busca monstros de uma mesa específica
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.monstro.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { nome: "asc" },
      });
    }),

  // Cria ou Atualiza um monstro
  upsert: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      mesaId: z.string(),
      nome: z.string(),
      tipo: z.string(),
      ameaca: z.string(),
      hp: z.number(),
      atributos: z.any(), // JSON
      habilidades: z.any(), // JSON
      descricao: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.monstro.upsert({
        where: { id: input.id ?? "new" },
        update: input,
        create: {
          mesaId: input.mesaId,
          nome: input.nome,
          tipo: input.tipo,
          ameaca: input.ameaca,
          hp: input.hp,
          atributos: input.atributos,
          habilidades: input.habilidades,
          descricao: input.descricao,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.monstro.delete({ where: { id: input.id } });
    }),
});