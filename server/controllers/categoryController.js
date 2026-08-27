const mongoose = require('mongoose');
const Category = require('../models/Category');
const Exam = require('../models/Exam');

const DEFAULT_CATEGORIES = [
  { name: 'JavaScript', icon: '🟨', description: 'Core and advanced JavaScript programming exams.', enabled: true },
  { name: 'Node.js', icon: '🟧', description: 'Server-side JavaScript runtime and backend architecture.', enabled: true },
  { name: 'Express', icon: '🟫', description: 'Fast, unopinionated web framework for Node.js.', enabled: true },
  { name: 'MongoDB', icon: '🟩', description: 'Document-oriented NoSQL database and querying.', enabled: true },
  { name: 'React', icon: '⚛️', description: 'Frontend component-driven user interface development.', enabled: true },
  { name: 'MERN', icon: '🔴', description: 'Full-stack MongoDB, Express, React, and Node.js solutions.', enabled: true },
  { name: 'General Programming', icon: '⚙️', description: 'Core computer science, algorithms, and problem solving.', enabled: true },
];

/**
 * GET /api/categories
 * Retrieve categories (auto-seeds defaults if empty)
 */
const getCategories = async (req, res) => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    const { all } = req.query;
    const query = all === 'true' ? {} : { enabled: true };
    const categories = await Category.find(query).sort({ createdAt: 1 });

    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Server error while fetching categories' });
  }
};

/**
 * POST /api/categories
 * Admin create new category
 */
const createCategory = async (req, res) => {
  try {
    const { name, description = '', icon = '📚', enabled = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const category = await Category.create({
      name: trimmedName,
      description: description.trim(),
      icon: icon.trim() || '📚',
      enabled: enabled !== false,
    });

    return res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Server error while creating category' });
  }
};

/**
 * PUT /api/categories/:id
 * Admin update category
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, enabled } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name.trim() && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
      category.name = name.trim();
    }

    if (typeof description === 'string') category.description = description.trim();
    if (typeof icon === 'string' && icon.trim()) category.icon = icon.trim();
    if (typeof enabled === 'boolean') category.enabled = enabled;

    await category.save();

    return res.status(200).json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Server error while updating category' });
  }
};

/**
 * DELETE /api/categories/:id
 * Admin delete category with exam presence safety check
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Safety check: verify no exams are assigned to this category
    const examCount = await Exam.countDocuments({ category: id });
    if (examCount > 0) {
      return res.status(400).json({
        message: 'This category contains exams. Please move those exams to another category before deleting it.',
        examCount,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Server error while deleting category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
