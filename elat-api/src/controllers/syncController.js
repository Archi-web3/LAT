const Assessment = require('../models/Assessment');

/**
 * Handle bidirectional sync
 * POST /api/assessments/sync
 */
exports.syncAssessments = async (req, res) => {
    try {
        const { changes, lastSyncTimestamp } = req.body;
        const userId = req.user.userId;

        const applied = [];
        const errors = [];
        const conflicts = []; // Not used yet, but prepared for strict conflict handling

        // 1. Apply Client Changes (Push)
        if (changes && Array.isArray(changes)) {
            for (const change of changes) {
                try {
                    // Check if assessment exists on server
                    const serverDoc = await Assessment.findOne({ id: change.id });

                    if (serverDoc) {
                        // Update existing
                        // Simple "Last Write Wins" for now, or "Client Wins" if we trust the offline work
                        // Ideally we check timestamps. If serverDoc.updatedAt > change.baseVersion?.updatedAt -> Conflict
                        // For V1: We overwrite server with client change, BUT we update the 'updatedAt'
                        Object.assign(serverDoc, change);
                        serverDoc.updatedAt = new Date(); // Force update timestamp
                        await serverDoc.save();
                        applied.push(change.id);
                    } else {
                        // Create new
                        const newDoc = new Assessment(change);
                        // Ensure ownership is correct if not present
                        if (!newDoc.userId) newDoc.userId = userId;
                        await newDoc.save();
                        applied.push(change.id);
                    }
                } catch (err) {
                    console.error(`Failed to sync assessment ${change.id}`, err);
                    errors.push({ id: change.id, error: err.message });
                }
            }
        }

        // 2. Get Server Updates (Pull)
        // Find assessments updated AFTER lastSyncTimestamp
        // AND that are relevant to this user (owned by them OR shared/public logic)
        // For now: assume user sees their own assessments + maybe those assigned to their country/base

        let query = {};

        // Authorization/Scope Logic (Similar to getAssessments)
        if (req.user.role === 'SUPER_ADMIN') {
            query = {}; // All
        } else if (req.user.role === 'COORDINATOR') {
            // Assessments in their assigned countries
            // This requires looking up user's countries. 
            // For simplicity V1: strictly own assessments or all if we want collab
            // Let's stick to: created by user OR context matches user assignments
            // Simplify: User sees assessments they have access to.
            // For V1 Sync: Sync ONLY assessments loaded in the app (Client usually knows context)
            // SAFE FALLBACK: Only sync assessments where userId matches OR pure public ones
            query = { userId: userId };
        } else {
            query = { userId: userId };
        }

        if (lastSyncTimestamp) {
            query.updatedAt = { $gt: new Date(lastSyncTimestamp) };
        }

        const serverUpdates = await Assessment.find(query);

        // Filter out updates that correspond to checks we just applied (to avoid echo)
        // accessible via: ID is in 'applied' list
        const filteredUpdates = serverUpdates.filter(doc => !applied.includes(doc.id));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            applied,
            errors,
            serverUpdates: filteredUpdates
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ message: 'Sync failed', error: error.message });
    }
};
