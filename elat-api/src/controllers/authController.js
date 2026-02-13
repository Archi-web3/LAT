const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user (Admin only in future, open for dev)
exports.register = async (req, res) => {
    try {
        const { email, password, name, role, assignedCountry, assignedBase, assignedCountries } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create User
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

        // Create Token (Login immediately after register)
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' }, // Long session for field usage
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        assignedCountry: user.assignedCountry,
                        assignedBase: user.assignedBase,
                        assignedCountries: user.assignedCountries
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Login User
exports.login = async (req, res) => {
    const { email } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);

    try {
        const { password } = req.body;

        // Check User
        console.log(`[AUTH] Finding user in DB...`);
        let user = await User.findOne({ email }).lean(); // Use lean for speed, careful if user methods needed (none used here)

        if (!user) {
            console.warn(`[AUTH] Login failed: User not found (${email})`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        console.log(`[AUTH] User found. Verifying password...`);

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn(`[AUTH] Login failed: Invalid password (${email})`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log(`[AUTH] Password verified. Generating token...`);

        // Return Token
        const payload = {
            user: {
                id: user._id, // lean() returns _id, not id getter
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                console.log(`[AUTH] Token generated. Sending response.`);
                res.json({
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        role: user.role,
                        assignedCountry: user.assignedCountry,
                        assignedBase: user.assignedBase,
                        assignedCountries: user.assignedCountries
                    }
                });
            }
        );
    } catch (err) {
        console.error(`[AUTH] Server Error during login for ${email}:`, err.message);
        res.status(500).send('Server Error');
    }
};

// FORCE ADMIN RESET (Rescue Link)
exports.resetAdmin = async (req, res) => {
    try {
        const { key } = req.query;
        if (key !== 'deploy_rescue_999') {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const email = 'admin@elat.org';
        const password = 'admin123_change_me';

        let user = await User.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        if (user) {
            user.password = passwordHash;
            user.role = 'SUPER_ADMIN';
            await user.save();
            return res.json({ msg: 'Admin updated', email, password });
        }

        user = new User({
            name: 'Super Admin',
            email,
            password: passwordHash,
            role: 'SUPER_ADMIN',
            assignedCountries: [],
            assignedBases: []
        });
        await user.save();
        res.json({ msg: 'Admin created', email, password });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Change Own Password (Authenticated User)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // From authMiddleware

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
