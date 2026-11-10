const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

commentSchema.methods.toPublicJSON = function () {
  const author =
    this.author && typeof this.author === 'object' && this.author.username
      ? {
          id: this.author._id,
          username: this.author.username,
          displayName: this.author.displayName || this.author.username,
          avatarUrl: this.author.avatarUrl || '',
        }
      : { id: this.author, username: '', displayName: '', avatarUrl: '' };
  return {
    id: this._id,
    post: this.post,
    author,
    text: this.text,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Comment', commentSchema);
