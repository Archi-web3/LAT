require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const setupAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const email = 'admin@acf.org';
        const password = 'password123';

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('⚠️ Admin user already exists');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create Admin
        user = new User({
            email,
            password: passwordHash,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            assignedCountry: 'FR',
            assignedBase: 'Paris HQ'
        });

        await user.save();
        console.log('🎉 Admin User Created: admin@acf.org / password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

setupAdmin();
