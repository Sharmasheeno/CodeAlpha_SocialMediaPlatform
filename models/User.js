const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // never returned by default; select('+password') to read
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Shape a user document for API responses: counts instead of raw id arrays.
userSchema.methods.toPublicJSON = function (viewerId = null) {
  const followers = this.followers || [];
  const following = this.following || [];
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    displayName: this.displayName || this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    followersCount: followers.length,
    followingCount: following.length,
    isFollowing:
      viewerId != null
        ? followers.some((id) => String(id) === String(viewerId))
        : false,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
