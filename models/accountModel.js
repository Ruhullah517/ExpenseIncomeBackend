const db = require('../config/db');

const Account = {
    create: (adminId, callback) => {
        db.query('INSERT INTO accounts (admin_id) VALUES (?)', [adminId], callback);
    },
    findById: (accountId, callback) => {
        db.query('SELECT * FROM accounts WHERE id = ?', [accountId], callback);
    },
    findByUserId: (userId, callback) => {
        db.query('SELECT * FROM accounts WHERE admin_id = ?', [userId], callback);
    },
    addUserToAccount: (accountId, userId, callback) => {
        db.query('INSERT INTO account_members (account_id, user_id) VALUES (?, ?)', [accountId, userId], callback);
    },
    isUserMember: (accountId, userId, callback) => {
        db.query('SELECT * FROM account_members WHERE account_id = ? AND user_id = ?', [accountId, userId], (err, results) => {
            if (err) return callback(err);
            callback(null, results.length > 0); // Returns true if the user is a member
        });
    }
};

module.exports = Account;