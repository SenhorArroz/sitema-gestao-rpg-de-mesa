// src/server/api/routers/personagem.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const personagemRouter = createTRPCRouter({
  // 1. Busca todos os personagens da mesa, incluindo os itens vinculados e o modelo
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.personagem.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { nome: "asc" },
        include: {
          inventario: {
            include: {
              item: true, // Puxa os dados reais do item (nome, raridade, tipo)
            },
          },
          modelo: true, // Puxa os dados do template base
        },
      });
    }),

  // 2. Cria ou sincroniza os dados do personagem (com trava de segurança para jogador)
  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        mesaId: z.string(),
        modeloId: z.string(),
        nome: z.string(),
        conceito: z.string(),
        hpAtual: z.number(),
        hpMax: z.number(),
        recLabel: z.string(),
        recAtual: z.number(),
        recMax: z.number(),
        atributos: z.any(), // Recebe o Array de Objetos diretamente para o campo JSON
        pericias: z.any(),  // Recebe o Array de Objetos diretamente para o campo JSON
        anotacoesMestre: z.string().optional(),
        inventario: z.array(
          z.object({
            itemId: z.string(),
            quantidade: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let isMestre = true;
      let existingChar = null;

      if (input.id) {
        existingChar = await ctx.db.personagem.findUnique({
          where: { id: input.id },
          include: { mesa: true },
        });
        if (existingChar) {
          isMestre = existingChar.mesa.mestreId === ctx.session.user.id;
          if (!isMestre && existingChar.userId !== ctx.session.user.id) {
            throw new Error("Não autorizado a editar este personagem");
          }
        }
      }

      const finalAnotacoes = isMestre ? input.anotacoesMestre : (existingChar?.anotacoesMestre ?? undefined);

      if (input.id && existingChar) {
        return await ctx.db.personagem.update({
          where: { id: input.id },
          data: {
            nome: input.nome,
            conceito: input.conceito,
            hpAtual: input.hpAtual,
            hpMax: input.hpMax,
            recLabel: input.recLabel,
            recAtual: input.recAtual,
            recMax: input.recMax,
            atributos: input.atributos,
            pericias: input.pericias,
            anotacoesMestre: finalAnotacoes,
            ...(isMestre ? {
              inventario: {
                deleteMany: {},
                create: input.inventario.map((i) => ({
                  itemId: i.itemId,
                  quantidade: i.quantidade,
                })),
              }
            } : {})
          }
        });
      } else {
        const mesa = await ctx.db.mesa.findUnique({ where: { id: input.mesaId } });
        if (mesa?.mestreId !== ctx.session.user.id) {
          throw new Error("Apenas o mestre pode instanciar personagens");
        }

        return await ctx.db.personagem.create({
          data: {
            mesaId: input.mesaId,
            modeloId: input.modeloId,
            nome: input.nome,
            conceito: input.conceito,
            hpAtual: input.hpAtual,
            hpMax: input.hpMax,
            recLabel: input.recLabel,
            recAtual: input.recAtual,
            recMax: input.recMax,
            atributos: input.atributos,
            pericias: input.pericias,
            anotacoesMestre: input.anotacoesMestre,
            inventario: {
              create: input.inventario.map((i) => ({
                itemId: i.itemId,
                quantidade: i.quantidade,
              })),
            },
          },
        });
      }
    }),

  // 3. Atualiza HP do personagem
  updateHP: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        hpAtual: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const char = await ctx.db.personagem.findUnique({
        where: { id: input.id },
        include: { mesa: true }
      });
      if (!char) throw new Error("Personagem não encontrado");
      const isMestre = char.mesa.mestreId === ctx.session.user.id;
      if (!isMestre && char.userId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.personagem.update({
        where: { id: input.id },
        data: { hpAtual: input.hpAtual },
      });
    }),

  // 4. Deleta o personagem (morte definitiva)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const char = await ctx.db.personagem.findUnique({
        where: { id: input.id },
        include: { mesa: true }
      });
      if (!char) throw new Error("Personagem não encontrado");
      if (char.mesa.mestreId !== ctx.session.user.id) {
        throw new Error("Apenas o mestre pode expurgar personagens");
      }

      return await ctx.db.personagem.delete({
        where: { id: input.id },
      });
    }),

  // 5. Reivindicar personagem (vincular ao usuário jogador)
  reivindicar: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const char = await ctx.db.personagem.findUnique({
        where: { id: input.id },
      });
      if (!char) throw new Error("Personagem não encontrado");
      if (char.userId) throw new Error("Personagem já reivindicado");

      return await ctx.db.personagem.update({
        where: { id: input.id },
        data: { userId: ctx.session.user.id },
      });
    }),

  // 6. Desvincular personagem
  desvincular: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const char = await ctx.db.personagem.findUnique({
        where: { id: input.id },
        include: { mesa: true }
      });
      if (!char) throw new Error("Personagem não encontrado");
      const isMestre = char.mesa.mestreId === ctx.session.user.id;
      if (!isMestre && char.userId !== ctx.session.user.id) {
        throw new Error("Não autorizado");
      }

      return await ctx.db.personagem.update({
        where: { id: input.id },
        data: { userId: null },
      });
    }),
});