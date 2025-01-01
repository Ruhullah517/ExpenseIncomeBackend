const express = require('express');
const router = express.Router();
const { signup, login, getCurrentUser } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/current', getCurrentUser);

module.exports = router;
