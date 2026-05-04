# Handoff: Sistema de Mensagens

## Overview

Um sistema simples de mensagens com três funcionalidades:

1. **Exibir uma mensagem aleatória** vinda do banco de dados, no centro da tela.
2. **Botão de refresh** que pede uma nova mensagem aleatória ao backend e troca a mensagem em tela com uma animação sutil de fade.
3. **Campo de texto** para o usuário postar uma nova mensagem no banco.

A direção visual é **terminal monoespaçado / retrô-CRT em modo escuro**, com tipografia JetBrains Mono e accent verde-fósforo.

---

## About the Design Files

Os arquivos neste bundle são **referências de design criadas em HTML** — protótipos que mostram a aparência e o comportamento desejados. **Não são código de produção para ser copiado diretamente.**

A tarefa é **recriar este design no ambiente do codebase de destino** (React, Vue, Next.js, SwiftUI, native, etc.) seguindo os padrões e bibliotecas já estabelecidos lá. Se ainda não houver um codebase, escolha o framework mais apropriado para o projeto (sugestão: React + Vite, ou Next.js, dado que o protótipo já é HTML/JS) e implemente o design lá, com um backend real.

A persistência via `localStorage` no protótipo é **um placeholder do backend** — substituir por uma API real (REST ou GraphQL) com banco relacional ou não-relacional.

---

## Fidelity

**High-fidelity (hifi).** Cores, tipografia, espaçamentos, animações e estados estão definidos. O desenvolvedor deve recriar a UI com fidelidade pixel-a-pixel usando as bibliotecas existentes do codebase. Os valores de design tokens (cores, fontes, durações) estão listados abaixo na seção **Design Tokens**.

---

## Architecture

### Backend

Apenas uma tabela:

**`messages`**

| Coluna       | Tipo        | Notas                                   |
|--------------|-------------|-----------------------------------------|
| `id`         | `integer`   | Primary key, auto-increment             |
| `text`       | `text`      | Conteúdo da mensagem (1–280 caracteres) |
| `created_at` | `timestamp` | Default `now()`                         |

Pode ser SQL (Postgres, SQLite, MySQL) ou NoSQL (MongoDB, Firestore) — qualquer um serve.

### Endpoints sugeridos

| Método | Rota                     | Descrição                                                      |
|--------|--------------------------|----------------------------------------------------------------|
| `GET`  | `/api/messages/random`   | Retorna uma mensagem aleatória. Aceita `?exclude=<id>` opcional para evitar repetir a anterior. Resposta: `{ id, text, created_at, total }`. |
| `POST` | `/api/messages`          | Cria nova mensagem. Body: `{ "text": string }`. Validar 1–280 caracteres não-vazios (após trim). Resposta: `{ id, text, created_at, total }`. |
| `GET`  | `/api/messages/count`    | Retorna apenas `{ total }`.                                    |

**Seleção aleatória em SQL:**
- Postgres: `SELECT * FROM messages WHERE id != $1 ORDER BY random() LIMIT 1;`
- SQLite: `SELECT * FROM messages WHERE id != ? ORDER BY RANDOM() LIMIT 1;`
- Para tabelas muito grandes considerar `TABLESAMPLE` ou seleção por offset random.

**Validação no POST:**
- Trim do input
- Rejeitar string vazia → `400 { error: "empty" }`
- Rejeitar > 280 caracteres → `400 { error: "too_long" }`

---

## Screens / Views

O sistema é uma **única tela**, dividida em quatro regiões verticais (CSS Grid).

