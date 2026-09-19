/**
 * Seed the testimonials that were hardcoded on the website homepage.
 *
 * The homepage falls back to its own copy when the API returns nothing, so these
 * rows move them into the database where an admin can edit them. Idempotent:
 * matching on name + content, so re-running changes nothing.
 *
 * Usage: npx ts-node scripts/seedTestimonials.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Testimonial } from '../src/models/Testimonial';

dotenv.config({ path: path.join(__dirname, '../.env') });

// `company` and `image` on the homepage map to `role` and `avatar` here.
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Google',
    content: 'X Careers gave me the confidence to land my role at Google.',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Amazon',
    content: "DSA practice helped me crack Amazon's interviews.",
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    rating: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Microsoft',
    content: 'Community referrals fast-tracked my Microsoft application.',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    rating: 5,
  },
  {
    name: 'Vikram Singh',
    role: 'Adobe',
    content: 'The resume builder helped me create an ATS-friendly CV that got noticed.',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    rating: 5,
  },
];

const seed = async () => {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const t of testimonials) {
    const existing = await Testimonial.findOne({ name: t.name, content: t.content });
    if (existing) {
      console.log(`skipped (already present): ${t.name}`);
      continue;
    }
    await Testimonial.create({ ...t, isApproved: true, isVerified: true });
    console.log(`created: ${t.name}`);
  }

  const approved = await Testimonial.countDocuments({ isApproved: true });
  console.log(`Done. Approved testimonials now visible on the homepage: ${approved}`);

  await mongoose.disconnect();
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
