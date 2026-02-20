// Validation script to check authentication module setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Authentication Module Setup...\n');

const requiredFiles = [
  'src/auth/auth.module.ts',
  'src/auth/auth.service.ts',
  'src/auth/auth.controller.ts',
  'src/auth/auth.controller.spec.ts',
  'src/auth/strategies/jwt.strategy.ts',
  'src/auth/dtos/register.dto.ts',
  'src/auth/dtos/login.dto.ts',
  'src/auth/interfaces/auth.interface.ts',
  'src/auth/README.md'
];

const requiredDependencies = [
  '@nestjs/jwt',
  '@nestjs/passport',
  'bcrypt',
  'passport',
  'passport-jwt'
];

const requiredDevDependencies = [
  '@types/bcrypt',
  '@types/passport-jwt'
];

let allValid = true;

// Check if files exist
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    allValid = false;
  }
});

console.log('\n📦 Checking package.json dependencies:');
const packageJson = require('./package.json');

// Check dependencies
console.log('  Dependencies:');
requiredDependencies.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`    ✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`    ❌ ${dep} (MISSING)`);
    allValid = false;
  }
});

// Check dev dependencies
console.log('  Dev Dependencies:');
requiredDevDependencies.forEach(dep => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`    ✅ ${dep}: ${packageJson.devDependencies[dep]}`);
  } else {
    console.log(`    ❌ ${dep} (MISSING)`);
    allValid = false;
  }
});

// Check app.module.ts imports
console.log('\n🔌 Checking app.module.ts imports:');
const appModulePath = path.join(__dirname, 'src/app.module.ts');
if (fs.existsSync(appModulePath)) {
  const appModuleContent = fs.readFileSync(appModulePath, 'utf8');
  if (appModuleContent.includes('AuthModule')) {
    console.log('  ✅ AuthModule imported in app.module.ts');
  } else {
    console.log('  ❌ AuthModule not imported in app.module.ts');
    allValid = false;
  }
} else {
  console.log('  ❌ src/app.module.ts not found');
  allValid = false;
}

// Check .env.example
console.log('\n🔐 Checking .env.example:');
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  if (envContent.includes('JWT_SECRET')) {
    console.log('  ✅ JWT_SECRET present in .env.example');
  } else {
    console.log('  ❌ JWT_SECRET missing from .env.example');
    allValid = false;
  }
  if (envContent.includes('JWT_EXPIRES_IN')) {
    console.log('  ✅ JWT_EXPIRES_IN present in .env.example');
  } else {
    console.log('  ❌ JWT_EXPIRES_IN missing from .env.example');
    allValid = false;
  }
} else {
  console.log('  ❌ .env.example not found');
  allValid = false;
}

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 Authentication Module Setup: COMPLETE');
  console.log('\n✅ All required files and dependencies are present');
  console.log('✅ Module is properly configured');
  console.log('✅ Ready for development');
  console.log('\nNext steps:');
  console.log('1. Run: npm install (if not already done)');
  console.log('2. Create .env file with JWT_SECRET');
  console.log('3. Run: npm run start:dev');
  console.log('4. Test endpoints at http://localhost:3000/auth');
} else {
  console.log('❌ Authentication Module Setup: INCOMPLETE');
  console.log('\nPlease fix the missing files/dependencies listed above');
}
console.log('='.repeat(50));