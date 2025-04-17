// dev.js
const { spawn } = require('child_process');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function startDevelopment() {
  console.log('Starting Shopify app development server...');
  
  // Start the app in development mode
  const shopifyApp = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit'
  });
  
  // Wait for the app to start
  console.log('Waiting for app to initialize (15 seconds)...');
  await sleep(15000);
  
  console.log('Starting Cloudflare tunnel...');
  // Start the Cloudflare tunnel
  const cloudflare = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000'], {
    stdio: 'inherit'
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    cloudflare.kill();
    shopifyApp.kill();
    process.exit(0);
  });
  
  // Handle child process exit
  shopifyApp.on('exit', (code) => {
    console.log(`Shopify app exited with code ${code}`);
    cloudflare.kill();
    process.exit(code);
  });
  
  cloudflare.on('exit', (code) => {
    console.log(`Cloudflare tunnel exited with code ${code}`);
    shopifyApp.kill();
    process.exit(code);
  });
}

startDevelopment().catch(err => {
  console.error('Error starting development environment:', err);
  process.exit(1);
});