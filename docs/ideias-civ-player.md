# Ideias de Features — Olhar de Jogador de Civ VI

**Escopo:** projeto é sorteador/orquestrador de configs do lobby base do Civilization VI. Toda sugestão aqui usa **só** opções nativas da tela de criar partida — sem mods, sem cheat menu, sem save-file editing.

Quando uma ideia exige comportamento que o jogo não permite configurar nativamente (ex: "pleno não pode declarar guerra antes do turno 60"), classificamos como **regra de mesa (honor-system)** que o site apenas comunica e rastreia — o jogo não impede.

Análise sob duas perspectivas:
- **Iniciante (~30h)**: regras básicas, 2-3 civs confortáveis, sem counter-picks.
- **Pleno (~200h)**: tier list interna, sinergias civ × mapa, abusa de cidades-estado.

Civs disponíveis (de `public/data/leaders.json`): Catarina de Médici (França), Dom Pedro II (Brasil), Cleópatra (Egito), Filipe II (Espanha), Frederico Barba-Ruiva (Alemanha), Gandhi (Índia), Gilgamesh (Suméria), Gorgo (Grécia), Haroldo Hardrada (Noruega), Hojo Tokimune (Japão), Júlio César (Roma), Montezuma (Asteca), Mvemba a Nzinga (Congo), Pedro (Rússia), Péricles (Grécia), Qin Shi Huang (China), Saladino (Arábia), Teddy Roosevelt (EUA), Tômiris (Cítia), Vitória (Inglaterra).

Configs válidas no lobby base: map type/size/age, game speed, difficulty per player, civ pick, victory conditions toggle, barbarians, tribal villages, resources, starting position, climate, sea level, teams, número de IAs, era inicial, disaster intensity, game modes oficiais (Heroes, Secret Societies, Apocalypse, Monopolies, Tech Shuffle, Dramatic Ages, Zombies, Barbarian Clans).

---

## 1. Mudanças de Mapa

### Lacunas no `config.json` atual (configs nativas que faltam)

| Setting | Status | Por que importa |
|---------|--------|------------------|
| `mapSize` | **AUSENTE** | Sala de 3 em mapa Padrão (8 civs) sobra terra; em Duelo (2) falta. |
| `worldAge` | **AUSENTE** | Mundo Novo gera mais montanhas (favorece civs que abusam de adjacência); Antigo é mais plano. |
| `startEra` | **AUSENTE** | Pleno em Medieval rusha vitória rápida; iniciante perde ritmo de aprendizado. |
| `gameSpeed` | **AUSENTE** | Online (240 turnos) vs Maratona (1500). Define duração da sessão. |
| `disasterIntensity` | **AUSENTE** | Catástrofes 0-4. Mais alta favorece quem sabe lidar com vulcão/inundação. |
| `aiCount` | **AUSENTE** | Quantas IAs além dos humanos. Crítico em sala de 3. |
| `gameMode` (Heroes, Secret Societies, etc.) | **AUSENTE** | Cada game mode muda a partida drasticamente. |

JSON pronto pra adicionar:

