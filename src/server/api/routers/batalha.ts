import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const batalhaRouter = createTRPCRouter({
  // 1. Buscar todos os mapas de uma mesa
  getMaps: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.batalhaMapa.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // 2. Salvar ou atualizar um mapa (Upsert)
  saveMap: protectedProcedure
    .input(
      z.object({
        mesaId: z.string(),
        nome: z.string().min(1, "O nome do mapa é obrigatório"),
        data: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const map = await ctx.db.batalhaMapa.upsert({
        where: {
          mesaId_nome: {
            mesaId: input.mesaId,
            nome: input.nome,
          },
        },
        update: {
          data: input.data,
        },
        create: {
          mesaId: input.mesaId,
          nome: input.nome,
          data: input.data,
        },
      });

      // Se a mesa não tem mapa ativo, define este como ativo
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
        select: { activeMapaId: true },
      });
      if (mesa && !mesa.activeMapaId) {
        await ctx.db.mesa.update({
          where: { id: input.mesaId },
          data: { activeMapaId: map.id },
        });
      }

      return map;
    }),

  // 3. Deletar um mapa
  deleteMap: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.batalhaMapa.delete({
        where: { id: input.id },
      });
    }),

  // 4. Buscar o mapa tático ativo de uma mesa
  getActiveMap: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
        select: { activeMapaId: true },
      });
      if (!mesa?.activeMapaId) return null;

      return await ctx.db.batalhaMapa.findUnique({
        where: { id: mesa.activeMapaId },
      });
    }),

  // 5. Definir qual mapa está ativo na mesa
  setActiveMap: protectedProcedure
    .input(z.object({ mesaId: z.string(), id: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
      });
      if (!mesa || mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.mesa.update({
        where: { id: input.mesaId },
        data: { activeMapaId: input.id },
      });
    }),

  // 6. Atualizar os dados do mapa tático ativo (usado para movimentos em tempo real)
  updateActiveMapData: protectedProcedure
    .input(
      z.object({
        mesaId: z.string(),
        mapId: z.string(),
        data: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
        select: { mestreId: true },
      });
      if (!mesa) throw new Error("Mesa não encontrada");
      
      const isMestre = mesa.mestreId === ctx.session.user.id;
      if (!isMestre) {
        // Jogador precisa estar vinculado a algum personagem da mesa
        const char = await ctx.db.personagem.findFirst({
          where: { mesaId: input.mesaId, userId: ctx.session.user.id }
        });
        if (!char) {
          throw new Error("Não autorizado a mover nesta mesa");
        }
      }

      return await ctx.db.batalhaMapa.update({
        where: { id: input.mapId },
        data: { data: input.data },
      });
    }),
});
