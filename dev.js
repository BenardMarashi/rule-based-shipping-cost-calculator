// simplified-dev.js
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function startDevelopment() {
  console.log('Starting Shopify app development server...');
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const cloudflaredCmd = isWindows ? 'cloudflared.exe' : 'cloudflared';
  
  // Start the app in development mode first
  const shopifyApp = spawn(npmCmd, ['run', 'dev'], {
    stdio: 'inherit',
    shell: isWindows
  });
  
  // Wait for the app to start
  console.log('Waiting for app to initialize (20 seconds)...');
  await setTimeout(20000);
  
  // Start a basic Cloudflare tunnel
  console.log('Starting Cloudflare tunnel...');
  const cloudflare = spawn(cloudflaredCmd, [
    'tunnel', 
    '--url', 'http://localhost:3000'
  ], {
    stdio: 'inherit',
    shell: isWindows
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    cloudflare.kill();
    shopifyApp.kill();
    process.exit(0);
  });
  
  shopifyApp.on('exit', (code) => {
    console.log(`Shopify app exited with code ${code}`);
    cloudflare.kill();
    process.exit(code);
  });
}

startDevelopment().catch(err => {
  console.error('Error starting development environment:', err);
  process.exit(1);
});