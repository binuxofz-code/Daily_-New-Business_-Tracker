/**
 * Authentication Middleware
 * Protects API routes from unauthorized access
 */

import { NextResponse } from 'next/server';

/**
 * Wraps an API route handler with authentication check
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Protected handler
 */
export function requireAuth(handler) {
    return async (req, res) => {
        try {
            // Check for user session in cookies or headers
            const authHeader = req.headers.get('authorization');
            const sessionCookie = req.cookies.get('user_session');

            // For now, we'll use a simple session check
            // In production, you'd use JWT tokens or session tokens
            if (!sessionCookie && !authHeader) {
                return NextResponse.json(
                    { error: 'Unauthorized - Please login first' },
                    { status: 401 }
                );
            }

            // Parse session data
            let user;
            try {
                if (sessionCookie) {
                    user = JSON.parse(sessionCookie.value);
                } else if (authHeader) {
                    // Handle Bearer token if needed
                    const token = authHeader.replace('Bearer ', '');
                    user = JSON.parse(atob(token)); // Simple base64 decode (use JWT in production)
                }
            } catch (e) {
                return NextResponse.json(
                    { error: 'Invalid session' },
                    { status: 401 }
                );
            }

            // Attach user to request for use in handler
            req.user = user;

            // Call the actual handler
            return handler(req, res);
        } catch (error) {
            return NextResponse.json(
                { error: 'Authentication error: ' + error.message },
                { status: 500 }
            );
        }
    };
}

/**
 * Checks if user has required role
 * @param {Array} allowedRoles - Array of allowed roles (e.g., ['admin', 'zonal_manager'])
 */
export function requireRole(allowedRoles) {
    return (handler) => {
        return requireAuth(async (req, res) => {
            const userRole = req.user?.role;

            if (!allowedRoles.includes(userRole)) {
                return NextResponse.json(
                    { error: 'Forbidden - Insufficient permissions' },
                    { status: 403 }
                );
            }

            return handler(req, res);
        });
    };
}

/**
 * Rate limiting helper (basic implementation)
 * In production, use a proper rate limiting library
 */
const rateLimitMap = new Map();

export function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    return (handler) => {
        return async (req, res) => {
            const ip = req.headers.get('x-forwarded-for') || 'unknown';
            const now = Date.now();
            const windowStart = now - windowMs;

            // Get or create rate limit entry
            if (!rateLimitMap.has(ip)) {
                rateLimitMap.set(ip, []);
            }

            const requests = rateLimitMap.get(ip);

            // Remove old requests outside the window
            const recentRequests = requests.filter(time => time > windowStart);

            if (recentRequests.length >= maxRequests) {
                return NextResponse.json(
                    { error: 'Too many requests - Please try again later' },
                    { status: 429 }
                );
            }

            // Add current request
            recentRequests.push(now);
            rateLimitMap.set(ip, recentRequests);

            return handler(req, res);
        };
    };
}
