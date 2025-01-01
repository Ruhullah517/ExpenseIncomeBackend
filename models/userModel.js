const db = require('../config/db');

const User = {
    findByEmail: (email, callback) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], callback);
    },
    create: (email, password, name, callback) => {
        db.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, password, name], callback);
    }
};

module.exports = User;
