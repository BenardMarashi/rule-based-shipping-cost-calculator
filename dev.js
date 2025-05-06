// dev.js - Updated with better error handling and retry logic
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { join } from 'path';

async function startDevelopment() {
  console.log('Starting Shopify app development server...');
  
  // Use the npm executable with its full path on Windows
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const cloudflaredCmd = isWindows ? 'cloudflared.exe' : 'cloudflared';
  
  // Start the app in development mode
  const shopifyApp = spawn(npmCmd, ['run', 'dev'], {
    stdio: 'inherit',
    shell: isWindows
  });
  
  // Wait for the app to start
  console.log('Waiting for app to initialize (15 seconds)...');
  await setTimeout(15000);
  
  console.log('Starting Cloudflare tunnel...');
  // Start the Cloudflare tunnel with better error handling
  const cloudflare = spawn(cloudflaredCmd, [
    'tunnel', 
    '--url', 'http://localhost:3000',
    '--no-autoupdate', // Prevent autoupdate issues
    '--metrics', 'localhost:8099' // Add metrics for debugging
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
  
  // Handle child process exit
  shopifyApp.on('exit', (code) => {
    console.log(`Shopify app exited with code ${code}`);
    cloudflare.kill();
    process.exit(code);
  });
  
  cloudflare.on('exit', (code) => {
    console.log(`Cloudflare tunnel exited with code ${code}`);
    if (code !== 0) {
      console.log('Attempting to restart tunnel...');
      startCloudflare();
    } else {
      shopifyApp.kill();
      process.exit(code);
    }
  });
  
  // Function to restart cloudflare if it crashes
  async function startCloudflare() {
    await setTimeout(3000); // Wait before restarting
    const newCloudflare = spawn(cloudflaredCmd, [
      'tunnel', 
      '--url', 'http://localhost:3000',
      '--no-autoupdate',
      '--metrics', 'localhost:8099',
      '--protocol', 'http2', // Try adding this
      '--timeout', '5m',
    ], {
      stdio: 'inherit',
      shell: isWindows
    });
    
    newCloudflare.on('exit', (code) => {
      console.log(`Restarted Cloudflare tunnel exited with code ${code}`);
      if (code !== 0) {
        console.log('Tunnel failed again, exiting...');
        shopifyApp.kill();
        process.exit(1);
      }
    });
  }
}

startDevelopment().catch(err => {
  console.error('Error starting development environment:', err);
  process.exit(1);
});