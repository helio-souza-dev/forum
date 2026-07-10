# PrismShare

Plataforma de upload e feed de mídia (imagens, GIFs e vídeos) organizada por tags, com busca integrada em sites booru externos (Safebooru, Gelbooru, Konachan, Yande.re, Sakugabooru) através do SDK [`@himeka/booru`](https://www.npmjs.com/package/@himeka/booru) e consultas diretas à API JSON pública, oferecendo **arquitetura híbrida de custo zero**, **blindagem de segurança de nível industrial** e **perfil de usuário completo com recorte interativo**.

---

## 🌟 Funcionalidades Principais

- **Feed Local & Nuvem de Mídia**: Upload de imagens e vídeos por arquivo ou URL, organizado com tags dinâmicas, curtidas em tempo real, contagem de visualizações e sistema de comentários.
- **Página de Perfil Dedicada (`/user/:username`)**: Visualização em página inteira do perfil do usuário com foto de avatar, banner de capa, bio, abas de **Meus Posts**, **Curtidas** e **Configurações de Privacidade** (modo público/privado).
- **Recorte Interativo & Exportação WebP (`PhotoCropperModal`)**: Ferramenta de zoom, arrasto e enquadramento visual antes do envio de fotos de perfil, otimizando automaticamente as imagens para o formato leve `WebP`.
- **Hospedagem 100% Gratuita via Nuvem (`Catbox.moe`)**: Endpoint especializado (`/api/upload/free`) que envia avatares e banners diretamente para servidores externos de alta velocidade sem consumir 1 byte de armazenamento local.
- **Busca & Autenticação Externa de Boorus**: Pesquisa avançada em tempo real com autocomplete de tags da API de cada site. Exibição automática do **Autor / Artista original (`@Autor`)** e botão de **Importação com 1 Clique** (exige autenticação para evitar spam).
- **Engine de Hotlinking Proxy (`/api/hotlink`)**: Transmite imagens e vídeos de servidores externos sem bloqueios de CORS/Referer, suportando *Range Requests* (streaming suave de vídeo e avanço de timeline).
- **Sistema de Usuários e Controle de Acesso (RBAC)**: Autenticação via Tokens JWT assinados no servidor com 3 níveis de permissão (`user`, `admin`, `dev`).
- **Painéis Administrativos & Dev**:
  - **Admin Panel**: Moderação de mídias (banir/desbanir) e gestão de contas.
  - **Dev Panel & Terminal Virtual**: Telemetria em tempo real do sistema (posts, views, likes, armazenamento, tags mais populares), log de auditoria e inspeção de credenciais de segurança.

---

## 🛡️ Pacote de Blindagem & Segurança Prioritária

O PrismShare passou por uma auditoria completa de segurança, fechando todas as superfícies de ataque conhecidas:

1. **🔒 Proteção Anti-SSRF (Server-Side Request Forgery)**:
   - O endpoint de proxy `/api/hotlink` valida o host de destino (`isSafeHotlinkUrl`), bloqueando requisições a IPs de loopback (`localhost`, `127.0.0.1`, `::1`), redes privadas (`10.x.x.x`, `192.168.x.x`, `172.16.x.x`) e metadados de nuvem (`169.254.169.254`).
2. **🔬 Validação Física por Magic Bytes (`validateMagicBytes`) & Whitelist Multer**:
   - O servidor inspeciona os primeiros **16 bytes originais** de qualquer arquivo no momento do upload. Apenas assinaturas binárias reais de `JPEG/JPG`, `PNG`, `GIF`, `WebP`, `MP4` e `WebM` são aceitas.
   - Scripts maliciosos ou executáveis (`.exe`, `.sh`, `.html`, `.svg`) renomeados com extensões falsas são detectados no ato e apagados instantaneamente com erro `400 Bad Request`.
3. **💾 Escrita Atômica Anti-Corrupção (`server/db.js`)**:
   - Toda alteração no banco local `db.json` utiliza o padrão `.tmp` -> `fs.renameSync()`, impedindo perda ou corrupção de dados durante quedas de energia ou reinicializações inesperadas.
4. **🔑 Criptografia Forte (`bcryptjs` & JWT Secret Dinâmico)**:
   - Senhas são armazenadas com `bcryptjs` (salt de 10 rounds). Senhas antigas legadas em `sha256` são identificadas e re-hashadas automaticamente para `bcrypt` no momento do login.
   - O segredo JWT (`jwt_secret.txt`) é gerado localmente com entropia criptográfica segura se não estiver definido no `.env`.
5. **🚫 Rate Limiting & Proteção CORS (`express-rate-limit`)**:
   - `authLimiter`: Bloqueia tentativas de força bruta no login/registro (máximo de 25 tentativas por IP a cada 15 minutos).
   - `proxyLimiter`: Previne abusos de tráfego e scraping no proxy de mídia (`/api/hotlink`).
   - Política restritiva de `CORS` configurada com `allowlist` segura para domínios clientes autorizados.
6. **🎯 Single Source of Truth (SSOT) no Cliente**:
   - Extração de sessão centralizada pelo helper `getAuthToken(currentUser)` em `client/src/utils/auth.js`, eliminando chaves duplicadas no `localStorage`.

---

## 🛠️ Stack Técnica

| Camada | Tecnologias Principais |
|---|---|
| **Frontend** | React 18, Vite 5, lucide-react, Canvas WebP Cropper |
| **Backend** | Node.js, Express 4, Multer (Upload Blindado), CORS |
| **Segurança & Auth** | `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, Magic Bytes Scanner |
| **Integração Booru** | `@himeka/booru` + API JSON Pública (`Gelbooru`, `Safebooru`, `Sakugabooru`) |
| **Armazenamento / Nuvem** | Catbox.moe API (`Upload grátis de avatares`) + fallback de disco local (`/uploads/`) |
| **Persistência de Dados** | Híbrido: `server/data/db.json` (Escrita Atômica local) ou **MongoDB Atlas NoSQL** |

---

## 📂 Estrutura do Projeto

```text
forum/
├── .env.example          # Modelo de variáveis de ambiente
├── client/               # Frontend React (Vite)
│   └── src/
│       ├── components/   # UserProfilePage, PhotoCropperModal, MediaCard, MediaFeed,
│       │                 # Header, BooruBar, UploadModal, AuthModal, Admin/DevPanel...
│       ├── utils/        # auth.js (Single Source of Truth para tokens)
│       └── App.jsx       # Roteamento de visualização e estado de sessão
├── server/               # Backend Express Blindado
│   ├── index.js          # Rotas da API, Rate Limiters, CORS e Validação Magic Bytes
│   ├── booru.js          # Integrações externas com APIs JSON / SDK Booru
│   ├── auth.js           # Geração e verificação de tokens JWT e verificação de papéis
│   ├── db.js             # Motor de dados Híbrido (MongoDB Atlas + Escrita Atômica em db.json)
│   └── uploads/          # Diretório isolado para arquivos enviados (protegido pelo .gitignore)
└── scripts/
    ├── dev.js            # Sobe o backend (porta 3001) e o frontend (porta 5173) em paralelo
    └── install.js        # Script de instalação de todas as dependências
```

---

## 🚀 Como Rodar Localmente

Pré-requisitos: **Node.js 18+** e **npm**.

```bash
# 1. Instale as dependências gerais
npm install

# 2. (Opcional) Crie o seu arquivo de configuração a partir do modelo
cp .env.example .env

# 3. Inicie o ambiente de desenvolvimento completo (Backend + Frontend)
npm run dev
```

### ⚙️ Variáveis de Ambiente (`.env`)

Consulte o arquivo `.env.example` na raiz para conferir todas as opções de configuração:

```ini
PORT=3001
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/prismshare?retryWrites=true&w=majority
PRISMSHARE_JWT_SECRET=seu_segredo_aleatorio_jwt
PRISMSHARE_DEV_PASSWORD=sua_senha_fixa_para_o_usuario_dev
```

> **Nota:** Se a variável `MONGODB_URI` for deixada em branco, o PrismShare funcionará de modo **100% autônomo na sua máquina**, persistindo dados localmente no arquivo `server/data/db.json` com gravação atômica instantânea.

### 👑 Conta de Desenvolvedor Padrão (`dev`)

Ao rodar o servidor pela primeira vez, caso o usuário `dev` não exista, o sistema o criará com acesso administrativo total.
- **Senha Dinâmica e Segura**: Se a variável `PRISMSHARE_DEV_PASSWORD` não estiver no seu `.env`, o console do backend exibirá uma senha gerada aleatoriamente uma única vez no boot. Guarde essa senha com segurança!

---

## 📡 Principais Endpoints da API

| Método | Rota | Descrição | Requer Auth? |
|---|---|---|:---:|
| `GET` | `/api/media` | Lista mídias do feed local (filtros por tag, tipo ou busca) | Não |
| `GET` | `/api/media/:id` | Carrega detalhes de uma mídia e incrementa visualizações | Não |
| `POST` | `/api/media` | Publica nova mídia no feed (inspeção de Magic Bytes ativa) | Não / Opcional |
| `POST` | `/api/upload/free` | Upload 100% grátis de avatares/banners para Catbox.moe ou disco | Não |
| `GET` | `/api/users/:username` | Retorna dados públicos, bio e lista de posts de um perfil | Não |
| `PUT` | `/api/users/profile` | Atualiza avatar, banner, bio e configurações do perfil | **Sim (JWT)** |
| `GET` | `/api/booru/search` | Consulta externa em Boorus com identificação de @Autor | Não |
| `POST` | `/api/booru/import` | Importa post externo para o banco de dados local | **Sim (JWT)** |
| `GET` | `/api/hotlink` | Proxy com proteção anti-SSRF e suporte a Range Requests | Não |
| `POST` | `/api/auth/register` | Registro com verificação de senha segura (mín. 6 caracteres) | Não (`Rate Limiter`) |
| `POST` | `/api/auth/login` | Autenticação do usuário e emissão de Token JWT | Não (`Rate Limiter`) |
| `GET/POST` | `/api/admin/*` | Moderação de mídias e gestão de contas | **Sim (`admin`/`dev`)** |
| `GET` | `/api/dev/stats` | Telemetria de infraestrutura e log de auditoria do sistema | **Sim (`dev`)** |

---

## ✅ Auditoria & Checklist de Resolução do Roadmap

Abaixo está o status atualizado de todas as limitações e vulnerabilidades apontadas nas revisões técnicas anteriores:

- [x] **Autenticação com Token/Sessão Real**: Substituído o header simples de usuário por tokens JWT criptografados com verificação de papéis (`RBAC`) em tempo real no banco.
- [x] **Hash de Senha Seguro**: Substituído `sha256` puro pelo padrão `bcryptjs` (salt 10 rounds), com rotina de transição automática de senhas antigas no login.
- [x] **Segurança do Usuário Padrão (`dev`)**: Fim da credencial `dev/dev1234` hardcoded em código. Agora a senha é gerada aleatoriamente na primeira inicialização ou configurada via `.env`.
- [x] **Proteção Anti-SSRF no Proxy de Mídia (`/api/hotlink`)**: Adicionada verificação rigorosa `isSafeHotlinkUrl()` para rejeitar redes privadas, loopback e metadados de nuvem.
- [x] **Filtro de Upload e Assinatura de Arquivos (Magic Bytes)**: O Multer agora recusa MIME types desconhecidos (`application/octet-stream`), e a função `validateMagicBytes()` analisa os 16 primeiros bytes físicos de todo upload para impedir o envio de executáveis ou scripts.
- [x] **Escrita Atômica no Banco Local (`db.json`)**: Prevenção de corrupção de arquivo com salvamento em `.tmp` seguido de renomeação instantânea.
- [x] **Limpeza do Histórico do Git & `.gitignore`**: O arquivo de banco `db.json` e a pasta `uploads/` foram removidos do índice do Git (`git rm --cached`) e isolados no `.gitignore` para evitar vazamentos de dados ou conflitos em colaboração.
- [x] **Rate Limiting & CORS Fechado**: Proteção contra força bruta implementada para login/registro e proxy, com `allowlist` no CORS.
- [x] **Fim do Scraping Frágil de HTML no Gelbooru**: A integração com o Gelbooru foi atualizada para consultar sua API JSON pública (`&json=1`), eliminando falhas causadas por mudanças de layout no HTML.

---

## 📄 Licença

Projeto pessoal/experimental sob licença livre.