### Layout geral

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR     msg.sys / terminal v0.1   CONN ROWS DB  │  ← header (auto)
├─────────────────────────────────────────────────────┤
│                                                     │
│   MAIN     // random_message            id #0008    │
│   ┌────────────────────────────────────────────┐    │
│   │                                            │    │
│   │            "  mensagem aqui  "  ▌          │    │  ← stage (1fr — preenche o espaço)
│   │                                            │    │
│   │  ─────────────────────────────────────     │    │
│   │      [ ↻ refresh ]   ou pressione space    │    │
│   └────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  COMPOSE   // new_message                  0/280    │  ← compose (auto)
│  $  digite uma mensagem…              [ enter ↵ ]   │
├─────────────────────────────────────────────────────┤
│  STATUSBAR  READY · space next · / focus      hh:mm:ss │  ← status (auto)
└─────────────────────────────────────────────────────┘
```

- Container: `position: fixed; inset: 0; display: grid; grid-template-rows: auto 1fr auto auto; gap: 14px;`
- Padding geral: `24px clamp(20px, 5vw, 64px)` (em telas estreitas, `14px`)
- Em telas `< 640px`, o status do topo (`CONN OK`) e a hint de teclado em `actions` ficam ocultos, e o gap diminui para `10px`.

### 1. Topbar

Lado esquerdo (gap 14px):
- **Dot pulsante** — círculo 8×8px, `background: var(--accent)`, com `box-shadow: 0 0 8px var(--accent)`, `animation: pulse 2.4s ease-in-out infinite` (opacity 1 → 0.45 → 1).
- Texto `msg.sys` em `var(--fg)`.
- Separador `/` em `var(--fg-dim)`.
- `terminal` e `v0.1` em `var(--fg-dim)`.

Lado direito (gap 18px), tudo em 12px / `letter-spacing: 0.04em`:
- `CONN OK` (oculto em < 640px) — palavra `OK` em `var(--accent)`.
- `DB local.msgs` — `local.msgs` em `var(--accent)`.
- `ROWS 020` — número padded com 3 dígitos (`String(n).padStart(3, "0")`), em `var(--accent)`. **Vem da API `/messages/count`** e é atualizado após qualquer POST.

Estilo do container: `border: 1px solid var(--line); padding: 10px 16px; background: var(--bg-2);`.

### 2. Main (display da mensagem)

Container: `border: 1px solid var(--line); background: linear-gradient(180deg, rgba(127,255,159,0.02), transparent 30%), var(--bg-2);`. Grid: `grid-template-rows: auto 1fr auto;`.

#### 2a. Main-head
- Esquerda: `// random_message` em `var(--fg-dim)`, 11px, uppercase, `letter-spacing: 0.12em`.
- Direita: id no formato `id #0008` (`String(id).padStart(4, "0")`), em `var(--accent-dim)`, `font-variant-numeric: tabular-nums`. Quando não há mensagem, mostra `id —`.
- Padding: `10px 18px`. Border-bottom: `1px solid var(--line)`.

#### 2b. Stage (a mensagem)

- `display: grid; place-items: center; padding: clamp(20px, 5vh, 60px) clamp(20px, 5vw, 80px);`
- A mensagem em si:
  - `max-width: 900px`
  - `text-align: center`
  - `font-size: clamp(20px, 3.4vw, 36px)`
  - `line-height: 1.45`
  - `font-weight: 400`
  - `letter-spacing: -0.01em`
  - `text-wrap: pretty`
  - Cor: `var(--fg)`
- **Aspas decorativas** envolvendo o texto: glyphs `"` antes e depois, em `var(--accent)`, `opacity: 0.55`, `font-weight: 500`, `margin: 0 0.25em`. **Não fazem parte da string** — são adornos visuais.
- **Cursor piscante**: bloco inline `width: 0.55em; height: 1em; background: var(--accent); margin-left: 0.15em; box-shadow: 0 0 8px var(--accent);` com `animation: blink 1s steps(1, end) infinite` (opacity 1 → 0 a 50%). Pode aparecer na main ou ser omitido — no protótipo está no input.

#### 2c. Actions

- Container: `padding: 14px 18px; border-top: 1px solid var(--line); background: rgba(127, 255, 159, 0.02);`. Flex centralizado, `gap: 12px`.
- **Botão Refresh** (`button.btn`):
  - `font-size: 13px; letter-spacing: 0.06em; padding: 9px 16px; text-transform: uppercase;`
  - Border: `1px solid var(--line-strong)`, background transparente, color `var(--fg)`
  - Conteúdo: ícone `↻` (com class `arrow`) + texto `refresh`
  - **Hover**: `background: rgba(127, 255, 159, 0.08); border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 1px rgba(127,255,159,0.15), 0 0 24px rgba(127,255,159,0.12);`
  - **Active**: `transform: translateY(1px);`
  - **Disabled**: `opacity: 0.45; cursor: not-allowed;`
  - **Quando carregando**: a class `.spinning` aplica `animation: spin 700ms cubic-bezier(.5,.1,.2,1)` na seta `↻` (gira 360°).
