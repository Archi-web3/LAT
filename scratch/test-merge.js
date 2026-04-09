/**
 * Test script for Granular Merging Logic
 * This script simulates the backend merging logic to verify it handles conflicts correctly.
 */

// --- MOCK LOGIC (Extracted from assessmentController.js) ---
function mergeMaps(existingMap, incomingMap, clientTime, serverTime) {
    if (!incomingMap) return;
    Object.keys(incomingMap).forEach(key => {
        // Rule: If key exists in both, newer document wins
        if (clientTime >= serverTime || !existingMap.has(key)) {
            existingMap.set(key, incomingMap[key]);
        }
    });
}

function mergeActionPlan(existingActionPlan, incomingActionPlan, clientTime, serverTime) {
    if (!Array.isArray(incomingActionPlan)) return;
    incomingActionPlan.forEach(incomingAction => {
        const idx = existingActionPlan.findIndex(a => a.id === incomingAction.id);
        if (idx > -1) {
            if (clientTime >= serverTime) {
                existingActionPlan[idx] = { ...existingActionPlan[idx], ...incomingAction };
            }
        } else {
            existingActionPlan.push(incomingAction);
        }
    });
}

// --- TEST SCENARIO ---

// 1. Initial State on Server
let serverDoc = {
    updatedAt: new Date('2026-04-09T10:00:00Z'),
    answers: new Map([['q1', 1], ['q2', 2]]),
    comments: new Map([['q1', 'Original comment']]),
    actionPlan: [{ id: 'act-1', description: 'Original task', status: 'OPEN' }],
    history: [{ date: '2026-04-09T10:00:00Z', action: 'CREATED' }]
};

// 2. Client A Syncs (Edits Q1 and adds Q3) - Sent at 10:05
let clientA = {
    updatedAt: new Date('2026-04-09T10:05:00Z'),
    answers: { q1: 10, q3: 3 }, // Changed q1, added q3
    comments: { q1: 'Client A comment' }
};

// 3. Client B Syncs (Edits Q2) - Sent at 10:10 (but B didn't see A's changes yet)
let clientB = {
    updatedAt: new Date('2026-04-09T10:10:00Z'),
    answers: { q2: 20 }, // Changed q2
    actionPlan: [{ id: 'act-2', description: 'New Task by B' }]
};

console.log('--- STARTING MERGE TEST ---');

// SIMULATE SYNC A
console.log('Syncing Client A...');
let serverTime = serverDoc.updatedAt.getTime();
let clientATime = clientA.updatedAt.getTime();
mergeMaps(serverDoc.answers, clientA.answers, clientATime, serverTime);
mergeMaps(serverDoc.comments, clientA.comments, clientATime, serverTime);
serverDoc.updatedAt = new Date(Math.max(serverTime, clientATime));
console.log('After A -> Answers:', Array.from(serverDoc.answers.entries()));

// SIMULATE SYNC B
console.log('Syncing Client B...');
serverTime = serverDoc.updatedAt.getTime();
let clientBTime = clientB.updatedAt.getTime();
mergeMaps(serverDoc.answers, clientB.answers, clientBTime, serverTime);
mergeActionPlan(serverDoc.actionPlan, clientB.actionPlan, clientBTime, serverTime);
serverDoc.updatedAt = new Date(Math.max(serverTime, clientBTime));
console.log('After B -> Answers:', Array.from(serverDoc.answers.entries()));
console.log('After B -> Action Plan:', serverDoc.actionPlan);

// --- VERIFICATION ---
console.log('\n--- FINAL VERIFICATION ---');
const answersOk = serverDoc.answers.get('q1') === 10 && serverDoc.answers.get('q2') === 20 && serverDoc.answers.get('q3') === 3;
const actionOk = serverDoc.actionPlan.length === 2;

console.log('Q1=10, Q2=20, Q3=3 :', answersOk ? '✅' : '❌');
console.log('Action plan has 2 items :', actionOk ? '✅' : '❌');

if (answersOk && actionOk) {
    console.log('\n🔥 SUCCESS: Granular merging logic works as expected!');
} else {
    console.log('\n🚨 FAILURE: Merging logic failed.');
    process.exit(1);
}