```json
"mapSize": {
  "label": "Tamanho do mapa",
  "type": "select",
  "default": "standard",
  "options": [
    { "value": "duel", "label": "Duelo (2 civs)", "weight": 2 },
    { "value": "tiny", "label": "Diminuto (4)", "weight": 1 },
    { "value": "small", "label": "Pequeno (6)", "weight": 1 },
    { "value": "standard", "label": "Padrão (8)", "weight": 1, "default": true },
    { "value": "large", "label": "Grande (10)", "weight": 2 },
    { "value": "huge", "label": "Enorme (12)", "weight": 3 }
  ]
},
"gameSpeed": {
  "label": "Velocidade do jogo",
  "type": "select",
  "default": "standard",
  "options": [
    { "value": "online", "label": "Online (240 turnos)", "weight": 2 },
    { "value": "quick", "label": "Rápido (330)", "weight": 1 },
    { "value": "standard", "label": "Padrão (500)", "weight": 1, "default": true },
    { "value": "epic", "label": "Épico (750)", "weight": 2 },
    { "value": "marathon", "label": "Maratona (1500)", "weight": 3 }
  ]
},
"startEra": {
  "label": "Era inicial",
  "type": "select",
  "default": "ancient",
  "options": [
    { "value": "ancient", "label": "Antiguidade", "weight": 1, "default": true },
    { "value": "classical", "label": "Clássica", "weight": 2 },
    { "value": "medieval", "label": "Medieval", "weight": 3 },
    { "value": "renaissance", "label": "Renascentista", "weight": 4 },
    { "value": "industrial", "label": "Industrial", "weight": 5 }
  ]
},
"worldAge": {
  "label": "Idade do mundo",
  "type": "select",
  "default": "standard",
  "options": [
    { "value": "new", "label": "Novo", "weight": 2 },
    { "value": "standard", "label": "Padrão", "weight": 1, "default": true },
    { "value": "old", "label": "Antigo", "weight": 2 }
  ]
},
"disasterIntensity": {
  "label": "Catástrofes",
  "type": "range",
  "min": 0,
  "max": 4,
  "default": 2,
  "unit": "nível"
},
"gameMode": {
  "label": "Modo de jogo",
  "type": "select",
  "default": "vanilla",
  "options": [
    { "value": "vanilla", "label": "Padrão", "weight": 1, "default": true },
    { "value": "heroes", "label": "Heróis e Lendas", "weight": 2 },
    { "value": "secret_societies", "label": "Sociedades Secretas", "weight": 2 },
    { "value": "apocalypse", "label": "Apocalipse", "weight": 3 },
    { "value": "monopolies", "label": "Monopólios", "weight": 2 },
    { "value": "tech_shuffle", "label": "Embaralhar tecnologias", "weight": 3 },
    { "value": "dramatic_ages", "label": "Eras dramáticas", "weight": 2 },
    { "value": "zombies", "label": "Defesa zumbi", "weight": 4 }
  ]
}
```

### Ideias novas (todas via lobby base)

- **Seed de mapa compartilhada**: lobby do Civ VI aceita seed numérica em "Advanced Setup". Site sorteia/define seed e mostra no reveal pra todos colarem. Permite "desafio da semana" (mesma seed pra todos).
- **Reveal final de mapa em camadas**: site mostra mapa primeiro, depois posição inicial, depois civs, com pausas dramáticas. Pura UX do site; não muda jogo.
- **Sugestão de mapa por civ sorteada**: depois de sortear civs, site sugere `mapType` que **não** favoreça desproporcionalmente as civs do pleno. Ex: pleno tirou Noruega → sugerir Pangeia (mata bônus naval). Sugestão é apenas display — sala vota normal.

---

## 2. Revelar Estratégias

Hoje votação é aberta. Mudanças possíveis vivem no **site** (não tocam o jogo).

### Modo cego de votação

- **O que faz**: votos individuais ocultos durante turno; só total agregado aparece no reveal.
- **Variantes**:
  - **Cego total**: nada visível até reveal.
  - **Cego com totais**: total agregado em tempo real, voto individual oculto.
  - **Cego com pista**: a cada 30s aparece "alguém votou em mapa Continentes", sem identificar.
- **Implementação**: flag `votingMode` em `RoomConfig`; servidor filtra `currentTurnVotes` no broadcast.

### Dica de vizinho

- **O que faz**: no reveal final, cada jogador recebe pista sobre 1 vizinho sorteado, ex:
  - "Seu vizinho ao leste é Vitória da Inglaterra — bônus naval e exército forte."
  - "Seu vizinho ao norte é Gandhi da Índia — pacífico e religioso."
- **Variante mais forte**: revela civ exata de 1 vizinho aleatório; demais ficam ocultos até encontro in-game.
- **Implementação**: site só. Renderiza no reveal final.

### Intenção declarada

- **O que faz**: cada jogador declara foco de vitória antes da partida (Científica / Cultural / Religiosa / Dominação / Pontuação / Surpresa). Site mostra a todos.
- **Variantes**:
  - **Pública**: todos veem antes do turno 1.
  - **Comprometida (tracking pelo site)**: se declarou Cultural mas vence por Dominação, ranking da sala aplica penalidade. Honor-system — jogo não impede.
  - **Privada com reveal pós-jogo**: declarações seladas, mostradas no debrief.
- **Implementação**: campo `victoryFocus` por jogador, novo no lobby do site.

### Hall da Fama da sala

- **O que faz**: sala persiste últimas N partidas (config + sorteio + vencedor declarado).
- **Implementação**: backend persistente (Postgres/Redis via Vercel Marketplace) — hoje o PartyKit é efêmero. Alternativa minimalista: `localStorage` por device (perde se trocar device).

### Mistério parcial de civ

