import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ItemTipo, ItemRaridade } from "../../../../generated/prisma";

export const itemRouter = createTRPCRouter({
  // Retorna todos os artefatos vinculados à mesa tática
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.item.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { nome: "asc" },
      });
    }),

  // Sincroniza ou instancia um novo item no banco
  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        mesaId: z.string(),
        nome: z.string(),
        tipo: z.nativeEnum(ItemTipo),
        raridade: z.nativeEnum(ItemRaridade),
        valor: z.string(),
        peso: z.string(),
        efeito: z.string(),
        descricao: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.item.upsert({
        where: { id: input.id ?? "new" },
        update: {
          nome: input.nome,
          tipo: input.tipo,
          raridade: input.raridade,
          valor: input.valor,
          peso: input.peso,
          efeito: input.efeito,
          descricao: input.descricao,
        },
        create: {
          mesaId: input.mesaId,
          nome: input.nome,
          tipo: input.tipo,
          raridade: input.raridade,
          valor: input.valor,
          peso: input.peso,
          efeito: input.efeito,
          descricao: input.descricao,
        },
      });
    }),

  // Expuga o registro do item permanentemente
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.item.delete({
        where: { id: input.id },
      });
    }),
});