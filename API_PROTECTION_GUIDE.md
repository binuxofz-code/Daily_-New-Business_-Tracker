# API Route Protection - Implementation Guide

## ✅ What We've Created:

### 1. Authentication Middleware (`src/middleware/auth.js`)
Three powerful protection functions:
- `requireAuth()` - Ensures user is logged in
- `requireRole(['admin'])` - Ensures user has specific role
- `rateLimit(100, 15*60*1000)` - Limits requests (100 per 15 min)

### 2. Example Implementation (`src/app/api/recruitments/route.js`)
Shows how to use the middleware with detailed comments.

---

## 🔧 How to Enable Protection:

### Step 1: Choose which API routes to protect
Common candidates:
- `/api/recruitments/*` - Recruitment data
- `/api/records/*` - Business records
- `/api/users/*` - User management
- `/api/stats/*` - Statistics

### Step 2: Apply middleware to route

**Before (Unprotected):**
```javascript
export async function GET(request) {
    // Anyone can access this
}
```

**After (Protected):**
```javascript
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async function(request) {
    // Only logged-in users can access
    const userId = request.user.id; // User data available
});
```

### Step 3: Add role-based protection (optional)

```javascript
import { requireRole } from '@/middleware/auth';

// Only admins can access
export const DELETE = requireRole(['admin'])(async function(request) {
    // Only admins reach here
});
```

### Step 4: Add rate limiting (optional)

```javascript
import { rateLimit } from '@/middleware/auth';

// Max 50 requests per 15 minutes
export const POST = rateLimit(50, 15*60*1000)(async function(request) {
    // Rate limited
});
```

---

## ⚠️ Important Notes:

### Current Status:
- Middleware is created ✓
- Examples are documented ✓
- **Protection is NOT YET ACTIVE** (for backward compatibility)

### To Activate:
1. Uncomment the middleware imports in each API route
2. Wrap the handlers with the protection functions
3. Test thoroughly to ensure existing functionality works

### Session Management:
Currently using simple cookie-based sessions. For production:
- Consider implementing JWT tokens
- Use secure, httpOnly cookies
- Add session expiration
- Implement refresh tokens

---

## 📝 Next Steps (Optional):

1. **Enable protection gradually:**
   - Start with one API route
   - Test thoroughly
   - Roll out to other routes

2. **Implement proper session management:**
   - Use JWT tokens instead of plain cookies
   - Add token expiration and refresh
   - Store sessions securely

3. **Add logging:**
   - Log failed authentication attempts
   - Monitor rate limit violations
   - Track suspicious activity

---

## 🎯 Quick Start Example:

To protect the recruitments API right now:

1. Open `src/app/api/recruitments/route.js`
2. Uncomment line 6:
   ```javascript
   import { requireAuth, requireRole, rateLimit } from '@/middleware/auth';
   ```
3. Replace `export async function GET(request)` with:
   ```javascript
   export const GET = requireAuth(async function(request) {
   ```
4. Test the application

Done! The recruitment API is now protected.
