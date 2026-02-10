const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    key: { type: String, default: 'app-config', unique: true }, // Singleton pattern
    sections: { type: Array, default: [] }, // Array of AssessmentSection
    settings: { type: Object, default: {} }, // AdminConfig object
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String }
});

module.exports = mongoose.model('Config', ConfigSchema);
