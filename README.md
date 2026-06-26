# 🌐 Codex Umbrae // VHS-SYS Terminal Rpg

O **Codex Umbrae** é uma plataforma integrada de mesa virtual (VTT) e sistema de inteligência para campanhas de RPG de mesa, projetada com uma estética retro-futurista de terminal CRT/VHS (fósforo verde, distorções analógicas, glitch e scanlines). 

A plataforma divide-se em ferramentas avançadas para o **Mestre (GM)** gerenciar todos os aspectos narrativos, mecânicos e táticos da campanha, e um **Painel de Operador dedicado para os Jogadores** conectados via código de mesa, oferecendo fichas integradas e grid de batalha com sincronização de posicionamento em tempo real.

---

## 📺 Estética & Design System
O sistema utiliza uma interface imersiva inspirada em terminais de segurança e fitas VHS de ficção científica dos anos 80:
*   **Fontes Retro:** Uso de fontes do Google Fonts (`VT323` e `Share Tech Mono`) para simular computadores balísticos analógicos.
*   **Efeitos Visuais:** Camadas de animação CSS personalizadas de jitter analógico, ruído estático de fita VHS, bloom de fósforo de tela CRT e scanlines persistentes.
*   **Paleta de Cores VHS-Match:** Curadoria de tons de neon funcionais (Verde `#40c060` para status saudáveis, Vermelho `#e03030` para alertas/monstros, Azul `#30a0e0` para dados e informações táticas, Ouro `#e8d080` para destaques de inteligência).

---

## 🛠️ Arquitetura do Sistema e Módulos

### 1. Sistema 00: Central de Campanhas (Mesas)
*   **Conexão Simplificada:** O mestre cria uma mesa que gera um **Código de Acesso Único**.
*   **Lobby Inteligente:** Jogadores inserem o código de mesa no lobby, visualizam a campanha e escolhem (reivindicam) um personagem livre registrado pelo mestre.
*   **Separação de Papéis (Mestre vs. Jogador):** A sidebar e as páginas administrativas adaptam seus links e ferramentas baseado no ID do usuário logado e no papel configurado para a sessão.

### 2. Sistema 01: Forja de Regras & Modelagem de Fichas (`/fichas`)
*   **Engine de Layout Dinâmico:** Construtor Drag-and-Drop para projetar fichas personalizadas utilizando componentes estruturais:
    *   *Cabeçalho* (Nome e Conceito do Personagem)
    *   *Divisória* (Organização de Seções)
    *   *Atributos* (Atributos básicos como FOR, DES, INT, etc.)
    *   *Número +/-* (Controle de recursos flutuantes como Mana, Pontos de Ação, etc.)
    *   *Barra HP* (Pontos de vida integrados com barra de progresso visual)
    *   *Lista de Skills* (Perícias customizadas com modificador de treino e proficiência)
    *   *Campo de Texto* (Histórico, anotações de campanha, etc.)
*   **Isolamento e Normalização:** O motor de salvamento armazena o estado como um JSON indexado por chaves únicas (`block.id`, `at.id`), permitindo múltiplos blocos do mesmo tipo em uma ficha sem conflito ou vazamento de dados.

### 3. Sistema 02: Dossiês e Matriz de Inteligência (`/notas`)
*   **Logs de Dossiês:** Catalogação de pistas, NPCs, locais e facções com códigos de referência e níveis de ameaça (Crítico, Elevado, Informativo).
*   **Matriz de Conspiração:** Um quadro interativo (Conspiracy Board) onde nós (Labels de pistas) podem ser posicionados e interconectados por fios de linha vermelha para traçar mistérios.
*   **Post-Its & Cronogramas:** Notas instantâneas degradadas na tela e timeline de incidentes históricos ordenados de forma sequencial.

### 4. Sistema 03: Computador Balístico (`/dados`)
*   **Log de Rolações:** Histórico de lançamentos detalhando a fórmula de dados, modificador global aplicado, e a classificação do resultado (Sucesso Crítico, Sucesso Parcial, Falha, Falha Crítica).
*   **Fitas de Presets:** Configuração rápida de jogadas frequentes vinculadas a gatilhos.

### 5. Sistema 04: Grade de Combate Tático (`/batalha`)
*   **Editor de Terreno:** O mestre pode pintar as células da grade tática com diferentes tipos de terrenos (Paredes, Água, Terreno Difícil, Portas) em tempo real.
*   **Gerenciador de Tokens:** Colocação e movimento de personagens e inimigos sob o grid.
*   **Regras de Movimentação Controladas:** Jogadores têm controle exclusivo sobre seu próprio personagem e não podem interagir com tokens inimigos ou de outros jogadores.
*   **Sincronização Ativa:** Sistema de polling de 2000ms que atualiza posições dos tokens e terrenos de forma transparente para todos na mesa, sem interferir no zoom individual e no pan da câmera de cada jogador.

