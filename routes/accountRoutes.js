const express = require('express');
const router = express.Router();
const { getAccounts, addUserToAccount, getCurrentAccount, getAllAccountsForUser } = require('../controllers/accountController');
const { verifyToken } = require('../utils/middleware');

router.get('/current/:userId', verifyToken, getAccounts);
router.post('/add-user', verifyToken, addUserToAccount);
router.get('/current-account', verifyToken, getCurrentAccount);
router.get('/all-accounts', verifyToken, getAllAccountsForUser);

module.exports = router;