- **Hint** ao lado direito do botão: `ou pressione [space] / [→]`, com cada tecla em `<span class="kbd">`. Estilo `.kbd`: `font-size: 10.5px; border: 1px solid var(--line); padding: 2px 6px; color: var(--fg-dim); background: var(--bg); border-radius: 2px;`. A hint inteira fica oculta em < 640px.

### 3. Compose (formulário de postar)

Container: `border: 1px solid var(--line); background: var(--bg-2);`.

#### 3a. Compose-head
- `padding: 8px 16px; border-bottom: 1px solid var(--line);`. Texto 11px uppercase em `var(--fg-dim)`.
- Esquerda: `// new_message — escreva e pressione enter` (parte após o `—` em `var(--fg-faint)`).
- Direita: contador `0/280`, `font-variant-numeric: tabular-nums`.
  - Estados de cor:
    - Padrão: `var(--fg-dim)`
    - 241–280: class `warn` → `var(--warn)` (`#ffb86b`)
    - > 280: class `over` → `var(--error)` (`#ff6b6b`)

#### 3b. Compose-row
Grid: `grid-template-columns: auto 1fr auto;`.
- **Prompt `$`**: `padding: 0 12px 0 16px; color: var(--accent); font-weight: 500;` (não selecionável).
- **Input** (`<input type="text" maxlength="280">`):
  - `background: transparent; border: 0; outline: 0; color: var(--fg); font-family: var(--mono); font-size: 15px; padding: 14px 8px; caret-color: var(--accent);`
  - Placeholder: `digite uma mensagem…` em `var(--fg-faint)`.
- **Submit** (`<button type="submit">`):
  - `border-left: 1px solid var(--line); background: transparent; color: var(--fg-dim); font-size: 12px; letter-spacing: 0.08em; padding: 0 18px; text-transform: uppercase;`
  - Texto: `enter ↵`.
  - **Disabled** (input vazio após trim): `color: var(--fg-faint); cursor: not-allowed;`.
  - **Hover** (quando habilitado): `background: rgba(127,255,159,0.08); color: var(--accent);`.

### 4. Statusbar

- `padding: 0 4px;` Flex space-between, 10.5px uppercase, `letter-spacing: 0.14em;` em `var(--fg-faint)`.
- Esquerda: `READY · [space] next · [/] focus input · [esc] blur` (separadores `·` em `var(--fg-faint)`, kbd-spans no estilo definido acima).
- Direita: relógio `hh:mm:ss` em `var(--fg-dim)`, `font-variant-numeric: tabular-nums`, atualizado a cada 1s.

### 5. Toast de confirmação

`position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);`

- Estado oculto: `opacity: 0; transform: translateX(-50%) translateY(20px); pointer-events: none;`
- Estado visível (class `.show`): `opacity: 1; transform: translateX(-50%) translateY(0);`
- Transição: `opacity 220ms ease, transform 280ms cubic-bezier(.4,.1,.2,1);`
- Estilo: `background: var(--bg-2); border: 1px solid var(--accent); color: var(--accent); padding: 10px 18px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 0 0 1px rgba(127,255,159,0.1), 0 8px 32px rgba(0,0,0,0.5), 0 0 32px rgba(127,255,159,0.18);`
- Conteúdo: `✓` (14×14 grid, color accent) + texto, ex: `mensagem #0021 postada`.
- Auto-dismiss após **2200ms**.
- Em caso de erro: trocar `border-color` e `color` para `var(--error)`, e o texto para `erro ao postar`.

### 6. Efeitos de fundo (CRT)

Dois pseudo-elementos em `body` que cobrem a tela inteira (`position: fixed; inset: 0; pointer-events: none;`):

