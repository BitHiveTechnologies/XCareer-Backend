import request from 'supertest';
import app from '../../../app';
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createAuthenticatedUser,
  authHeader
} from '../../helpers';
import { User } from '../../../models/User';
import { UserProfile } from '../../../models/UserProfile';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => {
  await clearCollections('users', 'userprofiles');
});

const BASE = '/api/v1/users';

describe('PUT /users/me', () => {
  it('should update profile with valid data', async () => {
    const { token } = await createAuthenticatedUser();
    
    const res = await request(app)
      .put(`${BASE}/me`)
      .set(authHeader(token))
      .send({
        firstName: 'John',
        lastName: 'Doe',
        cgpaOrPercentage: 9.0,
        stream: 'CSE'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.firstName).toBe('John');
  });

  it('should return 400 for out-of-range CGPA (11.0)', async () => {
    const { token } = await createAuthenticatedUser();
    
    const res = await request(app)
      .put(`${BASE}/me`)
      .set(authHeader(token))
      .send({
        cgpaOrPercentage: 11.0
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/validation/i);
  });

  it('should return 400 for invalid enum value (stream)', async () => {
    const { token } = await createAuthenticatedUser();
    
    const res = await request(app)
      .put(`${BASE}/me`)
      .set(authHeader(token))
      .send({
        stream: 'MAGIC'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/validation/i);
  });

  it('should create a profile if it does not exist', async () => {
    const { token, userId } = await createAuthenticatedUser();
    
    // Ensure profile is gone
    await UserProfile.deleteMany({ userId });

    const res = await request(app)
      .put(`${BASE}/me`)
      .set(authHeader(token))
      .send({
        firstName: 'New',
        lastName: 'Profile'
      });

    expect(res.status).toBe(200);
    const profile = await UserProfile.findOne({ userId });
    expect(profile).not.toBeNull();
  });
});
