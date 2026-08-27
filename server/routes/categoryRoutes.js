const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// GET /api/categories - public / student / admin
router.get('/', getCategories);

// POST /api/categories - Admin create
router.post('/', protect, adminOnly, createCategory);

// PUT /api/categories/:id - Admin update
router.put('/:id', protect, adminOnly, updateCategory);

// DELETE /api/categories/:id - Admin delete
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
