// Frees a TCP port by killing whatever process is listening on it.
// Runs automatically before `npm run dev` (see the "predev" script).
// Override the port with: PORT=4000 node scripts/free-port.mjs
import { execSync } from 'node:child_process';

const PORT = Number(process.env.PORT) || 3000;

function killWindows(port) {
  let out = '';
  try {
    out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
  } catch {
    return;
  }
  const pids = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(/TCP\s+(\S+):(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
    if (m && Number(m[2]) === port) pids.add(m[3]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`);
      console.log(`[free-port] Freed port ${port} (killed PID ${pid})`);
    } catch {
      /* already gone */
    }
  }
}

function killPosix(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    for (const pid of out.split('\n').filter(Boolean)) {
      execSync(`kill -9 ${pid}`);
      console.log(`[free-port] Freed port ${port} (killed PID ${pid})`);
    }
  } catch {
    /* nothing on the port */
  }
}

if (process.platform === 'win32') killWindows(PORT);
else killPosix(PORT);
