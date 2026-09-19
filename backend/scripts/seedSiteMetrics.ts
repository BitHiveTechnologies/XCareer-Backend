/**
 * Seed the homepage numbers into SystemSettings (category 'metrics').
 *
 * The homepage has always shown hardcoded values because its metrics endpoint
 * was never mounted. These rows carry today's on-screen numbers so nothing
 * changes visually on first deploy; from then on an admin edits them from the
 * dashboard. Existing keys are left untouched, so re-running is a no-op.
 *
 * Values are display strings ("35,213", "10k+"), rendered exactly as typed.
 *
 * Usage: npx ts-node scripts/seedSiteMetrics.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { SystemSettings } from '../src/models/SystemSettings';

dotenv.config({ path: path.join(__dirname, '../.env') });

// description is the admin-facing label: where the number appears.
const metrics = [
  { key: 'freshers_count', value: '35,213', description: 'Hero · Freshers Joined' },
  { key: 'verified_jobs_count', value: '10k+', description: 'Hero · Verified Jobs' },
  { key: 'registered_users_count', value: '42,780', description: 'Hero · Active Members / Impact · Registered Users' },
  { key: 'premium_users_count', value: '1,250', description: 'Hero · Premium Users' },
  { key: 'hero_chip_freshers', value: '35K+ Active Freshers', description: 'Hero · search box chip 1' },
  { key: 'hero_chip_opportunities', value: '10,000+ Verified Opportunities', description: 'Hero · search box chip 2' },
  { key: 'active_members', value: '35,213', description: 'Impact · Active Members' },
  { key: 'posted_jobs_count', value: '1k', description: 'Impact · Posted Jobs' },
  { key: 'linkedin_followers', value: '40k', description: 'Impact · LinkedIn followers' },
];

const seed = async () => {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const m of metrics) {
    const existing = await SystemSettings.findOne({ key: m.key });
    if (existing) {
      console.log(`skipped (already set): ${m.key} = ${existing.value}`);
      continue;
    }
    await SystemSettings.create({ ...m, category: 'metrics' });
    console.log(`created: ${m.key} = ${m.value}`);
  }

  await mongoose.disconnect();
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
