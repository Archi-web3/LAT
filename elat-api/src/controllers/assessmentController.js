const Assessment = require('../models/Assessment');
const User = require('../models/User');

// Sync Assessments (Receive from PWA)
exports.sync = async (req, res) => {
    try {
        const assessments = req.body; // Array of assessments
        if (!Array.isArray(assessments)) {
            return res.status(400).json({ msg: 'Expected an array of assessments' });
        }

        const results = [];

        for (const item of assessments) {
            // Upsert logic: Update if exists, Insert if new
            // matches on a unique ID from the PWA (we need to ensure PWA sends a UUID)
            // For now, we'll try to match on date + userId + base, OR assumes PWA sends an _id if it was already synced.
            // Better strategy: PWA generates a UUID 'clientSideId'.

            // Simplified for this iteration: Just saving new ones or updating by ID if provided
            // We will assume the PWA sends the full object.

            // Sanitize: ensure userId matches the authenticated user (unless Admin?)
            // For now, trust the token's user ID for ownership enforcement

            const assessmentData = {
                ...item,
                userId: req.user.id // Enforce ownership
            };

            // If it has a MongoDB _id, update it. If not, create it.
            if (item._id) {
                await Assessment.findByIdAndUpdate(item._id, assessmentData, { upsert: true });
            } else {
                const newAssessment = new Assessment(assessmentData);
                await newAssessment.save();
            }
        }

        res.json({ msg: 'Sync successful', count: assessments.length });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get History (RBAC Filtered)
exports.getHistory = async (req, res) => {
    try {
        // Fetch full user to ensure we have the latest assignments
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Debugging
        console.log(`[API] Fetching History for: ${user.name} (${user.role})`);

        let query = {};

        if (user.role === 'SUPER_ADMIN') {
            // See ALL
            query = {};
        } else if (user.role === 'POOL_COORDINATOR' || user.role === 'COUNTRY_COORDINATOR') {
            // See ALL in assigned countries
            let countries = [];
            // Handle both array and single string legacy
            if (Array.isArray(user.assignedCountries) && user.assignedCountries.length > 0) {
                countries = user.assignedCountries;
            } else if (user.assignedCountry) {
                countries = [user.assignedCountry];
            }

            // Debugging
            console.log(`[API] Filtering for Coordinator: ${user.name}`);
            console.log(`[API] Assigned Country (Single):`, user.assignedCountry);
            console.log(`[API] Assigned Countries (Array):`, user.assignedCountries);
            console.log(`[API] Effective Filter List:`, countries);

            query = { country: { $in: countries } };
        } else {
            // USER: See only OWN
            query = { userId: user.id };
        }

        console.log('[API] Assessment Query:', JSON.stringify(query));
        const assessments = await Assessment.find(query)
            .sort({ date: -1 })
            .populate('userId', 'name email')
            .lean(); // Optimize for read-only

        console.log(`[API] Found ${assessments.length} assessments`);

        res.json(assessments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete Assessment (Admin/Coordinator?)
exports.deleteAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ msg: 'Assessment not found' });
        }

        // Access Control (Admin or Owner?)
        // For now, allow Super Admin or the creator
        if (req.user.role !== 'SUPER_ADMIN' && assessment.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await assessment.deleteOne();
        res.json({ msg: 'Assessment removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Assessment not found' });
        }
        res.status(500).send('Server Error');
    }
};