- **O que faz**: jogador paga X pontos de votação extras pra que **sua** civ apareça como "?" pros outros até turno 30 in-game (regra de mesa: ninguém olha o lobby do Civ VI antes desse turno).
- **Implementação**: campo `secretCiv` boolean por jogador, custa pontos no site. Honor-system pra não espiar.

### Reveal progressivo (UX)

Sequência:
1. Mapa, tamanho, velocidade (5s)
2. Posição inicial (3s)
3. Regras especiais (vitórias desabilitadas, game mode) (5s)
4. Civs dos outros jogadores, uma por vez (10s)
5. Sua civ com fanfare (5s)

Reveal hoje é instantâneo — perde momento épico.

---

## 3. Equilíbrio Entre Níveis de Skill

Hoje config é igual pra todos. Mudanças possíveis dividem-se em **(a) configs nativas assimétricas** (jogo permite por jogador) e **(b) regras de mesa orquestradas pelo site** (jogo não impede, site comunica + rastreia).

### Auto-dificuldade por jogador (NATIVO)

- **O que faz**: jogador declara horas (`<50h` / `50-200h` / `200-500h` / `500h+`); site sugere dificuldade (Príncipe / Rei / Imperador / Imortal+).
- **Por que funciona**: lobby do Civ VI **permite dificuldade por jogador**. Pleno em Imortal sofre IA agressiva com bônus; iniciante em Príncipe joga neutro.
- **Implementação**: campo `playerExperience` em `Player`. Sugestão automática overrideável.
- **Edge case**: pleno mente sobre horas. Mitigação: declaração pública na sala, peer pressure.

### Pools de civ por tier (NATIVO via filtro de sorteio)

Tier list (ajustada pra `leaders.json` real — 20 líderes disponíveis):

| Tier | Líderes | Por que |
|------|---------|---------|
| **S** (forte + fácil) | Júlio César (Roma), Vitória (Inglaterra), Hojo Tokimune (Japão), Pedro (Rússia) | Bônus diretos, agendas neutras, fácil de pilotar. |
| **A** (forte com manejo) | Frederico Barba-Ruiva (Alemanha), Dom Pedro II (Brasil), Gilgamesh (Suméria), Qin Shi Huang (China) | Forte se sabe usar; só razoável se não sabe. |
| **B** (médio/situacional) | Catarina de Médici (França), Filipe II (Espanha), Tômiris (Cítia), Saladino (Arábia), Gorgo (Grécia), Péricles (Grécia), Teddy Roosevelt (EUA) | Dependem de mapa ou estratégia específica. |
| **C** (fraco/situacional) | Cleópatra (Egito) — depende de rio, Haroldo Hardrada (Noruega) — depende de costa, Mvemba a Nzinga (Congo), Montezuma (Asteca), Gandhi (Índia) — paz forçada | Bônus condicionais ou com penalidades. |

- **Aplicação**: sorteio do site filtra pool por jogador. Lobby do Civ VI usa civs picadas manualmente (host configura conforme sorteio).
- **Implementação**: adicionar `tier` a cada entrada de `leaders.json`. Filtro de sorteio respeita `civPool` por jogador.

### Draft de civ reverso (NATIVO no fluxo de pick)

- **Reverse pick simples**: iniciante pega civ primeiro do pool S; pleno pega por último do pool C.
- **Reverse pick com bans**: iniciantes banem 2-3 civs antes do pleno sortear.
- **Counter pick deliberado**: pleno tira civ primeiro, iniciantes veem e escolhem civs com vantagem contra ela.

Tabela de counters (só com civs de `leaders.json`):

| Civ pleno | Counter sugerido | Por quê |
|-----------|-------------------|---------|
| Pedro (Rússia) | Dom Pedro II (Brasil) | Pedro depende de tundra; Brasil corta floresta tropical com bônus, expande pra forçar disputa territorial. |
| Hojo Tokimune (Japão) | Frederico Barba-Ruiva (Alemanha) | Alemanha distrito extra anula adjacência Japão; Hansa supera. |
| Frederico Barba-Ruiva (Alemanha) | Hojo Tokimune (Japão) | Espelho: Japão também bônus de distrito + defesa militar. |
| Júlio César (Roma) | Tômiris (Cítia) | Cavalaria leve da Cítia mata legionário em campo aberto. |
| Vitória (Inglaterra) | Haroldo Hardrada (Noruega) | Noruega anti-naval; nega bônus inglês marítimo. |
| Gorgo/Péricles (Grécia) | Qin Shi Huang (China) | China rusha maravilhas, anula vantagem cultural grega. |

