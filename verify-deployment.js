#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

const PORT = process.env.PORT || process.env.MEMORYLOOM_HEALTH_PORT || '3001';

console.log('🚀 MemoryLoom Deployment Verification');
console.log('=====================================');

// Test 1: Check if server starts
console.log('\n1. Testing server startup...');
const server = spawn('node', ['server.js'], {
  env: { ...process.env, MEMORYLOOM_HEALTH_PORT: PORT },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverOutput += data.toString();
});

// Wait for server to start
setTimeout(() => {
  console.log('✅ Server started');
  
  // Test 2: Check health endpoint
  console.log('\n2. Testing health endpoint...');
  const healthReq = http.request(`http://localhost:${PORT}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        if (health.ok) {
          console.log('✅ Health endpoint working');
          console.log(`   Server: ${health.server} v${health.version}`);
        } else {
          console.log('❌ Health endpoint returned error');
        }
      } catch (e) {
        console.log('❌ Health endpoint returned invalid JSON');
      }
      
      // Test 3: Check web UI
      console.log('\n3. Testing web UI...');
      const uiReq = http.request(`http://localhost:${PORT}/`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.includes('MemoryLoom') && data.includes('<!doctype html>')) {
            console.log('✅ Web UI working');
          } else {
            console.log('❌ Web UI not working');
            console.log('Response:', data.substring(0, 200));
          }
          
          // Cleanup
          server.kill();
          console.log('\n🎉 Deployment verification complete!');
          process.exit(0);
        });
      });
      
      uiReq.on('error', (e) => {
        console.log('❌ Web UI request failed:', e.message);
        server.kill();
        process.exit(1);
      });
      
      uiReq.end();
    });
  });
  
  healthReq.on('error', (e) => {
    console.log('❌ Health endpoint request failed:', e.message);
    server.kill();
    process.exit(1);
  });
  
  healthReq.end();
}, 2000);

server.on('error', (e) => {
  console.log('❌ Server failed to start:', e.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Verification timed out');
  server.kill();
  process.exit(1);
}, 10000);