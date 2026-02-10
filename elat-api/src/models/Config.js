const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    version: { type: String, required: true }, // e.g. "2025.1"
    active: { type: Boolean, default: false },

    // The structure matches our current JSON
    sections: [{
        id: String,
        title: String,
        questions: [{
            id: String,
            text: String,
            type: String,
            weight: Number,
            options: [{ label: String, value: Number }],
            transversalTags: [String],
            verification: String
        }]
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', ConfigSchema);