### Handicap inicial (REGRA DE MESA)

- **Não é nativo no Civ VI base**. Não dá pra dar +100 ouro inicial só pro iniciante via lobby.
- **Substituto realista**: usar campo nativo `startingPosition` em `Lendária` só pros iniciantes (mapa garante recursos perto). Pleno em `Padrão` (RNG puro).
- **Implementação**: campo `startingPosition` per-player em vez de match-wide. Lobby do Civ VI permite isso.

### Meta-desafio pro pleno (REGRA DE MESA, tracking pelo site)

Pleno escolhe 1-2 desafios. Jogo não impede; site rastreia e ranking aplica penalidade/recompensa.

| Desafio | Verificável? | Penalidade se falhar |
|---------|--------------|----------------------|
| Sem cidade-estado aliada | Visível no painel diplomático | -25% pontuação |
| Sem guerra antes do turno 100 | Visível no log | -30% pontuação |
| Máximo 4 cidades | Visível | -20% |
| Sem comprar Grande Pessoa | Honor-system | -15% |
| Sem usar unidade única da civ | Honor-system | -25% |
| Sem maravilha clássica/medieval | Visível | -20% |
| Sem religião | Visível | -30% |
| Vitória só por pontuação | Visível no fim | nulo se falhou (apenas perdeu o bônus) |

- **Recompensa se cumprir + vencer**: +50% pontuação na sala, badge persistente.
- **Implementação**: `challenges.json` + UI de seleção pelo pleno. Tracking depende do honor-system do grupo.

### Dificuldade desigual + pool tier desigual = combo limpo

Combo que **só usa configs nativas** e já cobre maioria do gap:
1. Pleno em Imortal, iniciantes em Rei.
2. Pleno sorteia civ de tier C; iniciantes de tier S.
3. Iniciantes em `startingPosition` Lendária; pleno em Padrão.
4. Iniciantes no mesmo `team` do lobby; pleno solo.
5. `disabledVictoryConditions` = ["domination"].

Sem honor-system, sem mod, sem cheat. Tudo no advanced setup do Civ VI.

---

## 4. Escolher Bots (= IAs do Civ VI)

Lobby do Civ VI permite adicionar IAs em qualquer slot vazio. Site pode orquestrar quantos bots, qual civ, qual dificuldade — tudo nativo.

### Slot de IA na sala

- **O que faz**: host configura N bots no site. Site decide civ (sorteada de pool ou definida) e dificuldade. Reveal mostra: "Bot 1: Cleópatra em Imortal", "Bot 2: Gandhi em Príncipe".
- **Implementação**: tipo `BotPlayer` extends `Player`. Servidor (PartyKit) trata bots como slots fixos sem voto OU emula voto baseado em personalidade.

### Personalidades de bot (votação automática)

| Personalidade | Vota em (config de partida) | Civs sugeridas (de leaders.json) |
|---------------|------------------------------|----------------------------------|
| **Conquistador** | Pangeia, sem cidades-estado, dominação ON | Júlio César, Tômiris, Montezuma |
| **Cientista** | Continentes, lendária, sem dominação | Gilgamesh, Qin Shi Huang, Pedro |
| **Diplomata** | Mediterrâneo, 14 cidades-estado, sem dominação | Péricles, Catarina de Médici, Teddy Roosevelt |
| **Caótico** | Aleatório em tudo, recursos escassos | Mvemba a Nzinga, Saladino, Gandhi |
| **Pacífico** | Sem bárbaros, abundante, balanceada | Hojo Tokimune, Dom Pedro II, Cleópatra |
| **Expansionista** | Mapa grande, recursos abundantes, sem limite cidades | Frederico Barba-Ruiva, Vitória, Filipe II |

- **Implementação**: `botPersonalities.json` + dropdown ao adicionar bot.

### Bot arquirrival (anti-pleno)

- **O que faz**: site escolhe **deliberadamente** civ counter da civ do pleno e seta dificuldade alta. Posição inicial: próxima do pleno.
- **Algoritmo** (usa só civs de `leaders.json`):
  - Pleno tirou Pedro (Rússia)? Arquirrival = Dom Pedro II (Brasil).
  - Pleno tirou Júlio César? Arquirrival = Tômiris (cavalaria leve mata legionário).
  - Pleno tirou Vitória? Arquirrival = Haroldo Hardrada.
  - Pleno tirou Hojo Tokimune? Arquirrival = Frederico Barba-Ruiva.
