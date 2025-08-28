export interface JWTPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}
/**
 * Generate JWT access token
 */
export declare const generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
/**
 * Verify JWT access token
 */
export declare const verifyToken: (token: string) => JWTPayload;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (payload: Omit<RefreshTokenPayload, "iat" | "exp">) => string;
/**
 * Verify refresh token
 */
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
/**
 * Decode JWT token without verification (for debugging)
 */
export declare const decodeToken: (token: string) => any;
//# sourceMappingURL=jwt.d.ts.map