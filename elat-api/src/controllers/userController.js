const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get All Users (Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create User (Admin)
exports.createUser = async (req, res) => {
    try {
        const { email, password, name, role, assignedCountry, assignedBase, assignedCountries } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({
            email,
            password: passwordHash,
            name,
            role,
            assignedCountry,
            assignedBase,
            assignedCountries
        });

        await user.save();
        res.json(user); // Return user (without token)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update User (Admin)
exports.updateUser = async (req, res) => {
    try {
        const { email, password, name, role, assignedCountry, assignedBase, assignedCountries } = req.body;

        let userFields = { email, name, role, assignedCountry, assignedBase, assignedCountries };

        // Only hash password if it's new (not empty string)
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            userFields.password = await bcrypt.hash(password, salt);
        }

        let user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete User (Admin)
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Import Users (Admin) - Bulk Create
exports.importUsers = async (req, res) => {
    try {
        const users = req.body; // Expecting array of { email, password, name, role... }

        if (!Array.isArray(users)) {
            return res.status(400).json({ msg: 'Data must be an array of users' });
        }

        let createdCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const userData of users) {
            const { email, password, name, role, assignedCountry, assignedBase, assignedCountries } = userData;

            // Basic Validation
            if (!email || !password || !name) {
                errors.push(`Skipped ${email || 'unknown'}: Missing required fields`);
                continue;
            }

            // Check duplicate
            let user = await User.findOne({ email });
            if (user) {
                skippedCount++;
                continue;
            }

            // Create User
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            user = new User({
                email,
                password: passwordHash,
                name,
                role: role || 'USER', // Default role
                assignedCountry,
                assignedBase,
                assignedCountries
            });

            await user.save();
            createdCount++;
        }

        res.json({
            msg: 'Import completed',
            created: createdCount,
            skipped: skippedCount,
            errors
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
