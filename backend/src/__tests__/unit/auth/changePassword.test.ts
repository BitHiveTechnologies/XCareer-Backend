import request from 'supertest';
import app from '../../../app';
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createAuthenticatedUser,
  authHeader,
  loginTestUser
} from '../../helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections('users', 'userprofiles'); });

const BASE = '/api/v1/auth';

describe('POST /auth/change-password', () => {
  it('should change password successfully with correct current password', async () => {
    const { token, email, password } = await createAuthenticatedUser();

    const res = await request(app)
      .post(`${BASE}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword: 'NewSecure456!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toMatch(/password changed/i);
  });

  it('should clear the mustChangePassword flag after successful change', async () => {
    // Create user with mustChangePassword=true via model
    const { token, email, password } = await createAuthenticatedUser();
    const { User } = await import('../../../models/User');
    await User.findOneAndUpdate({ email }, { mustChangePassword: true });

    // Change password
    await request(app)
      .post(`${BASE}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword: 'NewSecure456!' });

    // Verify flag cleared
    const user = await User.findOne({ email });
    expect(user?.mustChangePassword).toBe(false);
  });

  it('should return 400 for incorrect current password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post(`${BASE}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: 'WrongCurrent!', newPassword: 'NewSecure456!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/current password is incorrect/i);
  });

  it('should allow login with the new password after change', async () => {
    const { token, email, password } = await createAuthenticatedUser();
    const newPassword = 'ChangedPass789!';

    await request(app)
      .post(`${BASE}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword });

    const loginRes = await loginTestUser(email, newPassword);
    expect(loginRes.res.status).toBe(200);
    expect(loginRes.token).toBeDefined();
  });

  it('should NOT allow login with the OLD password after change', async () => {
    const { token, email, password } = await createAuthenticatedUser();

    await request(app)
      .post(`${BASE}/change-password`)
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword: 'ChangedPass789!' });

    const loginRes = await loginTestUser(email, password);
    expect(loginRes.res.status).toBe(401);
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post(`${BASE}/change-password`)
      .send({ currentPassword: 'any', newPassword: 'any' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
