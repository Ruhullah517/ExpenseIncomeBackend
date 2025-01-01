const Account = require('../models/accountModel');

exports.getAccounts = (req, res) => {
    const userId = req.params.userId;

    Account.findByUserId(userId, (err, results) => {
        if (err) {
            console.error('Error fetching accounts:', err);
            return res.status(500).send('Error fetching accounts from database');
        }
        res.status(200).json(results);
    });
};

exports.addUserToAccount = (req, res) => {
    const { accountId, userId } = req.body; // Expecting accountId and userId in the request body

    Account.addUserToAccount(accountId, userId, (err) => {
        if (err) {
            console.error('Error adding user to account:', err);
            return res.status(500).send('Error adding user to account');
        }
        res.status(200).send('User added to account successfully');
    });
};
