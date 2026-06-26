import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const fichaRouter = createTRPCRouter({
  // Busca todos os modelos de ficha da mesa
  getAll: protectedProcedure
    .input(z.object({ mesaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.modeloFicha.findMany({
        where: { mesaId: input.mesaId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Cria ou Atualiza um modelo de ficha
  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        mesaId: z.string(),
        nome: z.string(),
        sistema: z.string(),
        blocos: z.any(), // O Array de blocos (Prisma Json column aceita objetos direto)
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.modeloFicha.upsert({
        where: { id: input.id ?? "new" },
        update: {
          nome: input.nome,
          sistema: input.sistema,
          blocos: input.blocos,
        },
        create: {
          mesaId: input.mesaId,
          nome: input.nome,
          sistema: input.sistema,
          blocos: input.blocos,
        },
      });
    }),

  // Deleta o modelo (e os personagens vinculados a ele)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Primeiro, busca os personagens que usam este modelo
      const personagens = await ctx.db.personagem.findMany({
        where: { modeloId: input.id },
        select: { id: true },
      });

      // Apaga o inventário de cada personagem vinculado
      if (personagens.length > 0) {
        await ctx.db.inventarioPersonagem.deleteMany({
          where: { personagemId: { in: personagens.map(p => p.id) } },
        });

        // Apaga os personagens vinculados
        await ctx.db.personagem.deleteMany({
          where: { modeloId: input.id },
        });
      }

      // Agora sim, apaga o modelo
      return await ctx.db.modeloFicha.delete({
        where: { id: input.id },
      });
    }),
});