const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.join(__dirname, 'data');
const SECRET_FILE = path.join(DATA_DIR, 'jwt_secret.txt');

/* ==========================================================================
   JWT SECRET
   - Usa PRISMSHARE_JWT_SECRET do ambiente se definida (recomendado em produção).
   - Caso contrário, gera um segredo aleatório na primeira execução e persiste
     em server/data/jwt_secret.txt (arquivo local, fora do controle de versão)
     para que sessões continuem válidas entre reinícios do servidor.
   ========================================================================== */
function loadOrCreateSecret() {
  if (process.env.PRISMSHARE_JWT_SECRET) {
    return process.env.PRISMSHARE_JWT_SECRET;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(SECRET_FILE)) {
    const existing = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
    if (existing) return existing;
  }

  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, 'utf-8');
  console.log('[Auth] Novo segredo JWT gerado e salvo em server/data/jwt_secret.txt');
  return generated;
}

const JWT_SECRET = loadOrCreateSecret();
const TOKEN_EXPIRY = '7d';

/**
 * Gera um token assinado contendo apenas o ID do usuário.
 * O papel (role) NUNCA é embutido no token: ele é sempre consultado
 * no banco a cada requisição, então mudanças de permissão feitas por
 * um dev/admin têm efeito imediato, sem precisar esperar o token expirar.
 */
function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function extractBearerToken(req) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

module.exports = {
  signToken,
  verifyToken,
  extractBearerToken
};