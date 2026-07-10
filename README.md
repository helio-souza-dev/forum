# PrismShare

Plataforma de upload e feed de mídia (imagens, GIFs e vídeos) organizada por tags, com busca integrada em sites booru externos (Safebooru, Gelbooru, Konachan, Yande.re, Sakugabooru) através do SDK [`@himeka/booru`](https://www.npmjs.com/package/@himeka/booru), com fallback automático para scraping/API direta quando o SDK não retorna resultados.

## Funcionalidades

- **Feed local de mídia** com upload de arquivos ou por URL, tags, curtidas, visualizações e comentários.
- **Busca em boorus externos** por tags, com autocomplete de tags vindo da API de cada site.
- **Proxy de hotlinking** (`/api/hotlink`) que transmite imagens/vídeos de sites externos sem erros de CORS/Referer, com suporte a *range requests* (streaming de vídeo).
- **Importação de posts externos** para o feed local com um clique.
- **Autenticação simples** (registro/login) e sistema de papéis (`user`, `admin`, `dev`).
- **Painel administrativo** para banir/desbanir mídia e gerenciar usuários.
- **Painel de desenvolvedor** com estatísticas do sistema (posts, views, likes, storage, tags mais usadas etc.) e log de auditoria.

## Stack técnica

| Camada     | Tecnologias |
|------------|-------------|
| Frontend   | React 18, Vite 5, lucide-react |
| Backend    | Node.js, Express 4, Multer (upload), CORS |
| Integração booru | `@himeka/booru` + fallback via `https` nativo (JSON/HTML) |
| Persistência | Arquivo JSON local (`server/data/db.json`) — sem banco de dados externo |

## Estrutura do projeto

```
forum/
├── client/               # Frontend React (Vite)
│   └── src/
│       ├── components/   # Header, MediaFeed, MediaCard, BooruBar, UploadModal,
│       │                 # AuthModal, AdminPanel, DevPanel, CinemaModal...
│       └── App.jsx
├── server/               # Backend Express
│   ├── index.js          # Rotas da API
│   ├── booru.js          # Integração com sites booru (SDK + fallbacks)
│   ├── db.js             # Camada de dados (JSON local)
│   ├── data/db.json       # "Banco de dados"
│   └── uploads/          # Arquivos enviados pelos usuários
└── scripts/
    ├── install.js        # Instala dependências de client e server
    └── dev.js            # Sobe client e server juntos em modo dev
```

## Como rodar

Pré-requisitos: Node.js 18+ e npm.

```bash
# Instala as dependências do client e do server
npm install

# Sobe o backend (porta 3001) e o frontend (porta 5173) juntos
npm run dev
```

Se preferir rodar cada lado separadamente:

```bash
npm run dev:server   # backend em http://localhost:3001
npm run dev:client   # frontend em http://localhost:5173
```

O Vite já está configurado para fazer proxy de `/api` e `/uploads` para o backend (veja `client/vite.config.js`), então o frontend em desenvolvimento acessa a API normalmente em `/api/...`.

### Usuário padrão

Na primeira execução, um usuário `dev` (papel `dev`, acesso total) é criado automaticamente com senha `dev1234`.

> ⚠️ **Troque essa senha (ou remova esse usuário padrão) antes de expor o projeto publicamente.** Veja a seção *Limitações conhecidas* abaixo.

## API — principais endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/media` | Lista mídias do feed local (aceita filtros de query) |
| GET  | `/api/media/:id` | Detalhe de uma mídia (incrementa views) |
| POST | `/api/media` | Publica mídia nova (upload de arquivo ou URL) |
| POST | `/api/media/:id/like` | Curtir/descurtir |
| POST | `/api/media/:id/comment` | Comentar |
| GET  | `/api/tags` | Lista de tags e contagem de uso |
| GET  | `/api/booru/sites` | Lista de sites booru suportados |
| GET  | `/api/booru/search` | Busca posts em um site booru externo |
| GET  | `/api/booru/tags` | Autocomplete de tags de um site booru |
| POST | `/api/booru/import` | Importa um post externo para o feed local |
| GET  | `/api/hotlink` | Proxy de streaming para mídia externa (evita CORS/Referer) |
| POST | `/api/auth/register` | Cria usuário |
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/admin/*` | Ações administrativas (requer papel `admin` ou `dev`) |
| GET | `/api/dev/stats` | Estatísticas do sistema (requer papel `dev`) |

## Limitações conhecidas / roadmap

Este projeto ainda está em desenvolvimento e tem alguns pontos importantes a resolver antes de qualquer uso em produção:

- [ ] Autenticação sem token/sessão real (hoje depende de um header enviado pelo cliente).
- [ ] Hash de senha sem salt (`sha256` puro).
- [ ] Credencial padrão (`dev`/`dev1234`) hardcoded no código.
- [ ] `/api/hotlink` sem allowlist de domínios (risco de SSRF).
- [ ] `node_modules` sem `.gitignore` (deveria ser ignorado pelo Git).
- [ ] Sem filtro de rating/conteúdo para os resultados vindos de boorus externos.
- [ ] Scraping de HTML do Gelbooru é um fallback frágil, sujeito a quebrar se o site mudar de layout.

## Licença

Projeto pessoal/experimental — defina a licença conforme desejar.
