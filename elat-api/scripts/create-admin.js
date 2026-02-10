require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const email = 'admin@elat.org'; // Default admin email
        const password = 'admin123_change_me'; // Default admin password
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ email });

        if (user) {
            console.log('User found. Updating password...');
            user.password = hashedPassword;
            user.role = 'SUPER_ADMIN'; // Ensure role is correct
            await user.save();
            console.log('✅ Admin password updated.');
        } else {
            console.log('Creating new admin user...');
            user = new User({
                name: 'Super Admin',
                email: email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                assignedCountries: [],
                assignedBases: []
            });
            await user.save();
            console.log('✅ Admin user created.');
        }

        console.log(`\nEmail: ${email}`);
        console.log(`Password: ${password}`);

        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

createAdmin();
