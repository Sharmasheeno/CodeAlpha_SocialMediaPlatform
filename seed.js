require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const DEMO_USERS = [
  {
    username: 'demo',
    email: 'demo@example.com',
    password: 'demo123',
    displayName: 'Demo User',
    bio: 'Just exploring this mini social platform. Say hi!',
  },
  {
    username: 'amina',
    email: 'amina@example.com',
    password: 'amina123',
    displayName: 'Amina Yusuf',
    bio: 'Frontend developer. I post about CSS, design and coffee.',
  },
  {
    username: 'sharma',
    email: 'sharma@example.com',
    password: 'sharma123',
    displayName: 'Sharma Codes',
    bio: 'Full-stack developer building with React, Node.js and Flutter.',
  },
];

const POSTS = {
  demo: [
    'Hello world! This is my very first post on this platform.',
    'Working on a small side project today. Progress feels good.',
  ],
  amina: [
    'CSS tip: a little whitespace does more for a layout than another shadow ever will.',
    'Redesigned my portfolio landing page this week. Feedback welcome!',
    'Hot take: semantic HTML is underrated.',
  ],
  sharma: [
    'Just shipped a REST API with Express and MongoDB. Auth, posts, comments, likes - all wired up.',
    'Learning never stops: today it was aggregation pipelines in Mongoose.',
  ],
};

async function seed() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Cannot seed: MongoDB is not connected. Check MONGO_URI in .env.');
    process.exit(1);
  }

  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Comment.deleteMany({})]);
  console.log('Cleared users, posts and comments.');

  const created = {};
  for (const u of DEMO_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    created[u.username] = await User.create({ ...u, password: hashed });
  }

  // Follow graph: demo <-> amina, sharma follows both, amina follows sharma.
  const follow = async (from, to) => {
    from.following.push(to._id);
    to.followers.push(from._id);
    await from.save();
    await to.save();
  };
  await follow(created.demo, created.amina);
  await follow(created.amina, created.demo);
  await follow(created.sharma, created.demo);
  await follow(created.sharma, created.amina);
  await follow(created.amina, created.sharma);

  const createdPosts = {};
  for (const [username, texts] of Object.entries(POSTS)) {
    createdPosts[username] = [];
    for (const text of texts) {
      const post = await Post.create({ author: created[username]._id, text });
      createdPosts[username].push(post);
    }
  }

  // A few likes and comments so the feed feels alive.
  createdPosts.amina[0].likes.push(created.demo._id, created.sharma._id);
  await createdPosts.amina[0].save();
  createdPosts.sharma[0].likes.push(created.amina._id);
  await createdPosts.sharma[0].save();

  await Comment.create({
    post: createdPosts.sharma[0]._id,
    author: created.amina._id,
    text: 'Nice work! The aggregation part is the fun bit.',
  });
  await Comment.create({
    post: createdPosts.amina[0]._id,
    author: created.demo._id,
    text: 'So true. Whitespace is a design tool.',
  });

  console.log('Seed complete. Demo accounts:');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email} / ${u.password}  (@${u.username})`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(`Seed failed: ${err.message}`);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
