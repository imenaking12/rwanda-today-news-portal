const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', trim: true, maxlength: 160 },
  image: { type: String, default: '' },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