- `body::before` — **scanlines**: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px); mix-blend-mode: overlay; z-index: 50;`
- `body::after` — **vignette**: `background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%); z-index: 49;`

---

## Interactions & Behavior

### Carregamento inicial (boot)
1. Buscar `total` via `GET /messages/count` e atualizar `ROWS`.
2. Disparar `loadRandom()` para popular a mensagem inicial.

### Refresh / trocar mensagem
1. Travar `isLoading = true`. Adicionar class `.spinning` no botão (faz a seta girar 700ms). Desabilitar o botão.
2. Adicionar class `.fading` na `.message` — transição CSS aplica `opacity: 0; filter: blur(2px); transform: translateY(4px);` em **280ms**.
3. Esperar **260ms** (sincronizar com o final da fade-out).
4. Chamar `GET /messages/random?exclude={currentId}`.
5. Atualizar texto e id no DOM.
6. Remover `.fading` — fade-in volta em **280ms**.
7. Esperar **320ms**, então liberar `isLoading = false` e remover `.spinning`.

### Postar mensagem
1. No submit: chamar `POST /messages` com `{ text: input.value.trim() }`.
2. Em sucesso:
   - Atualizar `ROWS` (count).
   - Mostrar toast verde: `mensagem #00XX postada`.
   - **Carregar a mensagem recém-postada no display** (mesma animação de fade do refresh, mas pulando a chamada de API random).
   - Limpar o input e atualizar o contador.
3. Em erro: mostrar toast em vermelho `erro ao postar`.

### Estados do contador (atualiza no `input` event)
- `n <= 240`: classe padrão.
- `240 < n <= 280`: `.warn` (laranja).
- `n > 280`: `.over` (vermelho). (Como `maxlength=280`, não deve ocorrer; é defesa em profundidade.)

### Estado do submit
- Habilitado **apenas** se `input.value.trim().length > 0`.

### Atalhos de teclado (globais)

| Tecla         | Ação                                | Condição                    |
|---------------|-------------------------------------|-----------------------------|
| `Space`       | `loadRandom()`                      | Foco **fora** do input      |
| `→` (Right)   | `loadRandom()`                      | Foco **fora** do input      |
| `/`           | Foca o input + previne digitação    | Foco **fora** do input      |
| `Esc`         | Faz blur do input                   | Foco **dentro** do input    |

Importante: enquanto o foco está no input, **não** capturar `Space` nem `→` — usuário está digitando.

---

## State Management

Variáveis de estado necessárias (no protótipo são vars JS soltas; no React seriam `useState`):

| Estado          | Tipo                  | Origem                    |
|-----------------|-----------------------|---------------------------|
| `currentMessage`| `{id, text} \| null`  | `GET /messages/random`    |
| `total`         | `number`              | qualquer resposta da API  |
| `isLoading`     | `boolean`             | local (refresh em curso)  |
| `inputValue`    | `string`              | controlled input          |
| `toast`         | `{text, isError, visible} \| null` | timer 2200ms |
| `clock`         | `Date`                | `setInterval(1000)`       |

### Recomendação React
Usar **TanStack Query** (`@tanstack/react-query`) para `/messages/random` (com `queryKey: ['random', excludeId]` e `enabled: false` + `refetch()` no botão) e uma `useMutation` para o POST que invalida o count e dispara um novo random.

---

## Design Tokens

### Colors

| Token               | Valor                          | Uso                                     |
|---------------------|--------------------------------|-----------------------------------------|
| `--bg`              | `#0a0e0a`                      | Fundo da página                         |
| `--bg-2`            | `#0d130d`                      | Fundo de painéis (topbar, main, compose)|
| `--fg`              | `#c8d4c8`                      | Texto principal                         |
| `--fg-dim`          | `#6a7a6a`                      | Texto secundário, labels                |
| `--fg-faint`        | `#3d4a3d`                      | Texto terciário, status bar, placeholder|
| `--accent`          | `#7fff9f`                      | Verde-fósforo: dot, glyph, accents      |
| `--accent-dim`      | `#4ea766`                      | id da mensagem (versão menos saturada)  |
| `--warn`            | `#ffb86b`                      | Contador 241–280                        |
| `--error`           | `#ff6b6b`                      | Erro / contador overflow                |
| `--line`            | `rgba(127, 255, 159, 0.12)`    | Bordas sutis                            |
| `--line-strong`     | `rgba(127, 255, 159, 0.28)`    | Borda do botão refresh                  |