- **Posição inicial próxima**: setting nativo permite forçar civs como "vizinhas" no mesmo continente (em mapas tipo Continentes/Pangeia, com seed manipulada).

### Bot filler por dificuldade

- **Treinar iniciante**: 3 IAs em Colono (passivas).
- **Treinar pleno**: 3 IAs em Divindade (agressivas, +50% bônus).
- **Sala mista**: 2 IAs em Príncipe + 1 IA em Imortal.

### Bot surpresa

- **O que faz**: bot aparece como "?" no reveal do site. Lobby do Civ VI mostra civ aleatória — site só atrasa a info pros humanos por 30s pra criar tensão.
- **Implementação**: site só, UX.

### Bot rotativo entre partidas

- **O que faz**: bot persiste como "personagem" recorrente da sala. Acumula stats: "Bot Carlos — civ favorita Brasil, 3 vitórias em 10 partidas."
- **Implementação**: requer backend persistente.

---

## 5. Aliados e Times

Lobby do Civ VI permite **teams** nativos: jogadores no mesmo team começam em paz permanente, têm shared vision automática, research agreement grátis e vitória conjunta.

### Formato 2v2 (sala de 4)

**Por que 2v2 é ideal pra grupo misto**:
- Pleno + iniciante = dupla auto-balanceada. Pleno guia, iniciante executa.
- Reduz kingmaking (FFA com 4 humanos vira política).
- Partida 30-40% mais rápida.
- Tudo nativo do Civ VI — só configurar `team` no lobby.

**Modos de sorteio de dupla (lógica do site):**
- **Snake draft**: host ordena por skill, sistema pareia 1+4 / 2+3.
- **Sorteio cego**: duplas aleatórias reveladas no countdown final.
- **Captains draft**: 2 capitães votados pela sala alternam picks.
- **Self-pick com trava de skill gap**: jogadores escolhem mas sistema bloqueia 2 plenos juntos.

**Features de dupla:**
- **Sugestão de sinergia**: ao parear, site mostra combos conhecidos (Brasil + Rússia: religião + produção; Alemanha + Japão: distritos densos).
- **Draft coletivo de civ**: dupla vota junta em 1 civ pro time, depois sorteia qual jogador pega.
- **Banimento compartilhado**: cada time bana 1-2 civs do pool adversário. Vira meta-game.
- **Pontos de votação compartilhados**: dupla tem 2N pontos por turno e negocia interno (mudança lógica em `party/index.ts`).
- **Handicap de dupla por skill gap**: dupla com pleno+iniciante recebe `startingPosition` Lendária; dupla 2 plenos em Padrão.

**Regras de mesa (o jogo não impede, sala combina):**
- Não trocar cidades entre aliados antes do turno 50.
- Vitória só conta se ambos do time vivos no fim (Civ VI já força isso em team).
- Troca de civ pós-sorteio dentro da dupla — sistema registra a troca.

### Outros formatos (número de jogadores muda)

- **3v3** (6 jogadores): mesma lógica escalada.
- **2v2v2** (6, 3 times): política entre times fica selvagem.
- **Horda (N-1 vs 1)**: 1 jogador (pleno?) sozinho contra resto. Pleno em Divindade, resto em Príncipe — todos no mesmo team menos o pleno.
- **1v1v1v1 com pacto temporário**: FFA + regra de mesa de aliança forçada de 20 turnos entre 2 sorteados, rotaciona a cada era.

### Aliado revelado só no reveal

- **O que faz**: duplas escondidas no site até o reveal final. No lobby do Civ VI, host configura teams sem dizer aos demais antes.
- **Limitação**: jogo mostra teams no lobby ao entrar — então o "esconder" só funciona se host adicionar todos como humanos no slot certo e revelar pelo site só na hora.

### Objetivo de time secreto (REGRA DE MESA)

- **O que faz**: time A recebe objetivo secreto ("fundar 2 religiões antes do turno 100"). Cumprir = vitória extra do time.
- **Verificação**: site rastreia honor-system. Time confirma cumprimento.
- **Catálogo**: `teamObjectives.json` com 10-20 missões.

---

## 6. Outras Ideias

### Experiência social (site)
- **Perfil persistente por sessionId**: nick + avatar + histórico.
- **Rivalidades de sala**: W/L tracker entre jogadores. Requer backend persistente.
- **Chat de sala durante votação**: hoje votação é silenciosa, perde graça.
- **Reações rápidas**: emotes durante votação.

