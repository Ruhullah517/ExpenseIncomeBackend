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

exports.getCurrentAccount = (req, res) => {
    const userId = req.userId; // Get user ID from the request

    // Fetch accounts associated with the user
    Account.findByUserId(userId, (err, results) => {
        if (err) {
            console.error('Error fetching accounts:', err);
            return res.status(500).send('Error fetching accounts from database');
        }
        if (results.length === 0) {
            return res.status(404).send('No accounts found for this user');
        }

        // Return the first account or modify this logic as needed
        res.status(200).json(results[0]); // Return the first account
    });
};

exports.getAllAccountsForUser = (req, res) => {
    const userId = req.userId; // Get user ID from the request

    // Fetch accounts where the user is an admin
    Account.findByUserId(userId, (err, adminAccounts) => {
        if (err) {
            console.error('Error fetching admin accounts:', err);
            return res.status(500).send('Error fetching accounts from database');
        }

        // Fetch accounts where the user is a member
        Account.getAccountsByMemberId(userId, (err, memberAccounts) => {
            if (err) {
                console.error('Error fetching member accounts:', err);
                return res.status(500).send('Error fetching accounts from database');
            }

            // Combine both lists of accounts
            const allAccounts = [...adminAccounts, ...memberAccounts];
            res.status(200).json(allAccounts);
        });
    });
};
