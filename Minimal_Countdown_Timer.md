# Minimal Countdown Timer — Especificação Determinística (Antigravity IDE)

## Contexto de Execução
Este documento será lido e executado por um **Agente de IA generativa especializado em criação de código** dentro da **IDE Antigravity (Google)**.

O agente deve seguir **exatamente** as instruções, **na ordem**, sem decisões implícitas.

---

## Ambiente do Desenvolvedor
- **Sistema Operacional:** Windows 11  
- **Diretório raiz do projeto:** `C:\Projects\minimal-countdown-timer`  
- **Node.js:** v24.12.0  
- **npm:** v11.6.2  

---

## Objetivo Final (Obrigatório)
Ao final do processo, deve existir:

- Um **APK de produção**
- Totalmente funcional
- Instalável em Android
- Executando corretamente:
  - Countdown
  - Áudio
  - Execução em segundo plano
  - Tela sempre ativa

---

## Identificação do App
- **Nome:** Minimal Countdown Timer  
- **Plataforma:** Android  
- **Stack:** React Native + Expo  
- **Persistência:** AsyncStorage  

---

## PASSO 1 — Criação do Projeto

```powershell
cd C:\Projects\minimal-countdown-timer
npx create-expo-app .
npm start
```

---

## PASSO 2 — Dependências Obrigatórias

```powershell
npm install @react-native-async-storage/async-storage
npm install expo-av
npm install expo-keep-awake
npm install expo-background-fetch
npm install expo-task-manager
npm install react-native-reanimated
```

---

## PASSO 3 — Funcionalidade do Timer

- Countdown em minutos e segundos
- `+` adiciona 5 segundos
- `-` remove 5 segundos
- Estados:
  - Idle
  - Running
  - Paused
  - Finished

Regras:
- Nunca permitir valores negativos
- Valor inicial persistido
- Reset restaura valor inicial salvo

---

## PASSO 4 — Layout Obrigatório

- Fundo escuro
- Timer centralizado em fonte grande
- Formato visual:
  ```
  - 00:30 +
  ```
- Controles abaixo:
  - Start / Pause / Reset

Edição manual:
- Toque no número
- Cursor visível
- Entrada direta com validação

---

## PASSO 5 — Estilos e Temas

- Ícone de engrenagem no canto superior direito
- Lista de estilos
- Aplicação imediata ao clicar

Tema inicial:
- Fundo quase preto
- Tons suaves de laranja
- Fonte moderna

---

## PASSO 6 — Animações

- Transições suaves de números
- Transições suaves de botões
- Implementar com `react-native-reanimated`

---

## PASSO 7 — Áudio (Obrigatório)

- Som ao finalizar:
  - 5 segundos
  - Agradável
- Implementar com `expo-av`
- Regras:
  - Respeitar fone de ouvido
  - Reduzir volume de outros apps (audio focus)
  - Funcionar com app fechado ou minimizado

---

## PASSO 8 — Execução em Segundo Plano (CRÍTICO)

### Comportamento Obrigatório
- O timer **deve continuar contando** se:
  - Usuário minimizar o app
  - Usuário trocar para outro app
  - Tela for bloqueada
- Ao finalizar o tempo:
  - Som deve tocar normalmente
  - Mesmo com o app em segundo plano

### Implementação Técnica
- Utilizar:
  - `expo-background-fetch`
  - `expo-task-manager`
- O agente deve garantir que:
  - O estado do timer não dependa apenas do ciclo de renderização
  - A contagem seja baseada em timestamps reais

---

## PASSO 9 — Tela Sempre Ativa / Tela de Bloqueio (PRIORIDADE MÁXIMA)

### Prioridade 1 — Tela Sempre Ativa
- Enquanto o timer estiver no estado **Running**:
  - Ativar `expo-keep-awake`
  - Impedir que a tela apague
- Ao pausar ou finalizar:
  - Desativar keep awake

### Prioridade 2 — Controles na Tela de Bloqueio (Fallback)
- Caso o SO impeça manter a tela ativa:
  - Implementar controles de mídia na tela de bloqueio
  - Comportamento semelhante ao Spotify
  - Controles mínimos:
    - Pause
    - Play
    - Reset

A **Prioridade 1 é obrigatória**.  
A Prioridade 2 só deve ser aplicada se a 1 não for possível.

---

## PASSO 10 — Persistência

Salvar com AsyncStorage:
- Tempo inicial
- Tema selecionado

Restaurar automaticamente ao abrir o app.

---

## PASSO 11 — Permissões Android

Configurar no projeto:
- Execução em segundo plano
- Áudio em background
- Wake lock / keep screen on

---

## PASSO 12 — Build do APK

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile production
```

---

## Critérios de Aceitação (Checklist)

- [ ] Timer continua em segundo plano
- [ ] Som toca mesmo com app minimizado
- [ ] Tela não apaga durante countdown
- [ ] Fallback de tela bloqueada se necessário
- [ ] Temas aplicam instantaneamente
- [ ] APK gerado e instalável

---

## Regra Final (CRÍTICA)
Este documento **define o comportamento absoluto** do projeto.

O agente **não pode**:
- Simplificar
- Ignorar etapas
- Alterar stack
- Omitir funcionalidades