### Meta-game da votação (lógica do site)
- **Turnos temáticos**: turno 1 só mapa, turno 2 só civ, turno 3 só ruleset.
- **Veto único**: cada jogador 1 veto na partida; força re-votação daquele campo.
- **Barganha de pontos**: jogador transfere pontos de votação a outro como suborno.
- **Pacotes temáticos**: ver seção 6.5 abaixo.

### 6.5. Pacotes Temáticos (aprofundado)

**Problema**: 15+ campos de votação = fadiga. Iniciante vota aleatório. Partidas viram cópias do default.

**Como funciona**: opção única no início; se vencer por maioria, **trava N campos** com valores predefinidos (sem mod — só fixa configs nativas do lobby). Campos restantes votados normal.

**Catálogo (todos os valores existem no lobby base):**

| Pacote | Trava | Feel | Dificuldade |
|--------|-------|------|-------------|
| **Apocalipse** | clã bárbaros + quente + árido + escasso + sem aldeias + game mode Apocalypse | sobrevivência caótica | difícil |
| **Descobrimento** | arquipélago + lendária + abundante + úmido + com aldeias | exploração naval | fácil |
| **Choque de Impérios** | pangeia + padrão + recursos padrão + sem bárbaros + sem cidades-estado (0) | guerra pura | médio |
| **Jardim do Éden** | continentes + balanceada + abundante + úmido + sem bárbaros + príncipe | partida relaxada | fácil |
| **Gelo Eterno** | pangeia + frio + árido + nível do mar alto | escassez, foco comércio | difícil |
| **Terra Prometida** | terra + posição padrão + padrão tudo | partida histórica | médio |
| **Rush Cultural** | mediterrâneo + abundante + 14 cidades-estado + sem dominação | corrida cultural | médio |
| **Inferno Verde** | continentes pequenos + quente + úmido + clã bárbaros + recursos escassos | hostil | difícil |
| **Dueling Grounds** | espelho + padrão + 0 cidades-estado + sem aldeias | competitivo balanceado | médio |
| **Caos Total** | aleatório em tudo + game mode Tech Shuffle | zero preparação | aleatório |
| **Modo Tutorial** | continentes + príncipe + balanceada + abundante + sem bárbaros | partida-escola | fácil |
| **Heróis e Lendas** | game mode Heroes + recursos abundantes + tribal villages on | narrativo, casual | fácil |
| **Sociedades Secretas** | game mode Secret Societies + balanced + standard tudo | meta-game extra | médio |
| **Eras Dramáticas** | game mode Dramatic Ages + standard tudo | swings de era | médio |
| **Defesa Zumbi** | game mode Zombies + clã bárbaros + scarce | sobrevivência | difícil |

**Variações:**
- **Pacote custom salvável** por sala.
- **Pacote surpresa**: votação cega, pacote aleatório do pool aprovado.
- **Pacote + twist**: trava N-1 campos, deixa 1 dramático aberto.
- **Campanha de 3 partidas**: sequência narrativa.

**Balanceamento**: pacotes marcados por dificuldade. Site sugere fáceis se média da sala <50h.

**Implementação**:
```ts
// Em config.json, nova seção:
"packs": [
  {
    "id": "apocalipse",
    "name": "Apocalipse",
    "description": "Sobrevivência caótica",
    "difficulty": "hard",
    "overrides": {
      "matchConfig": {
        "barbarians": "clan_mode",
        "temperature": "hot",
        "precipitation": "arid",
        "resources": "scarce",
        "tribalVillages": "disabled",
        "gameMode": "apocalypse"
      }
    }
  }
]
```

Servidor trata pack como super-voto: se vencer, aplica `overrides` antes de resolver votações restantes.

### Pós-partida
- **Screenshot da config** pra compartilhar.
- **Ranking de previsões**: marcar quem vai vencer antes da partida; pontos pra acertos.
- **Debrief colaborativo**: 10 min após partida pra anotar "melhor jogada", "pior mapa", etc.

### Acessibilidade pro iniciante
- **Tooltips inline**: hover na civ mostra bônus + estilo. Dados já em `leaders.json`.
- **Sugestão de civ pra iniciante**: "Tente Júlio César, Vitória ou Hojo Tokimune."
- **Modo tutorial**: primeira partida da sala fixa Continentes + Príncipe + sem bárbaros.

