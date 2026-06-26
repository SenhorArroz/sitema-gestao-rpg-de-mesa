import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Função utilitária para transformar "A Coroa Esquecida" em "a-coroa-esquecida"
function slugify(texto: string) {
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-") // Troca espaços e caracteres especiais por hífen
    .replace(/(^-|-$)+/g, ""); // Remove hifens nas pontas
}

export const mesaRouter = createTRPCRouter({
  // 0. GET: Buscar uma mesa específica pelo ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          nome: true,
          descricao: true,
          codigo: true,
          mestreId: true,
          activeMapaId: true,
          _count: {
            select: {
              personagens: true,
              npcs: true,
              quests: true,
              monstros: true,
              itens: true,
            },
          },
        },
      });
      if (!mesa) return null;
      return {
        ...mesa,
        isMestre: mesa.mestreId === ctx.session.user.id,
      };
    }),

  // 1. GET: Buscar todas as mesas vinculadas (como mestre ou jogador)
  getMesas: protectedProcedure.query(async ({ ctx }) => {
    const mesas = await ctx.db.mesa.findMany({
      where: {
        OR: [
          { mestreId: ctx.session.user.id },
          { personagens: { some: { userId: ctx.session.user.id } } }
        ]
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        codigo: true,
        mestreId: true,
        _count: {
          select: { personagens: true }, // Conta os slots preenchidos
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return mesas;
  }),

  // 2. POST: Criar nova conexão (Mesa)
  criarMesa: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1, "A designação da campanha é obrigatória"),
        descricao: z.string().default("SISTEMA PADRÃO // RPG"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.nome);
      const idSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
      
      const codigoMesa = Math.random().toString(36).substring(2, 8).toUpperCase();

      return ctx.db.mesa.create({
        data: {
          id: idSlug,
          nome: input.nome,
          descricao: input.descricao,
          codigo: codigoMesa || "000000",
          mestreId: ctx.session.user.id,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          mestreId: true,
          _count: {
            select: { personagens: true },
          },
        },
      });
    }),

  // 3. POST: Buscar mesa por código e listar personagens disponíveis
  buscarPorCodigo: protectedProcedure
    .input(z.object({ codigo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mesa = await ctx.db.mesa.findUnique({
        where: { codigo: input.codigo.toUpperCase() },
        include: {
          personagens: {
            where: { userId: null },
            select: {
              id: true,
              nome: true,
              conceito: true,
            }
          }
        }
      });
      return mesa;
    }),
});