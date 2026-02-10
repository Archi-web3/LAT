const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },

    // RBAC Roles
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'POOL_COORDINATOR', 'COUNTRY_COORDINATOR', 'USER'],
        default: 'USER'
    },

    // Access Scope
    // Pool Coordinator -> Multiple Countries
    assignedCountries: [{ type: String }],

    // Country Coordinator -> Single Country
    assignedCountry: { type: String },

    // Base User -> Single Base
    assignedBase: { type: String },
    assignedBases: [{ type: String }], // Optional: Multiple bases access

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