### Conformidade de regras
- **Contrato de partida**: PDF/imagem com config final + regras de mesa marcadas.
- **Integração com Discord**: bot posta config no canal.

---

## 7. Balanceamento 2 Iniciantes + 1 Pleno

Cenário real: sala de 3, 2 com ~30h, 1 com ~200h. FFA = pleno vence ~90%. **Soluções todas via lobby base + regras de mesa orquestradas pelo site.**

### Categorias

#### A. Configs nativas assimétricas (lobby do Civ VI)

Tudo abaixo é setting que o jogo aceita por jogador no advanced setup.

- **A1. Dificuldade por jogador**: pleno em Imortal, iniciantes em Rei. **Config nativa direta.**
- **A2. Civ por tier**: pleno sorteia de tier C (Cleópatra, Mvemba, Gandhi, Montezuma); iniciantes de tier S (Roma, Inglaterra, Japão, Rússia). **Pick manual no lobby.**
- **A3. Posição inicial**: iniciantes em Lendária; pleno em Padrão. **Setting nativo per-player.**
- **A4. Era inicial**: iniciantes em Clássica; pleno em Antiguidade. Iniciantes começam à frente. **Setting nativo per-player.**

#### B. Estrutura de partida (lobby base)

- **B1. Team nativo**: iniciantes no mesmo team (cor azul). Pleno solo (vermelho). Civ VI dá automaticamente: paz permanente entre iniciantes, shared vision, research agreement, vitória conjunta.
- **B2. Mapa que isola pleno**: Continentes Pequenos (3 continentes garantidos) + seed que coloca pleno em continente separado.
- **B3. Vitórias desabilitadas**: remover Dominação (mata ferramenta principal do pleno). Manter Cultural, Religiosa, Pontuação.
- **B4. Velocidade Padrão + 300 turnos**: corta vitória científica rápida do pleno.
- **B5. IAs filler hostis ao pleno**: 1-2 IAs adicionais em Imperador com agendas agressivas, posicionadas perto do pleno.

#### C. Regras de mesa (orquestradas pelo site, jogo não impede)

Todas dependem de honor-system. Site lista a regra no reveal e rastreia cumprimento via input manual ou observação visual.

- **C1. Cooldown de guerra do pleno**: pleno proibido de declarar guerra antes do turno 60. Verificação: log do jogo é visível.
- **C2. Pleno sem suserano de cidade-estado**: pleno pode mandar envoy mas não vira suserano. Verificação: painel diplomático mostra suseranos.
- **C3. Pleno sem comprar Grande Pessoa**: só ganha por pontos orgânicos. Honor-system puro.
- **C4. Pool de votação conjunta dos iniciantes**: no site (não no jogo), votos dos iniciantes somam. Time tem 2N pontos. Mudança em `party/index.ts`.
- **C5. Iniciantes banem 2-3 civs do pool do pleno antes do sorteio**: lógica do site.
- **C6. Pontuação ranking ajustada**: site multiplica pontuação dos iniciantes × 1.5 e do pleno × 0.7. Apenas no ranking persistente da sala.
- **C7. Coaching declarado**: pleno pode falar livre no chat da sala durante a partida — explicar movimentos, sugerir builds. Pedagogia explícita.
- **C8. Missão secreta pro pleno**: site sorteia 1 missão de `missions.json`, mostra só pro pleno. Pleno cumpre por honra. Recompensa se cumprir + vencer; nada se falhar.

Lista de missões viáveis (verificáveis ou honor-system):
- Não construa unidade de cerco (catapulta, trabuco, canhão, artilharia) a partida toda.
- Funde religião mas nunca converta cidade estrangeira.
- Mantenha exatamente 2 cidades até turno 200.
- Aceite qualquer proposta de paz dos iniciantes no primeiro turno após guerra.
- Não use unidade única da sua civ.

#### D. Meta-objetivos (narrativa via ranking do site)

- **D1. Vitória assimétrica**:
  - Iniciantes vencem se qualquer um cumprir condição padrão **OU** capturar capital do pleno.
  - Pleno vence se sobreviver até turno 250 com >1 cidade **E** pontuação >X.
- **D2. Modo Rei da Colina**: pleno começa com era inicial avançada (Renascentista) e iniciantes em Antiguidade. Iniciantes vencem se derrubarem pleno; pleno vence se aguentar. **Setting de era nativo.**
- **D3. Coaching ativo**: pleno declarado mentor. Sucesso medido por ranking conjunto da sala — se iniciantes melhoram partida a partida, pleno acumula "pontos de mentor".

