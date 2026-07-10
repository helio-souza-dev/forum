const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('../models/Post');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const DB_FILE = path.join(__dirname, '../data/db.json');

async function migrate() {
  const uri = process.argv[2] || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ ERRO: Nenhuma String de Conexão MongoDB foi fornecida.');
    console.error('Uso: node server/scripts/migrate-to-mongo.js "mongodb+srv://usuario:senha@cluster.mongodb.net/prismshare?retryWrites=true&w=majority"');
    process.exit(1);
  }

  console.log('🔄 Conectando ao MongoDB Atlas...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado com sucesso ao MongoDB!');
  } catch (err) {
    console.error('❌ Erro de conexão com o MongoDB:', err.message);
    process.exit(1);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ Arquivo de banco de dados db.json não encontrado em:', DB_FILE);
    process.exit(1);
  }

  console.log('📖 Lendo dados locais do arquivo data/db.json...');
  const rawData = fs.readFileSync(DB_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  const posts = data.posts || [];
  const users = data.users || [];
  const auditLog = data.auditLog || [];

  console.log(`🚀 Iniciando migração para NoSQL: ${posts.length} Posts, ${users.length} Usuários, ${auditLog.length} Logs de Auditoria...`);

  let postsMigrated = 0;
  for (const post of posts) {
    await Post.updateOne({ id: post.id }, { $set: post }, { upsert: true });
    postsMigrated++;
  }
  console.log(`✅ [Posts] ${postsMigrated} posts migrados / atualizados com sucesso no MongoDB.`);

  let usersMigrated = 0;
  for (const user of users) {
    await User.updateOne({ id: user.id }, { $set: user }, { upsert: true });
    usersMigrated++;
  }
  console.log(`✅ [Usuários] ${usersMigrated} usuários migrados / atualizados com sucesso no MongoDB.`);

  let logsMigrated = 0;
  for (const log of auditLog) {
    await AuditLog.updateOne({ id: log.id }, { $set: log }, { upsert: true });
    logsMigrated++;
  }
  console.log(`✅ [AuditLog] ${logsMigrated} registros de auditoria migrados com sucesso no MongoDB.`);

  console.log('\n🎉 MIGRAÇÃO COMPLETA! Todos os dados de data/db.json foram transferidos com sucesso para o banco NoSQL.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate();
