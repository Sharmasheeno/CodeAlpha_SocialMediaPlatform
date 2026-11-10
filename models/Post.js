const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

postSchema.methods.toPublicJSON = function (viewerId = null, commentsCount = 0) {
  const author =
    this.author && typeof this.author === 'object' && this.author.username
      ? {
          id: this.author._id,
          username: this.author.username,
          displayName: this.author.displayName || this.author.username,
          avatarUrl: this.author.avatarUrl || '',
        }
      : { id: this.author, username: '', displayName: '', avatarUrl: '' };
  const likes = this.likes || [];
  return {
    id: this._id,
    author,
    text: this.text,
    imageUrl: this.imageUrl,
    likesCount: likes.length,
    likedByMe:
      viewerId != null
        ? likes.some((id) => String(id) === String(viewerId))
        : false,
    commentsCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Post', postSchema);
