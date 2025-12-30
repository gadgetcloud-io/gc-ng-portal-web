# API Integration Guide

This document explains how the frontend integrates with the GadgetCloud backend API.

## Architecture

The application uses a layered architecture for API communication:

```
Components
    ↓
AuthService / Other Services
    ↓
ApiService (HTTP wrapper)
    ↓
HttpClient + Interceptors
    ↓
Backend API (gc-py-proxy)
```

## Configuration

### Environment Files

**Development** (`src/environments/environment.ts`):
```typescript
{
  production: false,
  apiUrl: 'http://localhost:8000/api',
  apiTimeout: 30000,
  enableLogging: true
}
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
{
  production: true,
  apiUrl: 'https://rest.gadgetcloud.io/api',
  apiTimeout: 30000,
  enableLogging: false
}
```

## Core Services

### ApiService (`src/app/core/services/api.service.ts`)

Handles all HTTP requests to the backend with:
- Automatic timeout handling (30s default)
- Error handling and transformation
- Token management
- Request/response logging (dev mode)

**Methods:**
- `get<T>(endpoint, options?)` - GET requests
- `post<T>(endpoint, body, options?)` - POST requests
- `put<T>(endpoint, body, options?)` - PUT requests
- `delete<T>(endpoint, options?)` - DELETE requests

### Auth Interceptor (`src/app/core/interceptors/auth.interceptor.ts`)

Automatically:
- Adds `Authorization: Bearer <token>` header to all requests
- Handles 401 Unauthorized responses
- Clears session and redirects to login on auth failure

## Switching Between Mock and API Mode

The `AuthService` supports two modes:

### Mock Mode (Default)
Uses localStorage for development without backend:
```typescript
// In auth.service.ts
private useApi = false; // Mock mode
```

**Features:**
- No backend required
- Data persisted in localStorage
- 1-second simulated API delay
- Perfect for frontend development

### API Mode
Connects to real backend:
```typescript
// In auth.service.ts
private useApi = true; // API mode
```

**Features:**
- Real JWT tokens
- Backend validation
- Actual data persistence
- Production-ready

## Backend API Endpoints

### Authentication

**POST /auth/signup**
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**POST /auth/login**
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

## Token Storage

Tokens are stored in localStorage:
- Key: `gc_token`
- Auto-added to requests via interceptor
- Cleared on logout or 401 response

## Error Handling

All API errors are transformed to user-friendly messages:

```typescript
// Client-side errors (network, timeout)
"An error occurred"

// Server errors
error.message || "Server error: <status>"

// Auth errors (401)
Automatic logout + redirect to home
```

## Testing the Integration

### 1. Start Backend
```bash
# Start gc-py-proxy on localhost:8000
cd ../gc-py-proxy
python main.py
```

### 2. Enable API Mode
```typescript
// In src/app/core/services/auth.service.ts
private useApi = true;
```

### 3. Test Authentication
1. Sign up with new account
2. Verify token in localStorage
3. Check Network tab for API calls
4. Test logout clears token
5. Test login with existing account

## Production Deployment

When deploying to production:

1. **Build with production config:**
   ```bash
   npm run build
   ```
   This automatically uses `environment.prod.ts` with the production API URL.

2. **Verify API URL:**
   - Should point to `https://rest.gadgetcloud.io/api`
   - SSL/TLS required in production

3. **Deploy to Cloud Storage:**
   ```bash
   gsutil -m rsync -r -d dist/app gs://www-gadgetcloud-io
   ```

4. **Invalidate CDN cache:**
   ```bash
   gcloud compute url-maps invalidate-cdn-cache www-url-map --path "/*"
   ```

## Security Considerations

1. **Tokens:**
   - Short-lived JWTs (recommended: 1-24 hours)
   - Stored in localStorage (XSS risk - consider httpOnly cookies for production)
   - Auto-cleared on logout or auth failure

2. **HTTPS:**
   - Required in production
   - Prevents token interception

3. **CORS:**
   - Backend must allow frontend domain
   - Include credentials in requests if using cookies

4. **Input Validation:**
   - Frontend validation for UX
   - Backend validation for security
   - Never trust client-side validation alone

## Troubleshooting

**API calls not working:**
1. Check browser console for errors
2. Verify API URL in environment file
3. Confirm backend is running
4. Check CORS configuration
5. Verify token in localStorage

**401 Unauthorized:**
1. Token expired - re-login
2. Token invalid - clear localStorage
3. Backend not accepting token format

**Network timeout:**
1. Backend not responding
2. Increase timeout in environment
3. Check network connectivity

## Next Steps

To fully integrate with backend:

1. ✅ API client service
2. ✅ HTTP interceptor
3. ✅ AuthService API mode
4. ⏳ Device management API
5. ⏳ Document upload API
6. ⏳ Settings API
7. ⏳ Notifications API

See `PROJECT_STATUS.md` for overall project status.
