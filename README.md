# 🌟 StellarAid-api
StellarAid Backend is the server-side API powering the StellarAid crowdfunding platform — a blockchain‑enabled system built on the Stellar network to support transparent, secure, and efficient fundraising for social impact initiatives.


# Folder structure 
```bash
/src
  /modules
    /auth
    /users
    /projects
    /donations
    /wallet
    /admin
    /notifications
  /common
  /database
  /config
```
## 📌 Features

### 🎯 For Donors
- Discover global fundraising campaigns  
- Donate in XLM or Stellar assets  
- Wallet integration (Freighter, Albedo, Lobstr)  
- On-chain transparency: verify all transactions  

### 🎯 For Creators
- Create social impact projects  
- Accept multi-asset contributions  
- Real-time donation tracking  
- Withdraw funds directly on-chain  

### 🎯 For Admins
- Campaign approval workflow  
- User & KYC management  
- Analytics dashboard  

## 🏗️ Architecture Overview

StellarAid  Backend is built with: 
- NestJS  
- PostgreSQL  
- Prisma ORM  
- Horizon API integration  
- Worker processes (BullMQ)
  
# 📚 API Documentation (Swagger)

StellarAid API includes Swagger (OpenAPI) documentation for easy exploration and testing of endpoints.

## Accessing Swagger UI

When the application is running with Swagger enabled:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs-json

## Authentication in Swagger

1. Click the **"Authorize"** button in the top right of the Swagger UI
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"** and close the dialog
4. All protected endpoints will now include the Authorization header

## Environment Configuration

Swagger is controlled via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `ENABLE_SWAGGER` | Override to enable/disable Swagger explicitly | - |

### Behavior

- **Development**: Swagger is **enabled** by default
- **Production**: Swagger is **disabled** by default (set `ENABLE_SWAGGER=true` to override)
- **Explicit override**: Set `ENABLE_SWAGGER=true` or `ENABLE_SWAGGER=false` to force enable/disable regardless of environment

## Example `.env` Configuration

```env
# Enable Swagger in production (not recommended for public APIs)
NODE_ENV=production
ENABLE_SWAGGER=true

# Or disable in development
NODE_ENV=development
ENABLE_SWAGGER=false
```

# 📌 How to Contribute

### 1. Fork the Repository
Click the **"Fork"** button in the top‑right of the GitHub repo and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/stellaraid-api.git
cd stellaraid-api
````
###  Backend Setup
``bash
cp .env.example .env
npm install
npm run start:dev
``

### 2. Create a Branch
````bash
git checkout -b feature/add-donation-flow
````

### 3. Commit Messages
Use conventional commits:
````bash
feat: add wallet connection endpoint
fix: resolve donation API error
docs: update project README
refactor: clean up project creation form
````
### 4. Submitting a Pull Request (PR)
Push your branch:
```bash
git push origin feature/add-donation-flow
```
Open a Pull Request from your fork back to the main branch.

# 📜 License
MIT License — free to use, modify, and distribute.