### 6. Sistema 05: Cérebro do Oráculo e Improviso (`/mesa`)
*   **GmDashboard (Mestre):**
    *   *Matriz de Combate:* Tracker de iniciativa e vida integrado com cálculo em tempo real da Classe de Armadura (CA) e Percepção Passiva a partir das fichas de regras vinculadas.
    *   *Filtro Omni-Busca:* Barra de busca global rápida que encontra instantaneamente qualquer item, quest, monstro ou NPC registrado na base da campanha.
    *   *Geradores de Pânico:* Botões de improviso emergencial para gerar itens de loot, reviravoltas na narrativa, ou NPCs rápidos com traços marcantes.
    *   *Testes Cego em Grupo:* Lançamento secreto de dados do grupo inteiro para perícias de Percepção ou Furtividade sem revelar os números aos jogadores.
*   **PlayerDashboard (Jogador):**
    *   Painel contendo a ficha editável do jogador em sincronia com o template do mestre.
    *   Dossiê de NPCs e Missões públicas (reveladas ativamente pelo mestre).
    *   Subobjetivos de quests e inventário de carga em modo de leitura seguro.

---

## 💾 Modelagem do Banco de Dados (Prisma PostgreSQL)
A estrutura relacional armazena todos os elementos de RPG amarrados ao escopo de cada `Mesa`:

```mermaid
erDiagram
    Mesa ||--o{ User : "mestre"
    Mesa ||--o{ Item : "contém"
    Mesa ||--o{ ModeloFicha : "possui templates"
    Mesa ||--o{ Personagem : "hospeda"
    Mesa ||--o{ NPC : "gerencia"
    Mesa ||--o{ Quest : "rastreia"
    Mesa ||--o{ Monstro : "bestiário"
    Mesa ||--o{ BatalhaMapa : "mapas táticos"
    
    Personagem }|--|| User : "reivindicado_por"
    Personagem }|--|| ModeloFicha : "segue"
    Personagem ||--o{ InventarioPersonagem : "carrega"
    Item ||--o{ InventarioPersonagem : "contido_em"
```

---

## 🚀 Tecnologias Utilizadas
A plataforma é construída sobre a **T3 Stack**, garantindo Typesafety de ponta a ponta:
*   **Next.js 15 (Turbopack):** Client Components, SSR e renderização otimizada.
*   **Prisma Client:** ORM Typesafe integrado a um banco de dados PostgreSQL.
*   **tRPC:** Roteamento e comunicação de API Typesafe entre servidor e cliente.
*   **NextAuth.js:** Autenticação segura de usuários.
*   **Tailwind CSS:** Estilização responsiva e flexível.

---

## 🛠️ Configuração e Execução Local

### Pré-requisitos
*   **Node.js** (v18.x ou superior)
*   **PostgreSQL** rodando localmente ou um banco gerenciado (Supabase/Neon)

### Instalação
1. Clone o repositório no seu diretório de trabalho:
   ```bash
   git clone <URL_DO_REPOSITORIO> codex-umbrae
   ```

2. Instale as dependências do projeto:
   ```bash
   npm install
   ```

3. Crie e configure o arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:
   ```env
   # Link de conexão do Banco de Dados PostgreSQL
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/codex_umbrae?schema=public"

   # Configurações do NextAuth
   NEXTAUTH_SECRET="sua_chave_secreta_aqui"
   NEXTAUTH_URL="http://localhost:3000"

   # Credenciais opcionais de OAuth (GitHub/Discord/Google) para o NextAuth
   DISCORD_CLIENT_ID=""
   DISCORD_CLIENT_SECRET=""
   ```

4. Empurre o esquema do banco de dados Prisma e gere o client local:
   ```bash
   npx prisma db push
   ```

5. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acesse o terminal em [http://localhost:3000](http://localhost:3000).

---

## 👁️ Diretrizes de Contribuição e Desenvolvimento
*   **Imersão Visual:** Qualquer novo componente de tela deve estar contido em wraps de efeitos VHS/CRT (`AnalogGlitch` ou `VHSEffect`) e usar as tipografias de console (`VT323`/`Share Tech Mono`).
*   **Typesafety:** Mantenha os tipos dos blocos de fichas (`BlockType`, `BlockData`) e as validações de input do tRPC em estrita correspondência. A verificação estática de tipos deve ser validada antes de novos commits usando:
    ```bash
    npx tsc --noEmit
    ```
