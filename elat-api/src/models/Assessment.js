const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Context
    country: { type: String, required: true },
    base: { type: String, required: true },
    date: { type: Date, default: Date.now },
    evaluationMonth: { type: String }, // Format: "YYYY-MM"

    // Status
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'VALIDATED'], default: 'DRAFT' },

    // The Data (Flexible JSON to match the Angular App's structure)
    answers: { type: Map, of: Number }, // qId -> score
    comments: { type: Map, of: String }, // qId -> comment

    // Snapshot of scores calculated at submission
    score: { type: Number },

    // History Log
    history: [{
        date: { type: Date, default: Date.now },
        user: { type: String }, // Name + Role
        action: { type: String }, // CREATED, UPDATED, SUBMITTED, VALIDATED, RESET, UNLOCKED
        details: { type: String }
    }],

    // Action Plan
    actionPlan: [{
        id: { type: String }, // UUID
        questionId: { type: String },
        description: { type: String },
        owner: { type: String },
        dueDate: { type: Date },
        status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'DONE'], default: 'OPEN' }
    }],

    // Technical
    configVersion: { type: String }, // Which version of the questionnaire was used?
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
