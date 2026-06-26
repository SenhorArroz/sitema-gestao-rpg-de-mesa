import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const npcRouter = createTRPCRouter({
  // 1. Buscar NPCs (com filtro de visibilidade para jogadores)
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
        select: { mestreId: true },
      });
      const isMestre = mesa?.mestreId === ctx.session.user.id;

      const npcs = await ctx.db.nPC.findMany({
        where: {
          mesaId: input.mesaId,
          ...(isMestre ? {} : { visivel: true }),
        },
        orderBy: { nome: "asc" },
      });

      if (isMestre) return npcs;

      return npcs.map((n) => {
        try {
          const parsed = JSON.parse(n.notas) as { descricao?: string; segredos?: string };
          return {
            ...n,
            notas: JSON.stringify({ descricao: parsed.descricao ?? "", segredos: "" }),
          };
        } catch {
          return n;
        }
      });
    }),

  // 2. Criar ou Atualizar NPC (restrito a mestre)
  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        mesaId: z.string(),
        nome: z.string(),
        papel: z.string(),
        localizacao: z.string(),
        status: z.string(), // Afinidade + Status: "ALIADO_VIVO"
        notas: z.string(),  // Descrição + Segredos em JSON
        visivel: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.mesaId },
      });
      if (!mesa || mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado a gerenciar NPCs");
      }

      return await ctx.db.nPC.upsert({
        where: { id: input.id ?? "new" },
        update: {
          nome: input.nome,
          papel: input.papel,
          localizacao: input.localizacao,
          status: input.status,
          notas: input.notas,
          visivel: input.visivel,
        },
        create: {
          mesaId: input.mesaId,
          nome: input.nome,
          papel: input.papel,
          localizacao: input.localizacao,
          status: input.status,
          notas: input.notas,
          visivel: input.visivel ?? false,
        },
      });
    }),

  // 3. Deletar NPC (restrito a mestre)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const npc = await ctx.db.nPC.findUnique({
        where: { id: input.id },
        include: { mesa: true }
      });
      if (!npc || npc.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }
      return await ctx.db.nPC.delete({ where: { id: input.id } });
    }),

  // 4. Mudar visibilidade de um NPC para os jogadores
  toggleVisibility: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        visivel: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const npc = await ctx.db.nPC.findUnique({
        where: { id: input.id },
        include: { mesa: true },
      });
      if (!npc || npc.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.nPC.update({
        where: { id: input.id },
        data: { visivel: input.visivel },
      });
    }),
});