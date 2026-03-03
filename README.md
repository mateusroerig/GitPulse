# GitPulse

<p align="center">
	<img src="apps/web/public/logo.png" alt="GitPulse" width="180" />
</p>

Plataforma para análise de repositórios públicos do GitHub.

O projeto está organizado em um monorepo com:

- `apps/web`: frontend em React + TypeScript + Vite
- `apps/api`: backend em Grails 7 (REST API)

## Visão geral

O frontend permite informar a URL de um repositório público do GitHub e visualizar métricas como:

- estrelas
- forks
- linguagem principal
- atividade de commits

Atualmente o frontend consome a API pública do GitHub diretamente.

## Estrutura do repositório

```text
GitPulse/
├── apps/
│   ├── api/   # Grails 7 + Gradle
│   └── web/   # React + Vite + TypeScript
└── README.md
```

## Pré-requisitos

### Frontend (`apps/web`)

- Node.js 20+
- npm 10+

### Backend (`apps/api`)

- Java 17
- Gradle Wrapper (já incluído no projeto)

## Como executar

### 1) Frontend

```bash
cd apps/web
npm install
npm run dev
```

Aplicação disponível em `http://localhost:5173` (porta padrão do Vite).

Scripts disponíveis:

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: gera build de produção
- `npm run preview`: sobe preview do build
- `npm run lint`: executa lint

### 2) Backend

```bash
cd apps/api
./gradlew bootRun
```

Alternativa com Grails Wrapper:

```bash
cd apps/api
./grailsw run-app
```

Configuração padrão de desenvolvimento:

- Grails 7.0.7
- Banco H2 em memória (`create-drop`)

## Desenvolvimento em paralelo

Em dois terminais:

```bash
# Terminal 1
cd apps/api && ./gradlew bootRun

# Terminal 2
cd apps/web && npm install && npm run dev
```

## Tecnologias

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- Grails 7
- Spring Boot (via Grails)
- H2 Database

## Próximos passos sugeridos

- conectar o frontend à API interna (`apps/api`) para centralizar regras de negócio
- adicionar autenticação (GitHub OAuth)
- incluir testes automatizados para métricas e fluxos principais