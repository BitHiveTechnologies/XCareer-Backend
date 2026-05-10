/**
 * Connect to the in-memory MongoDB set up by globalSetup.
 * Call this in beforeAll().
 */
export declare function connectTestDB(): Promise<void>;
/**
 * Disconnect and drop the in-memory DB after tests.
 * Call this in afterAll().
 */
export declare function disconnectTestDB(): Promise<void>;
/**
 * Clear all collections between test cases.
 * Call this in beforeEach() or afterEach().
 */
export declare function clearCollections(...models: string[]): Promise<void>;
/**
 * Register a test user and return the access token.
 */
export declare function registerTestUser(overrides?: Record<string, any>): Promise<{
    res: import("superagent/lib/node/response");
    data: {
        email: string;
        password: string;
        name: string;
    };
}>;
/**
 * Login and return the access token + user id.
 */
export declare function loginTestUser(email: string, password: string): Promise<{
    token: any;
    userId: any;
    res: import("superagent/lib/node/response");
}>;
/**
 * Register + login in one call.
 */
export declare function createAuthenticatedUser(overrides?: Record<string, any>): Promise<{
    email: string;
    password: string;
    token: any;
    userId: any;
    res: import("superagent/lib/node/response");
}>;
/**
 * Auth header helper.
 */
export declare const authHeader: (token: string) => {
    Authorization: string;
};
//# sourceMappingURL=helpers.d.ts.map