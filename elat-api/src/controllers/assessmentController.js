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

                const clientTime = new Date(item.updatedAt || Date.now()).getTime();

                if (existing) {
                    const serverTime = new Date(existing.updatedAt).getTime();

                    // MERGING LOGIC
                    // 1. Merge Maps (Answers, Comments, etc.)
                    // Rule: If key exists in both, newer document (global updatedAt) wins
                    const mergeMap = (existingMap, incomingMap) => {
                        if (!incomingMap) return;
                        Object.keys(incomingMap).forEach(key => {
                            if (clientTime >= serverTime || !existingMap.has(key)) {
                                existingMap.set(key, incomingMap[key]);
                            }
                        });
                    };

                    mergeMap(existing.answers, item.answers);
                    mergeMap(existing.comments, item.comments);
                    mergeMap(existing.proofLinks, item.proofLinks);
                    mergeMap(existing.proofPhotos, item.proofPhotos);

                    // 2. Merge Action Plan (by ID)
                    if (Array.isArray(item.actionPlan)) {
                        item.actionPlan.forEach(incomingAction => {
                            const idx = existing.actionPlan.findIndex(a => a.id === incomingAction.id);
                            if (idx > -1) {
                                // Update existing action if newer or if it's the same
                                if (clientTime >= serverTime) {
                                    existing.actionPlan[idx] = { ...existing.actionPlan[idx].toObject(), ...incomingAction };
                                }
                            } else {
                                // Add new action
                                existing.actionPlan.push(incomingAction);
                            }
                        });
                    }

                    // 3. Merge History (Append)
                    if (Array.isArray(item.history)) {
                        // Avoid duplicates by checking date/action? 
                        // For simplicity, just append new entries that aren't already there
                        item.history.forEach(entry => {
                            const exists = existing.history.some(h => 
                                new Date(h.date).getTime() === new Date(entry.date).getTime() && 
                                h.action === entry.action
                            );
                            if (!exists) existing.history.push(entry);
                        });
                    }

                    // 4. Update status if client is newer
                    if (clientTime >= serverTime) {
                        existing.status = item.status || existing.status;
                        existing.score = item.score !== undefined ? item.score : existing.score;
                        existing.submittedBy = item.submittedBy || existing.submittedBy;
                        existing.submittedAt = item.submittedAt || existing.submittedAt;
                        existing.validatedBy = item.validatedBy || existing.validatedBy;
                        existing.validatedAt = item.validatedAt || existing.validatedAt;
                    }

                    existing.updatedAt = new Date(Math.max(serverTime, clientTime));
                    await existing.save();
                    
                    results.applied.push(existing._id);
                    results.serverUpdates.push(existing); // Return merged version
                } else {
                    const newAssessment = new Assessment({
                        ...item,
                        userId: req.user.id,
                        updatedAt: new Date(clientTime)
                    });
                    await newAssessment.save();
                    results.applied.push(newAssessment._id);
                    results.serverUpdates.push(newAssessment);
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
