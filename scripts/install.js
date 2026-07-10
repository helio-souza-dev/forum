const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('--- Instalando dependências do servidor ---');
const serverRes = spawnSync(npmCmd, ['install'], {
  cwd: path.join(__dirname, '../server'),
  stdio: 'inherit',
  shell: true
});
if (serverRes.status !== 0) process.exit(serverRes.status);

console.log('--- Instalando dependências do cliente ---');
const clientRes = spawnSync(npmCmd, ['install'], {
  cwd: path.join(__dirname, '../client'),
  stdio: 'inherit',
  shell: true
});
if (clientRes.status !== 0) process.exit(clientRes.status);

console.log('--- Instalação concluída com sucesso! ---');
