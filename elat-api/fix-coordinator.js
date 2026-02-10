require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const fixUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'jgenet@actioncontrelafaim.org'; // From screenshot
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            process.exit(1);
        }

        console.log('Found user:', user.name);
        console.log('Old Assigned Country:', user.assignedCountry);

        // FIX
        user.assignedCountry = 'CD'; // DR Congo based on Goma/Drodro context
        if (!user.assignedCountries || user.assignedCountries.length === 0) {
            user.assignedCountries = ['CD'];
        }

        await user.save();
        console.log('✅ User updated successfully!');
        console.log('New Assigned Country:', user.assignedCountry);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixUser();
