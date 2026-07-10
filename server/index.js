const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const URL = require('url').URL;
const db = require('./db');
const booru = require('./booru');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

/* ==========================================================================
   TÉCNICA DE HOTLINKING PROXY STREAMING (/api/hotlink)
   Bypasses Referer & CORS Blocks to stream videos/images cleanly
   ========================================================================== */
app.get('/api/hotlink', (req, res) => {
  const targetUrl = req.query.url;
  const customReferer = req.query.referer;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).send('URL de hotlink inválida ou ausente');
  }

  const streamRemote = (currentUrl, redirectCount = 0) => {
    if (redirectCount > 5) {
      return res.status(502).send('Muitos redirecionamentos no proxy');
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      return res.status(400).send('URL mal formatada');
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };

    if (customReferer) {
      headers['Referer'] = customReferer;
    } else {
      headers['Referer'] = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    }

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const proxyReq = client.get(currentUrl, { headers }, (proxyRes) => {
      if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        const nextUrl = new URL(proxyRes.headers.location, currentUrl).href;
        return streamRemote(nextUrl, redirectCount + 1);
      }

      res.status(proxyRes.statusCode || 200);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
      res.setHeader('Accept-Ranges', 'bytes');

      if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);
      if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
      if (proxyRes.headers['content-range']) res.setHeader('Content-Range', proxyRes.headers['content-range']);

      proxyRes.pipe(res);

      proxyRes.on('error', (err) => {
        if (err && (err.message || '').includes('aborted')) return;
        console.error('[Hotlink Proxy] Erro no stream da resposta:', err.message);
        if (!res.headersSent) res.status(502).send('Erro ao transmitir mídia externa');
      });
    });

    proxyReq.on('error', (err) => {
      console.error('[Hotlink Proxy] Erro na requisição:', err.message);
      if (!res.headersSent) res.status(502).send('Falha ao conectar com servidor externo');
    });

    req.on('close', () => {
      proxyReq.destroy();
    });
  };

  streamRemote(targetUrl);
});

/* ==========================================================================
   BOORU SEARCH, TAGS & IMPORT ENDPOINTS
   ========================================================================== */
app.get('/api/booru/sites', (req, res) => {
  try {
    res.json(booru.getAvailableSites());
  } catch (err) {
    console.error('Erro em GET /api/booru/sites:', err);
    res.status(500).json({ error: 'Erro ao listar sites booru' });
  }
});

app.get('/api/booru/search', async (req, res) => {
  try {
    const posts = await booru.searchBoorus(req.query);
    res.json(posts);
  } catch (err) {
    console.error('Erro em GET /api/booru/search:', err);
    res.status(500).json({ error: 'Erro na busca booru' });
  }
});

app.get('/api/booru/tags', async (req, res) => {
  try {
    const suggestions = await booru.fetchBooruTagSuggestions(req.query);
    res.json(suggestions);
  } catch (err) {
    console.error('Erro em GET /api/booru/tags:', err);
    res.status(500).json({ error: 'Erro ao buscar sugestões de tags' });
  }
});

app.post('/api/booru/import', (req, res) => {
  try {
    const postData = req.body;
    if (!postData || !postData.url) {
      return res.status(400).json({ error: 'Dados do post ausentes' });
    }

    const importedPost = db.addPost({
      title: postData.title || 'Booru Import',
      description: postData.description || 'Importado de plataforma externa.',
      filename: postData.filename || 'external_booru',
      url: postData.url,
      type: postData.type || 'image',
      tags: Array.isArray(postData.tags) ? postData.tags : []
    });

    res.status(201).json(importedPost);
  } catch (err) {
    console.error('Erro em POST /api/booru/import:', err);
    res.status(500).json({ error: 'Erro ao importar post para o feed local' });
  }
});

/* ==========================================================================
   LOCAL MEDIA FEED ENDPOINTS
   ========================================================================== */
app.get('/api/media', (req, res) => {
  try {
    const posts = db.getAllPosts(req.query);
    res.json(posts);
  } catch (err) {
    console.error('Erro em GET /api/media:', err);
    res.status(500).json({ error: 'Erro ao buscar mídias' });
  }
});

