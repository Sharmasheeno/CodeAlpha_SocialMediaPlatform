# CodeAlpha Social Media Platform

A mini social media web application built for the **CodeAlpha Full Stack Development Internship — Task 2: Social Media Platform**.

Users can register and log in, publish posts (with an optional image URL), comment on posts, like/unlike posts, follow/unfollow other users, and view and edit profiles.

> This project was built as **Task 2** of the CodeAlpha Full Stack Development internship tasks.

## Features

- **Authentication** — register and log in with bcrypt-hashed passwords and JWT sessions
- **Profiles** — public profile page for every user (`profile.html?username=...`) showing their posts and follower/following counts; the owner can edit their display name and bio
- **Posts** — create a post (text + optional image URL), a newest-first feed, delete your own posts
- **Comments** — comment on any post (stored in a dedicated `Comment` model)
- **Likes** — like/unlike any post
- **Follow system** — follow/unfollow users, with a "People to follow" explore list on the feed page

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Backend  | Node.js, Express 4                           |
| Database | MongoDB with Mongoose                        |
| Auth     | bcryptjs (hashing), jsonwebtoken (JWT)       |
| Frontend | Vanilla HTML, CSS and JavaScript (no build step), served statically by Express from `/public` |

## Project Structure

```
.
├── server.js            # Express app entry point
├── config/
│   └── db.js            # MongoDB connection (non-fatal if unreachable)
├── models/
│   ├── User.js          # followers / following, profile fields
│   ├── Post.js          # text, imageUrl, likes
│   └── Comment.js       # post + author + text
├── routes/
│   ├── auth.js          # register / login / me
│   ├── users.js         # explore list, profile, edit profile, follow toggle
│   └── posts.js         # feed, create, delete, like, comments
├── middleware/
│   └── auth.js          # JWT auth (required + optional variants)
├── seed.js              # Demo data seeder
└── public/
    ├── index.html       # Feed page
    ├── profile.html     # Profile page (?username=...)
    ├── login.html
    ├── register.html
    ├── css/style.css
    └── js/              # common.js, feed.js, profile.js, login.js, register.js
```

## Setup

### Prerequisites

- Node.js 18+
- A running **MongoDB** instance (local `mongod`, MongoDB Atlas, or Docker: `docker run -p 27017:27017 mongo`)

### Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` if needed:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/codealpha_social
   JWT_SECRET=change_this_to_a_long_random_secret
   ```

3. (Optional) Seed demo data:

   ```bash
   npm run seed
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://localhost:5000 in your browser.

> Note: the server still starts and serves the frontend even if MongoDB is not reachable (the connection error is logged). The API data routes need a running MongoDB to return data.

## Demo Accounts

Created by `npm run seed` (3 users, posts, comments, likes and a follow graph):

| Username | Email              | Password   |
| -------- | ------------------ | ---------- |
| demo     | demo@example.com   | demo123    |
| amina    | amina@example.com  | amina123   |
| sharma   | sharma@example.com | sharma123  |

## API Endpoints

| Method | Endpoint                              | Auth     | Description                              |
| ------ | ------------------------------------- | -------- | ---------------------------------------- |
| POST   | `/api/auth/register`                  | No       | Register `{username, email, password, displayName?, bio?}` |
| POST   | `/api/auth/login`                     | No       | Log in `{email, password}` (username also accepted) |
| GET    | `/api/auth/me`                        | Yes      | Current logged-in user                   |
| GET    | `/api/users`                          | Optional | Explore / "People to follow" list       |
| GET    | `/api/users/:username`                | Optional | Public profile + that user's posts       |
| PUT    | `/api/users/me`                       | Yes      | Edit own profile `{displayName, bio, avatarUrl}` |
| POST   | `/api/users/:id/follow`               | Yes      | Toggle follow / unfollow                 |
| GET    | `/api/posts`                          | Optional | Feed, newest first (with comment counts) |
| POST   | `/api/posts`                          | Yes      | Create post `{text, imageUrl?}`          |
| DELETE | `/api/posts/:id`                      | Yes      | Delete own post (and its comments)       |
| POST   | `/api/posts/:id/like`                 | Yes      | Toggle like / unlike                     |
| GET    | `/api/posts/:id/comments`             | Optional | List comments on a post                  |
| POST   | `/api/posts/:id/comments`             | Yes      | Add a comment `{text}`                   |
| DELETE | `/api/posts/:postId/comments/:commentId` | Yes   | Delete own comment                       |
| GET    | `/api/health`                         | No       | Health check incl. DB connection state   |

"Optional" auth means the route works for guests, and personalises the response (`likedByMe`, `isFollowing`) when a valid JWT is sent.

## License

MIT
