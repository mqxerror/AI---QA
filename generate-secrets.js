#!/usr/bin/env node

/**
 * Generate secure credentials for production deployment
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 QA Dashboard - Security Credentials Generator\n');
console.log('='.repeat(60));

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n✅ JWT_SECRET (copy this):');
console.log('-'.repeat(60));
console.log(jwtSecret);
console.log('-'.repeat(60));

// Generate a strong random password
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
let password = '';
for (let i = 0; i < 24; i++) {
  password += chars.charAt(Math.floor(Math.random() * chars.length));
}

console.log('\n✅ Suggested ADMIN_PASSWORD (copy this):');
console.log('-'.repeat(60));
console.log(password);
console.log('-'.repeat(60));

console.log('\n📋 Add these to Dockploy environment variables:');
console.log('='.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ADMIN_USERNAME=admin`);
console.log(`ADMIN_PASSWORD=${password}`);
console.log('='.repeat(60));

console.log('\n⚠️  IMPORTANT:');
console.log('- Store these credentials in a secure password manager');
console.log('- Never commit them to Git');
console.log('- Use ADMIN_PASSWORD to login after deployment');
console.log('- You can change the username if you prefer\n');