### Recomendação default: Pacote "2v1 Amigável"

Combinação 1-clique. **Tudo viável no lobby base + tracking do site.**

**Configs nativas (no Advanced Setup do Civ VI):**
1. Teams: iniciantes = Time 1; pleno = Solo.
2. Dificuldade: pleno Imortal; iniciantes Rei.
3. Civs (pick manual conforme sorteio do site):
   - Pleno: tier B-C (Cleópatra, Haroldo Hardrada, Mvemba, Montezuma, Gandhi).
   - Iniciantes: tier S (Júlio César, Vitória, Hojo Tokimune, Pedro).
4. Mapa: Continentes Pequenos.
5. Posição inicial: iniciantes Lendária; pleno Padrão.
6. Velocidade: Padrão, 300 turnos.
7. Vitórias: desabilita Dominação. Mantém Cultural + Religiosa + Pontuação.
8. Bárbaros: padrão (com bárbaros).
9. Cidades-estado: 9.
10. IAs adicionais: 0 ou 1 (testar).

**Regras de mesa (site comunica + rastreia):**
1. Iniciantes banem 2 civs do pool do pleno antes do sorteio.
2. Pleno: cooldown de guerra até turno 60.
3. Pleno: não vira suserano de cidade-estado.
4. Pleno: missão secreta sorteada, mostrada só pra ele.
5. Coaching aberto: pleno fala estratégia no chat livre.
6. Pontuação no ranking da sala: iniciantes × 1.5; pleno × 0.7.
7. Catch-up: a cada 50 turnos, jogadores discutem se algum iniciante precisa "carona" (não há cheat — apenas pleno se compromete a oferecer aliança comercial generosa, doar cidade-estado aliada, etc.).

**Expectativa ajustada:**
- Vitória do pleno: ~50% (antes do handicap: 90%).
- Vitória dos iniciantes: ~45%.
- Indecisos: ~5%.

**Anti-padrões:**
- ❌ Empilhar TODAS as restrições — pleno desiste.
- ❌ Esconder handicap do pleno — gera ressentimento.
- ❌ Trocar regras no meio da partida — destrói confiança.
- ✅ Discutir aberto no reveal, pleno consente, iniciantes agradecem.

---

## Implementação no Site (ordem sugerida)

### Fase 1 — campos faltantes no `config.json` (2-4h)
- Adicionar `mapSize`, `gameSpeed`, `startEra`, `worldAge`, `disasterIntensity`, `aiCount`, `gameMode`.
- Adicionar campos per-player faltantes: `startingPosition`, `team`, `playerExperience`.

### Fase 2 — sistema de pacotes (4-8h)
- Nova seção `packs` em `config.json`.
- Lógica de super-voto: se pacote vence, aplica `overrides` antes de resolver demais votações.
- UI de carousel inicial.

### Fase 3 — tier list e bans múltiplos (4-8h)
- Adicionar `tier` (S/A/B/C) em `leaders.json`.
- Filtro de sorteio por tier permitido por jogador.
- Multi-ban em `bannedCivilizations`.

### Fase 4 — teams e bots (8-16h)
- Campo `team` na lógica de votação (party/index.ts).
- Pool de votação somado por team.
- Slot de bot no lobby + personalidades.

### Fase 5 — regras de mesa e ranking (16-40h)
- Backend persistente (Postgres via Vercel Marketplace).
- `missions.json` + `challenges.json` com sorteio.
- Ranking persistente com handicap multiplicador.
- Chat persistente pós-reveal.
- Hall da Fama da sala.

---

## Priorização Final

Ranqueado por **impacto × esforço × viabilidade (sem mod)**:

1. **Campos faltantes** (`mapSize`, `gameSpeed`, `startEra`, `gameMode`) — trivial, todos querem.
2. **Dificuldade per-player + teams** — destrava balance básico, configs nativas.
3. **Tier list + multi-ban** — usa dados existentes.
4. **Pacotes temáticos** — corta fadiga de votação.
5. **Bots/IAs** — destrava partida com poucos humanos.
6. **Modo cego de votação** — UX simples, muda feeling.
7. **Tooltips com bônus de civ** — usa dados já no `leaders.json`.
8. **Backend persistente + ranking** — base pra tudo recorrente.

Não fazer primeiro: vitórias assimétricas complexas, missões secretas com tracking automático, rubber-band durante partida (esses dependem de honor-system pesado e podem alienar iniciantes).
