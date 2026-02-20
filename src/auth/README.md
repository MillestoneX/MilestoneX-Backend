# Authentication Module

This module provides JWT-based authentication for the StellarAid API.

## Features

- User registration with email and wallet address
- User login with email/password
- JWT token generation and validation
- Protected routes using JWT authentication
- Password hashing with bcrypt

## Endpoints

### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "walletAddress": "GABC123..."
}
```

**Response:**
```json
{
  "accessToken": "jwt-token-string",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "walletAddress": "GABC123..."
  }
}
```

### POST /auth/login
Login with existing credentials

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token-string",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "walletAddress": "GABC123..."
  }
}
```

### GET /auth/profile
Get current user profile (requires JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "sub": "1",
  "email": "user@example.com",
  "walletAddress": "GABC123..."
}
```

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=1d
```

## Dependencies

- `@nestjs/jwt` - JWT token handling
- `@nestjs/passport` - Authentication middleware
- `bcrypt` - Password hashing
- `passport-jwt` - JWT strategy for Passport
- `class-validator` - Request validation

## Security Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens are signed with a secret key
- All endpoints use validation decorators
- Current implementation uses in-memory storage (replace with database in production)

## Testing

Run the authentication tests:
```bash
npm run test auth
```

## Next Steps

1. Replace in-memory storage with a proper database
2. Add user roles and permissions
3. Implement refresh tokens
4. Add email verification
5. Add rate limiting for auth endpoints
6. Implement proper error handling and logging