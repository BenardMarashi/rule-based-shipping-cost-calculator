// fixed-dev.js
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs';

async function startDevelopment() {
  console.log('Starting development environment...');
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const cloudflaredCmd = isWindows ? 'cloudflared.exe' : 'cloudflared';
  
  // First, start the Cloudflare tunnel
  console.log('Starting Cloudflare tunnel...');
  const cloudflare = spawn(cloudflaredCmd, [
    'tunnel', 
    '--url', 'http://localhost:3000'
  ], {
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: isWindows
  });
  
  // Wait for tunnel URL
  let tunnelUrl = null;
  cloudflare.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Extract tunnel URL
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      console.log(`\n✅ Tunnel URL: ${tunnelUrl}`);
      
      // Update .env file
      try {
        let envContent = '';
        try {
          envContent = fs.readFileSync('.env', 'utf8');
        } catch (err) {
          // File doesn't exist
        }
        
        if (envContent.includes('SHOPIFY_APP_URL=')) {
          envContent = envContent.replace(/SHOPIFY_APP_URL=.*/, `SHOPIFY_APP_URL=${tunnelUrl}`);
        } else {
          envContent += `\nSHOPIFY_APP_URL=${tunnelUrl}`;
        }
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ Updated .env file with tunnel URL');
        
        // ADDED: Update shopify.app.toml
        try {
          const tomlPath = './shopify.app.toml';
          let tomlContent = fs.readFileSync(tomlPath, 'utf8');
          
          // Update application_url
          tomlContent = tomlContent.replace(/application_url\s*=\s*"[^"]*"/, `application_url = "${tunnelUrl}"`);
          
          // Update redirect_urls
          const redirectUrlsRegex = /redirect_urls\s*=\s*\[[\s\S]*?\]/;
          const redirectUrlsMatch = tomlContent.match(redirectUrlsRegex);
          
          if (redirectUrlsMatch) {
            const newRedirectUrls = `redirect_urls = [
  "${tunnelUrl}/auth/callback",
  "${tunnelUrl}/auth/shopify/callback",
  "${tunnelUrl}/api/auth/callback"
]`;
            tomlContent = tomlContent.replace(redirectUrlsRegex, newRedirectUrls);
          }
          
          fs.writeFileSync(tomlPath, tomlContent);
          console.log('✅ Updated shopify.app.toml file with tunnel URL');
        } catch (err) {
          console.error('Error updating shopify.app.toml:', err);
        }
      } catch (err) {
        console.error('Error updating .env:', err);
      }
    }
  });
  
  // Wait for the tunnel to start
  console.log('Waiting for tunnel to initialize (10 seconds)...');
  await setTimeout(10000);
  
  // Now start the development server, using the direct remix command
  console.log('Starting Remix development server...');
  const devServer = spawn(npmCmd, ['run', 'remix'], {
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PORT: 3000 }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    cloudflare.kill();
    devServer.kill();
    process.exit(0);
  });
  
  devServer.on('exit', (code) => {
    console.log(`Development server exited with code ${code}`);
    cloudflare.kill();
    process.exit(code);
  });
}

startDevelopment().catch(err => {
  console.error('Error starting development environment:', err);
  process.exit(1);
});