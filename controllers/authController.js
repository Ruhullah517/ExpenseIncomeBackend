const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Account = require('../models/accountModel');

exports.signup = (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).send('Server error');
        if (results.length > 0) return res.status(400).send('User already exists');

        db.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name], (err, result) => {
            if (err) return res.status(500).send('Server error');

            const userId = result.insertId;

            Account.create(userId, (err) => {
                if (err) {
                    console.error('Error creating account:', err);
                    return res.status(500).send('Error creating account');
                }
                res.status(201).send('User and account created successfully');
            });
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(404).send('User not found');
        
        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 });
        res.status(200).send({ auth: true, token });
    });
};

exports.getCurrentUser = (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(403).send('No token provided.');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('Failed to authenticate token.');

        db.query('SELECT id, email, name FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) return res.status(500).send('Server error');
            if (results.length === 0) return res.status(404).send('User not found');

            res.status(200).send(results[0]);
        });
    });
};
