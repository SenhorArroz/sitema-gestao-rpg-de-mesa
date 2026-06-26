// src/server/api/routers/nota.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const CategoriaEnum = z.enum(["NPC", "LOCAL", "PISTA", "EVENTO", "MISSAO", "FACCAO", "ITEM", "LIVRE"]);
const AmeacaEnum = z.enum(["CRITICO", "ELEVADO", "INFORMATIVO"]);
const StatusPistaEnum = z.enum(["CATALOGADA", "PENDENTE", "DESCONHECIDA"]);
const TimelineTipoEnum = z.enum(["SESSAO", "LORE_PASSADO", "INCIDENTE"]);

export const notaRouter = createTRPCRouter({
  /* ─── DOSSIÊS ─── */
  getDossies: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.dossie.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { createdAt: "desc" },
      });
    }),

  upsertDossie: protectedProcedure
    .input(z.object({
      id: z.string().optional(), mesaId: z.string(), refCode: z.string(), titulo: z.string(),
      categoria: CategoriaEnum, ameaca: AmeacaEnum, statusPista: StatusPistaEnum.optional().nullable(),
      conteudo: z.string(), dataRegistro: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.dossie.upsert({
        where: { id: input.id ?? "new" },
        update: input,
        create: {
          mesaId: input.mesaId, refCode: input.refCode, titulo: input.titulo,
          categoria: input.categoria, ameaca: input.ameaca, statusPista: input.statusPista,
          conteudo: input.conteudo, dataRegistro: input.dataRegistro,
        },
      });
    }),

  deleteDossie: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.dossie.delete({ where: { id: input.id } });
    }),

  /* ─── MURAL (POST-ITS) ─── */
  getPostIts: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.postIt.findMany({ where: { mesaId: input.mesaId } });
    }),

  upsertPostIt: protectedProcedure
    .input(z.object({
      id: z.string().optional(), mesaId: z.string(), texto: z.string(), cor: z.string(), degradado: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.postIt.upsert({
        where: { id: input.id ?? "new" }, update: input,
        create: { mesaId: input.mesaId, texto: input.texto, cor: input.cor, degradado: input.degradado },
      });
    }),

  deletePostIt: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.postIt.delete({ where: { id: input.id } });
    }),

  /* ─── TIMELINE ─── */
  getTimeline: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.timelineEvento.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { ordenacao: "asc" },
      });
    }),

  upsertTimeline: protectedProcedure
    .input(z.object({
      id: z.string().optional(), mesaId: z.string(), timestamp: z.string(),
      titulo: z.string(), relato: z.string(), tipo: TimelineTipoEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.timelineEvento.upsert({
        where: { id: input.id ?? "new" }, update: input,
        create: { mesaId: input.mesaId, timestamp: input.timestamp, titulo: input.titulo, relato: input.relato, tipo: input.tipo },
      });
    }),

  deleteTimeline: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.timelineEvento.delete({ where: { id: input.id } });
    }),

  /* ─── MATRIZ DE CONSPIRAÇÃO ─── */
  getConspiracao: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const nos = await ctx.db.conspiracaoNo.findMany({ where: { mesaId: input.mesaId } });
      const nosIds = nos.map(n => n.id);
      const fios = await ctx.db.conspiracaoFio.findMany({
        where: { origemId: { in: nosIds } }
      });
      return { nos, fios };
    }),

  upsertNo: protectedProcedure
    .input(z.object({
      id: z.string().optional(), mesaId: z.string(), lbl: z.string(), tipo: z.string(), cor: z.string(), x: z.string(), y: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.conspiracaoNo.upsert({
        where: { id: input.id ?? "new" }, update: input,
        create: { mesaId: input.mesaId, lbl: input.lbl, tipo: input.tipo, cor: input.cor, x: input.x, y: input.y }
      });
    }),

  deleteNo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.conspiracaoNo.delete({ where: { id: input.id } });
    }),

  createFio: protectedProcedure
    .input(z.object({ origemId: z.string(), destinoId: z.string(), nota: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.conspiracaoFio.create({ data: input });
    }),

  deleteFio: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.conspiracaoFio.delete({ where: { id: input.id } });
    }),
});