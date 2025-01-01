const express = require('express');
const router = express.Router();
const { getAccounts, addUserToAccount } = require('../controllers/accountController');
const { verifyToken } = require('../utils/middleware');

router.get('/current/:userId', verifyToken, getAccounts);
router.post('/add-user', verifyToken, addUserToAccount);

module.exports = router;