### Typography

- **Font family**: `'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace` — importar via Google Fonts (weights 300, 400, 500, 700).
- Body base: 15px / line-height 1.55 / antialiased.

| Uso                    | Tamanho                       | Weight | Letter-spacing | Outros                       |
|------------------------|-------------------------------|--------|----------------|------------------------------|
| Mensagem principal     | `clamp(20px, 3.4vw, 36px)`    | 400    | `-0.01em`      | `text-wrap: pretty`          |
| Topbar / labels        | 12px                          | 400    | `0.04em`       |                              |
| Section headers        | 11px                          | 400    | `0.12em`       | `text-transform: uppercase`  |
| Status bar             | 10.5px                        | 400    | `0.14em`       | uppercase                    |
| Botão                  | 13px                          | 400    | `0.06em`       | uppercase                    |
| Submit                 | 12px                          | 400    | `0.08em`       | uppercase                    |
| Input                  | 15px                          | 400    | —              | `caret-color: var(--accent)` |
| Kbd                    | 10.5px                        | 400    | `0.04em`       |                              |

### Spacing

- Container padding: `24px clamp(20px, 5vw, 64px)` (mobile: `14px`).
- Grid gap entre seções: `14px` (mobile: `10px`).
- Padding interno padrão de painéis: `10px 16px` (topbar, main-head, compose-head).
- Stage padding: `clamp(20px, 5vh, 60px) clamp(20px, 5vw, 80px)`.
- Botão padding: `9px 16px`.
- Submit padding: `0 18px`.
- Input padding: `14px 8px`.

### Border / radius / shadow

- Bordas: sempre 1px sólido em `var(--line)` ou `var(--line-strong)`.
- **Sem border-radius** em painéis (estética terminal). Exceção: `.kbd` tem `border-radius: 2px`.
- Glow do accent (botão hover, toast):
  - `0 0 0 1px rgba(127,255,159,0.15), 0 0 24px rgba(127,255,159,0.12)` (botão hover)
  - `0 0 0 1px rgba(127,255,159,0.1), 0 8px 32px rgba(0,0,0,0.5), 0 0 32px rgba(127,255,159,0.18)` (toast)
- Glow do dot e do cursor: `box-shadow: 0 0 8px var(--accent)`.

### Animações / durações

| Animação                | Duração / curva                                |
|-------------------------|------------------------------------------------|
| Fade da mensagem        | 280ms ease (opacity, filter, transform)        |
| Spin da seta no refresh | 700ms `cubic-bezier(.5,.1,.2,1)`               |
| Pulse do dot            | 2.4s ease-in-out infinite                      |
| Blink do cursor         | 1s steps(1, end) infinite                      |
| Hover de botão          | 140ms ease (background, color, border, shadow) |
| Active de botão         | 80ms ease (transform)                          |
| Toast in/out            | opacity 220ms ease, transform 280ms `cubic-bezier(.4,.1,.2,1)` |
| Toast auto-dismiss      | 2200ms                                         |

### CRT effects

- Scanlines: `repeating-linear-gradient` 1px linha / 2px gap, `rgba(255,255,255,0.012)`, `mix-blend-mode: overlay`.
- Vignette: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)`.

---

## Assets

Nenhum asset binário. Apenas:
- **JetBrains Mono** via Google Fonts (`https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap`).
- Glyphs Unicode usados como ícones: `↻` (refresh), `↵` (enter), `→` (arrow), `✓` (check), `"` (aspas), `▌` (cursor é div, não glyph).

---

## Files

- `Sistema de Mensagens.html` — **protótipo de referência**. Contém HTML, CSS e JS num único arquivo. O backend está simulado em JS com `localStorage` (função `api()` no script). Usar como referência visual e de comportamento; não shippar diretamente.
