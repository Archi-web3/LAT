const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'in-v3.mailjet.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email notification for a new action assignment
 * @param {string} toEmail - Recipient email
 * @param {object} action - Action item details
 * @param {string} assignerName - Name of the person who assigned the action
 */
exports.sendActionAssignment = async (toEmail, action, assignerName) => {
    if (!toEmail) return;

    const mailOptions = {
        from: '"Logistics Assessment Tool" <no-reply@elat.org>', // Sender address
        to: toEmail,
        subject: `[LAT] Action Assigned: ${(action.questionText || 'New Action').substring(0, 50)}...`,
        html: `
            <h3>New Action Assigned</h3>
            <p><strong>${assignerName || 'A coordinator'}</strong> has assigned you a new action item.</p>
            
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <p><strong>Task:</strong> ${action.questionText}</p>
                <p><strong>Note:</strong> ${action.comments || 'No specific notes'}</p>
                <p><strong>Priority:</strong> ${action.priority}</p>
                <p><strong>Due Date:</strong> ${new Date(action.dueDate).toLocaleDateString()}</p>
            </div>

            <p>Please log in to the LAT platform to view and update this action.</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('[EMAIL] Error sending email:', error);
        // Don't throw, just log. Email failure shouldn't block sync.
    }
};
