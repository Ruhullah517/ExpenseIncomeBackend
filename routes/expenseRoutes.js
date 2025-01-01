const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addExpense, getExpensesByAccount } = require('../controllers/expenseController');
const { verifyToken } = require('../utils/middleware');

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Use the upload middleware for the add-expense route
router.post('/add-expense', verifyToken, upload.single('image'), addExpense);
router.get('/account/:accountId', verifyToken, getExpensesByAccount);

module.exports = router;
