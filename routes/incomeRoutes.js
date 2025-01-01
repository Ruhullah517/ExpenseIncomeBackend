const express = require('express');
const router = express.Router();
const { addIncome, getIncomesByAccount } = require('../controllers/incomeController');
const { verifyToken } = require('../utils/middleware');

router.post('/add-income', verifyToken, addIncome);
router.get('/account/:accountId', verifyToken, getIncomesByAccount);

module.exports = router; 