-- CreateEnum
CREATE TYPE "ItemTipo" AS ENUM ('ARMA', 'ARMADURA', 'CONSUMIVEL', 'QUEST', 'MISC');

-- CreateEnum
CREATE TYPE "ItemRaridade" AS ENUM ('COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO');

-- CreateEnum
CREATE TYPE "NotaCategoria" AS ENUM ('NPC', 'LOCAL', 'PISTA', 'EVENTO', 'MISSAO', 'FACCAO', 'ITEM', 'LIVRE');

-- CreateEnum
CREATE TYPE "NivelAmeaca" AS ENUM ('CRITICO', 'ELEVADO', 'INFORMATIVO');

-- CreateEnum
CREATE TYPE "StatusPista" AS ENUM ('CATALOGADA', 'PENDENTE', 'DESCONHECIDA');

-- CreateEnum
CREATE TYPE "TimelineTipo" AS ENUM ('SESSAO', 'LORE_PASSADO', 'INCIDENTE');

-- CreateEnum
CREATE TYPE "StatusRolagem" AS ENUM ('SUCESSO_CRITICO', 'SUCESSO_PARCIAL', 'FALHA', 'FALHA_CRITICA', 'VALOR_EXTREMO', 'NORMAL');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo" TEXT NOT NULL DEFAULT '000000',
    "activeMapaId" TEXT,
    "mestreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ItemTipo" NOT NULL,
    "raridade" "ItemRaridade" NOT NULL,
    "valor" TEXT NOT NULL,
    "peso" TEXT NOT NULL,
    "efeito" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloFicha" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "blocos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloFicha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personagem" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "conceito" TEXT NOT NULL,
    "hpAtual" INTEGER NOT NULL,
    "hpMax" INTEGER NOT NULL,
    "recLabel" TEXT NOT NULL,
    "recAtual" INTEGER NOT NULL,
    "recMax" INTEGER NOT NULL,
    "atributos" JSONB NOT NULL,
    "pericias" JSONB NOT NULL,
    "anotacoesMestre" TEXT,
    "modeloId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioPersonagem" (
    "id" TEXT NOT NULL,
    "personagemId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InventarioPersonagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossie" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" "NotaCategoria" NOT NULL,
    "ameaca" "NivelAmeaca" NOT NULL,
    "statusPista" "StatusPista",
    "conteudo" TEXT NOT NULL,
    "dataRegistro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dossie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostIt" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "degradado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PostIt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConspiracaoNo" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "lbl" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    CONSTRAINT "ConspiracaoNo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConspiracaoFio" (
    "id" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "origemId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,

    CONSTRAINT "ConspiracaoFio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvento" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "relato" TEXT NOT NULL,
    "tipo" "TimelineTipo" NOT NULL,
    "ordenacao" SERIAL NOT NULL,

    CONSTRAINT "TimelineEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogRolagem" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "modAplicado" INTEGER NOT NULL,
    "resultadosIndiv" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "classificacao" "StatusRolagem" NOT NULL,
    "narrativa" TEXT NOT NULL,
    "isSecreta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogRolagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitaPreset" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "codigoFita" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "deck" JSONB NOT NULL,
    "bonusFix" INTEGER NOT NULL,
    "descricaoGatilho" TEXT NOT NULL,

    CONSTRAINT "FitaPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModificadorGlobal" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "lbl" TEXT NOT NULL,
    "val" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,

    CONSTRAINT "ModificadorGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPC" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notas" TEXT NOT NULL,
    "visivel" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "recompensas" TEXT NOT NULL,
    "visivel" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monstro" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ameaca" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "atributos" JSONB NOT NULL,
    "habilidades" JSONB NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Monstro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatalhaMapa" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatalhaMapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Mesa_codigo_key" ON "Mesa"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioPersonagem_personagemId_itemId_key" ON "InventarioPersonagem"("personagemId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Dossie_refCode_mesaId_key" ON "Dossie"("refCode", "mesaId");

-- CreateIndex
CREATE UNIQUE INDEX "FitaPreset_codigoFita_mesaId_key" ON "FitaPreset"("codigoFita", "mesaId");

-- CreateIndex
CREATE UNIQUE INDEX "BatalhaMapa_mesaId_nome_key" ON "BatalhaMapa"("mesaId", "nome");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesa" ADD CONSTRAINT "Mesa_mestreId_fkey" FOREIGN KEY ("mestreId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloFicha" ADD CONSTRAINT "ModeloFicha_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personagem" ADD CONSTRAINT "Personagem_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personagem" ADD CONSTRAINT "Personagem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personagem" ADD CONSTRAINT "Personagem_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloFicha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioPersonagem" ADD CONSTRAINT "InventarioPersonagem_personagemId_fkey" FOREIGN KEY ("personagemId") REFERENCES "Personagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioPersonagem" ADD CONSTRAINT "InventarioPersonagem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossie" ADD CONSTRAINT "Dossie_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostIt" ADD CONSTRAINT "PostIt_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConspiracaoNo" ADD CONSTRAINT "ConspiracaoNo_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConspiracaoFio" ADD CONSTRAINT "ConspiracaoFio_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "ConspiracaoNo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConspiracaoFio" ADD CONSTRAINT "ConspiracaoFio_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "ConspiracaoNo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvento" ADD CONSTRAINT "TimelineEvento_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogRolagem" ADD CONSTRAINT "LogRolagem_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitaPreset" ADD CONSTRAINT "FitaPreset_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModificadorGlobal" ADD CONSTRAINT "ModificadorGlobal_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPC" ADD CONSTRAINT "NPC_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monstro" ADD CONSTRAINT "Monstro_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatalhaMapa" ADD CONSTRAINT "BatalhaMapa_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
