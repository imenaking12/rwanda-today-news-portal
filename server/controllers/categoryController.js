const mongoose = require('mongoose');
const Category = require('../models/Category');
const { slugify } = require('../utils/slug');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description sortOrder')
      .lean();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load categories.' });
  }
};

const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load newsroom categories.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!name || name.length > 50) {
      return res.status(400).json({ success: false, message: 'Category name is required and must be 50 characters or fewer.' });
    }
    if (description.length > 160) {
      return res.status(400).json({ success: false, message: 'Category description must be 160 characters or fewer.' });
    }
    const slug = slugify(name);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Category name must include letters or numbers.' });
    }
    const sortOrder = await Category.countDocuments();
    const category = await Category.create({ name, slug, description, sortOrder, isActive: true });
    res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A category with that name already exists.' });
    }
    res.status(500).json({ success: false, message: 'Unable to create category.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }
    const payload = {};
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 50) {
        return res.status(400).json({ success: false, message: 'Category name must be 1–50 characters.' });
      }
      payload.name = req.body.name.trim();
      payload.slug = slugify(payload.name);
    }
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string' || req.body.description.length > 160) {
        return res.status(400).json({ success: false, message: 'Category description must be 160 characters or fewer.' });
      }
      payload.description = req.body.description.trim();
    }
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive must be true or false.' });
      }
      payload.isActive = req.body.isActive;
    }
    if (req.body.sortOrder !== undefined) {
      if (!Number.isInteger(req.body.sortOrder) || req.body.sortOrder < 0) {
        return res.status(400).json({ success: false, message: 'sortOrder must be a non-negative integer.' });
      }
      payload.sortOrder = req.body.sortOrder;
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'No category changes were provided.' });
    }
    const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.status(200).json({ success: true, message: 'Category updated.', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A category with that name already exists.' });
    }
    res.status(400).json({ success: false, message: 'Unable to update category.' });
  }
};

module.exports = { getCategories, getAdminCategories, createCategory, updateCategory };