app.get('/api/media/:id', (req, res) => {
  try {
    const post = db.viewPost(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    res.json(post);
  } catch (err) {
    console.error('Erro em GET /api/media/:id:', err);
    res.status(500).json({ error: 'Erro ao carregar mídia' });
  }
});

app.get('/api/tags', (req, res) => {
  try {
    const tags = db.getAllTags();
    res.json(tags);
  } catch (err) {
    console.error('Erro em GET /api/tags:', err);
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

app.post('/api/media', upload.single('file'), (req, res) => {
  try {
    let { title, description, tags, type, url } = req.body;
    
    let filename = '';
    if (req.file) {
      filename = req.file.filename;
      const mime = req.file.mimetype || '';
      if (mime.includes('video/')) {
        type = 'video';
      } else if (mime.includes('gif') || path.extname(filename).toLowerCase() === '.gif') {
        type = 'gif';
      } else if (mime.includes('image/')) {
        type = 'image';
      }
    } else if (url) {
      if (url.endsWith('.mp4') || url.endsWith('.webm')) type = 'video';
      else if (url.endsWith('.gif')) type = 'gif';
      else type = 'image';
      filename = url.split('/').pop() || 'external_media';
    } else {
      return res.status(400).json({ error: 'Nenhum arquivo ou URL fornecida' });
    }

    let parsedTags = [];
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
    }

    const newPost = db.addPost({
      title,
      description,
      filename,
      url: req.file ? `/uploads/${filename}` : url,
      type: type || 'image',
      tags: parsedTags
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Erro em POST /api/media:', err);
    res.status(500).json({ error: 'Erro ao publicar mídia' });
  }
});

/* ==========================================================================
   AUTHENTICATION ENDPOINTS (MODULAR REPOSITORY STRUCTURE)
   ========================================================================== */
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres' });
    }
    const user = db.registerUser({ username, password });
    res.status(201).json(user);
  } catch (err) {
    console.error('Erro em POST /api/auth/register:', err.message);
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    const user = db.loginUser({ username, password });
    res.json(user);
  } catch (err) {
    console.error('Erro em POST /api/auth/login:', err.message);
    res.status(401).json({ error: err.message || 'Credenciais inválidas' });
  }
});

/* ==========================================================================
   INTERACTIONS ENDPOINTS
   ========================================================================== */
app.post('/api/media/:id/like', (req, res) => {
  try {
    const { username } = req.body || {};
    const post = db.likePost(req.params.id, username);
    if (!post) return res.status(404).json({ error: 'Mídia não encontrada' });
    res.json(post);
  } catch (err) {
    console.error('Erro em POST /api/media/:id/like:', err);
    res.status(500).json({ error: 'Erro ao curtir' });
  }
});

app.post('/api/media/:id/comment', (req, res) => {
  try {
    const { author, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'O comentário não pode estar vazio' });
    }
    const comment = db.addComment(req.params.id, { author: author || 'Usuário Anônimo', text: text.trim() });
    if (!comment) return res.status(404).json({ error: 'Mídia não encontrada' });
    res.status(201).json(comment);
  } catch (err) {
    console.error('Erro em POST /api/media/:id/comment:', err);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

/* ==========================================================================
   ADMINISTRATIVE & DEVELOPER ENDPOINTS
   ========================================================================== */

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const username = req.headers['x-username'] || req.query.username || (req.body && req.body.username);
    if (!username) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }
    const role = db.getUserRole(username);
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Acesso negado: permissões insuficientes' });
    }
    req.authUsername = username;
    req.authRole = role;
    next();
  };
};

// Admin: Banir Mídia
app.post('/api/admin/ban/:id', checkRole(['admin', 'dev']), (req, res) => {
  try {
    const { reason } = req.body;
    const post = db.banPost(req.params.id, { reason, bannedBy: req.authUsername });
    if (!post) return res.status(404).json({ error: 'Mídia não encontrada' });
    res.json(post);
  } catch (err) {
    console.error('Erro ao banir post:', err);
    res.status(500).json({ error: 'Erro interno ao banir mídia' });
  }
});

// Admin: Desbanir Mídia
app.post('/api/admin/unban/:id', checkRole(['admin', 'dev']), (req, res) => {
  try {
    const post = db.unbanPost(req.params.id, req.authUsername);
    if (!post) return res.status(404).json({ error: 'Mídia não encontrada' });
    res.json(post);
  } catch (err) {
    console.error('Erro ao desbanir post:', err);
    res.status(500).json({ error: 'Erro interno ao desbanir mídia' });
  }
});

// Admin: Listar Usuários
app.get('/api/admin/users', checkRole(['admin', 'dev']), (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Dev: Alterar role de Usuário (apenas dev)
app.post('/api/admin/users/:id/role', checkRole(['dev']), (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'dev'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }
    const updatedUser = db.setUserRole(req.params.id, role, req.authUsername);
    if (!updatedUser) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(updatedUser);
  } catch (err) {
    console.error('Erro ao alterar role:', err);
    res.status(500).json({ error: 'Erro ao alterar role do usuário' });
  }
});

// Admin: Log de Auditoria
app.get('/api/admin/audit', checkRole(['admin', 'dev']), (req, res) => {
  try {
    const log = db.getAuditLog();
    res.json(log);
  } catch (err) {
    console.error('Erro ao buscar log de auditoria:', err);
    res.status(500).json({ error: 'Erro ao buscar log de auditoria' });
  }
});

// Dev: Estatísticas
app.get('/api/dev/stats', checkRole(['dev']), (req, res) => {
  try {
    const stats = db.getSystemStats();
    res.json(stats);
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas do sistema' });
  }
});

app.listen(PORT, () => {
  console.log(`[OK] Servidor Backend rodando em http://localhost:${PORT} com Hotlinking Engine & Booru Search`);
});
