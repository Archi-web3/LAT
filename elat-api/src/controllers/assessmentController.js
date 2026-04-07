const Assessment = require('../models/Assessment');
const User = require('../models/User');

// Sync Assessments (Receive from PWA)
exports.sync = async (req, res) => {
    try {
        const assessments = req.body; // Array of assessments
        if (!Array.isArray(assessments)) {
            return res.status(400).json({ msg: 'Expected an array of assessments' });
        }

        const results = { applied: [], skipped: [], serverUpdates: [], errors: [] };

        for (const item of assessments) {
            try {
                // Find existing by ID or unique context (country/base/month) if it's the same period
                // For simplicity: match by item._id if present, or by context
                let query = {};
                if (item._id) {
                    query = { _id: item._id };
                } else if (item.context) {
                    query = { 
                        country: item.context.country, 
                        base: item.context.base, 
                        evaluationMonth: item.context.evaluationMonth 
                    };
                }

                const existing = await Assessment.findOne(query);

                const assessmentData = {
                    ...item,
                    userId: req.user.id,
                    updatedAt: new Date(item.updatedAt || Date.now())
                };

                if (existing) {
                    // Conflict Resolution: Only update if the incoming data is NEWER than the server
                    const serverTime = new Date(existing.updatedAt).getTime();
                    const clientTime = new Date(assessmentData.updatedAt).getTime();

                    if (clientTime > serverTime) {
                        Object.assign(existing, assessmentData);
                        await existing.save();
                        results.applied.push(item._id || existing._id);
                    } else {
                        results.skipped.push(item._id || existing._id);
                        results.serverUpdates.push(existing); // Send back server version
                    }
                } else {
                    const newAssessment = new Assessment(assessmentData);
                    await newAssessment.save();
                    results.applied.push(newAssessment._id);
                }
            } catch (err) {
                console.error(`Sync error for item:`, err);
                results.errors.push({ id: item._id, msg: err.message });
            }
        }

        res.json({ msg: 'Sync completed', ...results });

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
