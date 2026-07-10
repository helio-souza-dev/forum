const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=== PRISMSHARE: Iniciando Servidor Backend (Porta 3001) e Frontend (Porta 5173) ===');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const serverProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '../server'),
  stdio: 'inherit',
  shell: true
});

const clientProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '../client'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  serverProc.kill();
  clientProc.kill();
  process.exit();
});
