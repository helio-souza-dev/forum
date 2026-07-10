const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const PostModel = require('./models/Post');
const UserModel = require('./models/User');
const AuditLogModel = require('./models/AuditLog');

// Hash sha256 "puro" (sem salt) usado nas versões antigas do PrismShare.
// Mantido só para reconhecer e migrar automaticamente senhas antigas para bcrypt.
function legacySha256(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const seedData = {
  posts: [
    {
      id: 'post-1',
      title: 'Neon Cyber City Rain 4K',
      description: 'Vista impressionante de uma metrópole futurista com luzes neon intensas e reflexos nas ruas molhadas.',
      filename: 'cyberpunk_city.png',
      url: '/uploads/cyberpunk_city.png',
      type: 'image',
      tags: ['cyberpunk', 'neon', 'cidade', 'chuva', 'futurista', 'art'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [
        { id: 'c1', author: 'NexusVibe', text: 'Essa iluminação violeta está absurda!', createdAt: '2026-07-08T14:20:00Z' },
        { id: 'c2', author: 'CyberSamurai', text: 'Perfeito para papel de parede.', createdAt: '2026-07-09T09:12:00Z' }
      ],
      createdAt: '2026-07-08T12:00:00Z'
    },
    {
      id: 'post-2',
      title: 'Retro Arcade Glitch Loop',
      description: 'Animação em loop de fliperama retrô com efeitos de glitch em alto contraste negro e neon.',
      filename: 'retro_arcade_loop.gif',
      url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
      type: 'gif',
      tags: ['gif', 'glitch', 'retro', 'arcade', 'gamedev', '8bit'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [
        { id: 'c3', author: 'PixelMaster', text: 'Nostalgia pura dos anos 90.', createdAt: '2026-07-08T18:00:00Z' }
      ],
      createdAt: '2026-07-08T15:30:00Z'
    },
    {
      id: 'post-3',
      title: 'Big Buck Bunny (Cinematic Teaser)',
      description: 'O clássico curta-metragem de animação 3D de código aberto com física de partículas e iluminação volumétrica.',
      filename: 'sample_video_1.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video',
      tags: ['video', 'animacao', '3d', 'blender', 'cinematic', 'curta'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [
        { id: 'c4', author: 'RenderDev', text: 'Um verdadeiro marco para o mundo open source 3D!', createdAt: '2026-07-09T10:00:00Z' }
      ],
      createdAt: '2026-07-08T19:00:00Z'
    },
    {
      id: 'post-4',
      title: 'Dark Mecha Sentinel Concept',
      description: 'Design de personagem mecânico pesado em tons monocromáticos escuros com visores ópticos vermelhos.',
      filename: 'dark_mecha.png',
      url: '/uploads/dark_mecha.png',
      type: 'image',
      tags: ['mecha', 'robo', 'scifi', 'monocromata', 'conceito', 'dark'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [],
      createdAt: '2026-07-09T08:00:00Z'
    },
    {
      id: 'post-5',
      title: 'Synthwave Highway Drive',
      description: 'Viagem sem fim pelo horizonte reticulado dos anos 80 sob um sol roxo e estrelas digitais.',
      filename: 'synthwave_loop.gif',
      url: 'https://media.giphy.com/media/l41YcGT5ShJa0nCM0/giphy.gif',
      type: 'gif',
      tags: ['gif', 'synthwave', 'carro', 'retro', 'neon', 'estetica'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [
        { id: 'c5', author: 'RetroDriver', text: 'Trilha sonora ideal para isso: Kavinsky - Nightcall!', createdAt: '2026-07-09T11:45:00Z' }
      ],
      createdAt: '2026-07-09T09:30:00Z'
    },
    {
      id: 'post-6',
      title: 'Foraminifera Ocean Deep Showcase',
      description: 'Exploração submarina em alta definição mostrando a beleza oculta das profundezas aquáticas.',
      filename: 'sample_video_2.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'video',
      tags: ['video', 'natureza', 'mar', 'hd', 'relaxante', 'exploracao'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [],
      createdAt: '2026-07-09T12:15:00Z'
    },
    {
      id: 'post-7',
      title: 'Abstract Dark Matter Geometry',
      description: 'Estruturas geométricas pretas minimalistas flutuando no vácuo infinito com sombreamento duro.',
      filename: 'abstract_geometry.png',
      url: '/uploads/abstract_geometry.png',
      type: 'image',
      tags: ['abstrato', '3d', 'minimalista', 'preto', 'geometria', 'dark'],
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [
        { id: 'c6', author: 'DesignMonk', text: 'Sem bordas arredondadas, pura geometria cortante. Sensacional.', createdAt: '2026-07-09T14:00:00Z' }
      ],
      createdAt: '2026-07-09T14:00:00Z'
    }
  ]
};

class Database {
  constructor() {
    this.data = { posts: [], users: [], auditLog: [] };
    this.startTime = Date.now();
    this.mongoConnected = false;
    this.init();
  }

  async init() {
    this.loadLocal();
    const uri = process.env.MONGODB_URI;
    if (uri) {
      try {
        await mongoose.connect(uri);
        this.mongoConnected = true;
        console.log('✅ [Database] Conectado com sucesso ao MongoDB Atlas NoSQL!');
        await this.loadFromMongo();
      } catch (err) {
        console.error('⚠️ [Database] Falha ao conectar com MongoDB Atlas, usando modo local:', err.message);
      }
    }
  }

  async loadFromMongo() {
    try {
      const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
      const users = await UserModel.find().lean();
      const auditLog = await AuditLogModel.find().sort({ createdAt: -1 }).limit(500).lean();

      if (posts && posts.length > 0) this.data.posts = posts;
      if (users && users.length > 0) this.data.users = users;
      if (auditLog && auditLog.length > 0) this.data.auditLog = auditLog;

      this._ensureDevUser();
      console.log(`📡 [MongoDB Cache] Carregado na memória: ${this.data.posts.length} Posts, ${this.data.users.length} Usuários, ${this.data.auditLog.length} Logs de Auditoria.`);
    } catch (err) {
      console.error('Erro ao ler do MongoDB Atlas:', err);
    }
  }

  loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.users) this.data.users = [];
        if (!this.data.posts) this.data.posts = [];
        if (!this.data.auditLog) this.data.auditLog = [];
      } else {
        this.data = JSON.parse(JSON.stringify(seedData));
        if (!this.data.users) this.data.users = [];
        if (!this.data.auditLog) this.data.auditLog = [];
        this._ensureDevUser();
        this.save();
      }
    } catch (err) {
      console.error('Erro ao ler DB, usando dados iniciais:', err);
      this.data = JSON.parse(JSON.stringify(seedData));
      if (!this.data.users) this.data.users = [];
      if (!this.data.auditLog) this.data.auditLog = [];
      this._ensureDevUser();
      this.save();
    }
    this._ensureDevUser();
  }

  load() {
    this.loadLocal();
  }

  _ensureDevUser() {
    const devExists = this.data.users.find(u => u.username.toLowerCase() === 'dev');
    if (!devExists) {
      const devPassword = process.env.PRISMSHARE_DEV_PASSWORD || crypto.randomBytes(9).toString('base64url');
      const passwordHash = bcrypt.hashSync(devPassword, 10);
      const newUser = {
        id: crypto.randomUUID(),
        username: 'dev',
        passwordHash,
        role: 'dev',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(newUser);
      this.save('user', newUser);
      if (!process.env.PRISMSHARE_DEV_PASSWORD) {
        console.log('==================================================================');
        console.log(`[Auth] Usuário "dev" criado. Senha gerada automaticamente: ${devPassword}`);
        console.log('[Auth] Guarde essa senha agora — ela não será mostrada novamente.');
        console.log('[Auth] Para definir uma senha fixa, use a variável PRISMSHARE_DEV_PASSWORD.');
        console.log('==================================================================');
      }
    } else if (!devExists.role || devExists.role !== 'dev') {
      devExists.role = 'dev';
      this.save('user', devExists);
    }
  }

  save(targetType, item) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar DB local:', err);
    }

    if (this.mongoConnected && targetType && item) {
      if (targetType === 'post') {
        const cleanPost = JSON.parse(JSON.stringify(item));
        delete cleanPost._id; delete cleanPost.__v;
        PostModel.updateOne({ id: cleanPost.id }, { $set: cleanPost }, { upsert: true }).catch(e => console.error('Erro sync Mongo Post:', e.message));
      } else if (targetType === 'user') {
        const cleanUser = JSON.parse(JSON.stringify(item));
        delete cleanUser._id; delete cleanUser.__v;
        UserModel.updateOne({ id: cleanUser.id }, { $set: cleanUser }, { upsert: true }).catch(e => console.error('Erro sync Mongo User:', e.message));
      } else if (targetType === 'audit') {
        const cleanAudit = JSON.parse(JSON.stringify(item));
        delete cleanAudit._id; delete cleanAudit.__v;
        AuditLogModel.updateOne({ id: cleanAudit.id }, { $set: cleanAudit }, { upsert: true }).catch(e => console.error('Erro sync Mongo Audit:', e.message));
      }
    }
  }

  /* ==========================================================================
     USER & AUTH REPOSITORY METHODS (Modular for future SQL/NoSQL migration)
     ========================================================================== */
  registerUser({ username, password }) {
    if (!username || !password) {
      throw new Error('Usuário e senha são obrigatórios');
    }
    const cleanUsername = username.trim().toLowerCase();
    const existing = this.data.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      throw new Error('Este nome de usuário já está em uso.');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const role = 'user';
    const newUser = {
      id: crypto.randomUUID(),
      username: username.trim(),
      passwordHash,
      role,
      avatarUrl: '',
      bio: 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: '',
      privacy: { showLikes: true, showPosts: true, allowComments: true },
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save('user', newUser);
    return {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl || '',
      bio: newUser.bio || 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: newUser.bannerUrl || '',
      privacy: newUser.privacy || { showLikes: true, showPosts: true, allowComments: true },
      createdAt: newUser.createdAt
    };
  }

  loginUser({ username, password }) {
    if (!username || !password) {
      throw new Error('Usuário e senha são obrigatórios');
    }
    const cleanUsername = username.trim().toLowerCase();
    const user = this.data.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      throw new Error('Usuário ou senha incorretos.');
    }

    const isBcryptHash = typeof user.passwordHash === 'string' && /^\$2[aby]\$/.test(user.passwordHash);
    let passwordMatches = false;

    if (isBcryptHash) {
      passwordMatches = bcrypt.compareSync(password, user.passwordHash);
    } else {
      passwordMatches = user.passwordHash === legacySha256(password);
      if (passwordMatches) {
        user.passwordHash = bcrypt.hashSync(password, 10);
      }
    }

    if (!passwordMatches) {
      throw new Error('Usuário ou senha incorretos.');
    }

    if (!user.role) user.role = 'user';
    this.save('user', user);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: user.bannerUrl || '',
      privacy: user.privacy || { showLikes: true, showPosts: true, allowComments: true },
      createdAt: user.createdAt
    };
  }

  getUserByUsername(username) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    const user = this.data.users.find(u => u.username.toLowerCase() === clean);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: user.bannerUrl || '',
      privacy: user.privacy || { showLikes: true, showPosts: true, allowComments: true },
      createdAt: user.createdAt
    };
  }

  getUserById(id) {
    if (!id) return null;
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: user.bannerUrl || '',
      privacy: user.privacy || { showLikes: true, showPosts: true, allowComments: true },
      createdAt: user.createdAt
    };
  }

  updateUserProfile(username, profileData) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    const user = this.data.users.find(u => u.username.toLowerCase() === clean);
    if (!user) return null;

    if (profileData.avatarUrl !== undefined) user.avatarUrl = profileData.avatarUrl;
    if (profileData.bio !== undefined) user.bio = profileData.bio;
    if (profileData.bannerUrl !== undefined) user.bannerUrl = profileData.bannerUrl;
    if (profileData.privacy !== undefined) {
      user.privacy = { ...(user.privacy || {}), ...profileData.privacy };
    }

    this.save('user', user);
    return {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || 'Olá! Sou um membro ativo do PrismShare.',
      bannerUrl: user.bannerUrl || '',
      privacy: user.privacy || { showLikes: true, showPosts: true, allowComments: true },
      createdAt: user.createdAt
    };
  }

  /* ==========================================================================
     POSTS, MEDIA & INTERACTIONS REPOSITORY METHODS
     ========================================================================== */
  getAllPosts(filters = {}) {
    let posts = [...this.data.posts];

    if (filters.type && filters.type !== 'all') {
      posts = posts.filter(p => p.type === filters.type);
    }

    if (filters.tag) {
      const selectedTags = Array.isArray(filters.tag) ? filters.tag : filters.tag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (selectedTags.length > 0) {
        posts = posts.filter(p => {
          const postTags = (p.tags || []).map(t => t.toLowerCase());
          return selectedTags.every(st => postTags.includes(st));
        });
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (filters.sort === 'popular' || !filters.sort) {
      posts.sort((a, b) => (b.likes + b.views * 0.1) - (a.likes + a.views * 0.1));
    } else if (filters.sort === 'newest') {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sort === 'likes') {
      posts.sort((a, b) => b.likes - a.likes);
    }

    return posts;
  }

  getPostById(id) {
    return this.data.posts.find(p => p.id === id);
  }

  addPost(postData) {
    const newPost = {
      id: crypto.randomUUID(),
      title: postData.title || 'Mídia Sem Título',
      description: postData.description || '',
      filename: postData.filename,
      url: postData.url || `/uploads/${postData.filename}`,
      type: postData.type || 'image',
      tags: Array.isArray(postData.tags) ? postData.tags : [],
      uploader: postData.uploader || postData.author || 'Anônimo',
      author: postData.author || postData.uploader || '',
      source: postData.source || '',
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };
    this.data.posts.unshift(newPost);
    this.save('post', newPost);
    return newPost;
  }

  likePost(id, username) {
    const post = this.getPostById(id);
    if (post) {
      if (!post.likedBy) post.likedBy = [];
      if (username) {
        const cleanUser = username.trim();
        const index = post.likedBy.indexOf(cleanUser);
        if (index === -1) {
          post.likedBy.push(cleanUser);
        } else {
          post.likedBy.splice(index, 1);
        }
        post.likes = post.likedBy.length;
      } else {
        throw new Error('Usuário precisa estar logado para curtir de verdade.');
      }
      this.save('post', post);
      return post;
    }
    return null;
  }

  viewPost(id) {
    const post = this.getPostById(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.save('post', post);
      return post;
    }
    return null;
  }

  addComment(id, commentData) {
    const post = this.getPostById(id);
    if (post) {
      const newComment = {
        id: crypto.randomUUID(),
        author: commentData.author || 'Usuário Anônimo',
        text: commentData.text || '',
        createdAt: new Date().toISOString()
      };
      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
      this.save('post', post);
      return newComment;
    }
    return null;
  }

  getAllTags() {
    const tagCounts = {};
    this.data.posts.forEach(post => {
      (post.tags || []).forEach(tag => {
        const cleanTag = tag.toLowerCase().trim();
        if (cleanTag) {
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        }
      });
    });
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
  /* ==========================================================================
     ADMIN & MODERATION METHODS
     ========================================================================== */
  banPost(id, { reason, bannedBy }) {
    const post = this.getPostById(id);
    if (!post) return null;
    post.banned = true;
    post.banReason = reason || 'Sem motivo informado';
    post.bannedBy = bannedBy || 'Sistema';
    post.bannedAt = new Date().toISOString();
    this.addAuditEntry({ action: 'BAN', targetId: id, targetTitle: post.title, performedBy: bannedBy, reason });
    this.save('post', post);
    return post;
  }

  unbanPost(id, performedBy) {
    const post = this.getPostById(id);
    if (!post) return null;
    const oldReason = post.banReason;
    post.banned = false;
    post.banReason = null;
    post.bannedBy = null;
    post.bannedAt = null;
    this.addAuditEntry({ action: 'UNBAN', targetId: id, targetTitle: post.title, performedBy, reason: `Removido ban anterior: ${oldReason}` });
    this.save('post', post);
    return post;
  }

  getAllUsers() {
    return this.data.users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role || 'user',
      createdAt: u.createdAt
    }));
  }

  setUserRole(userId, newRole, performedBy) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    const oldRole = user.role || 'user';
    user.role = newRole;
    this.addAuditEntry({ action: 'ROLE_CHANGE', targetId: userId, targetTitle: user.username, performedBy, reason: `${oldRole} -> ${newRole}` });
    this.save('user', user);
    return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
  }

  getUserRole(username) {
    if (!username) return null;
    const user = this.data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    return user ? (user.role || 'user') : null;
  }

  addAuditEntry({ action, targetId, targetTitle, performedBy, reason }) {
    if (!this.data.auditLog) this.data.auditLog = [];
    const newEntry = {
      id: crypto.randomUUID(),
      action,
      targetId,
      targetTitle: targetTitle || '',
      performedBy: performedBy || 'Sistema',
      reason: reason || '',
      createdAt: new Date().toISOString()
    };
    this.data.auditLog.unshift(newEntry);
    // Manter no máximo 500 entradas
    if (this.data.auditLog.length > 500) {
      this.data.auditLog = this.data.auditLog.slice(0, 500);
    }
    this.save('audit', newEntry);
  }

  getAuditLog() {
    return this.data.auditLog || [];
  }

  getSystemStats() {
    const posts = this.data.posts || [];
    const users = this.data.users || [];
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments ? p.comments.length : 0), 0);
    const totalBanned = posts.filter(p => p.banned).length;

    const postsByType = { image: 0, video: 0, gif: 0 };
    posts.forEach(p => {
      if (postsByType[p.type] !== undefined) postsByType[p.type]++;
    });

    const tagCounts = {};
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        const clean = t.toLowerCase().trim();
        if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topPosts = [...posts]
      .filter(p => !p.banned)
      .sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0)))
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title, views: p.views || 0, likes: p.likes || 0, type: p.type }));

    // Calcular storage aproximado (tamanho do db.json)
    let storageUsed = 0;
    try {
      const stat = fs.statSync(DB_FILE);
      storageUsed = stat.size;
      // Somar tamanho dos uploads
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        files.forEach(f => {
          try {
            const fstat = fs.statSync(path.join(UPLOADS_DIR, f));
            storageUsed += fstat.size;
          } catch {}
        });
      }
    } catch {}

    return {
      totalPosts: posts.length,
      totalUsers: users.length,
      totalViews,
      totalLikes,
      totalComments,
      totalBanned,
      storageUsed,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage().heapUsed,
      postsByType,
      topTags,
      topPosts
    };
  }
}

module.exports = new Database();