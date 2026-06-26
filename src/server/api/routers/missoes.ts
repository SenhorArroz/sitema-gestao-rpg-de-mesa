// src/server/api/routers/quest.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const questRouter = createTRPCRouter({
  // 1. Buscar Missões (com filtros de visibilidade para jogadores)
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
        select: { mestreId: true },
      });
      const isMestre = mesa?.mestreId === ctx.session.user.id;

      const quests = await ctx.db.quest.findMany({
        where: {
          mesaId: input.mesaId,
          ...(isMestre ? {} : { visivel: true }),
        },
        orderBy: { titulo: "asc" },
      });

      // Se for jogador, filtra subobjetivos invisíveis
      if (!isMestre) {
        return quests.map((q) => {
          try {
            const parsed = JSON.parse(q.objetivo);
            if (parsed && Array.isArray(parsed.subObjetivos)) {
              parsed.subObjetivos = parsed.subObjetivos.filter((sub: any) => sub.visivel === true);
            }
            return {
              ...q,
              objetivo: JSON.stringify(parsed),
            };
          } catch {
            return q;
          }
        });
      }

      return quests;
    }),

  // 2. Criar ou Atualizar Missão (restrito a mestre)
  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        mesaId: z.string(),
        titulo: z.string(),
        status: z.string(),
        descricao: z.string(),
        recompensas: z.string(),
        objetivo: z.string(), // JSON stringificado
        visivel: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
      });
      if (!mesa || mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.quest.upsert({
        where: { id: input.id ?? "new" },
        update: {
          titulo: input.titulo,
          status: input.status,
          descricao: input.descricao,
          recompensas: input.recompensas,
          objetivo: input.objetivo,
          visivel: input.visivel,
        },
        create: {
          mesaId: input.mesaId,
          titulo: input.titulo,
          status: input.status,
          descricao: input.descricao,
          recompensas: input.recompensas,
          objetivo: input.objetivo,
          visivel: input.visivel ?? false,
        },
      });
    }),

  // 3. Deletar Missão (restrito a mestre)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.id },
        include: { mesa: true }
      });
      if (!quest || quest.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }
      return await ctx.db.quest.delete({ where: { id: input.id } });
    }),

  // 4. Mudar visibilidade de uma Missão
  toggleVisibility: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        visivel: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.id },
        include: { mesa: true },
      });
      if (!quest || quest.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.quest.update({
        where: { id: input.id },
        data: { visivel: input.visivel },
      });
    }),

  // 5. Mudar visibilidade de um subobjetivo específico
  toggleSubObjectiveVisibility: protectedProcedure
    .input(
      z.object({
        id: z.string(), // ID da Quest
        subObjectiveId: z.string(),
        visivel: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.id },
        include: { mesa: true },
      });
      if (!quest || quest.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      try {
        const parsed = JSON.parse(quest.objetivo);
        if (parsed && Array.isArray(parsed.subObjetivos)) {
          parsed.subObjetivos = parsed.subObjetivos.map((sub: any) => {
            if (sub.id === input.subObjectiveId) {
              return { ...sub, visivel: input.visivel };
            }
            return sub;
          });
        }
        
        return await ctx.db.quest.update({
          where: { id: input.id },
          data: { objetivo: JSON.stringify(parsed) },
        });
      } catch (err) {
        throw new Error("Falha ao atualizar visibilidade do subobjetivo");
      }
    }),
});