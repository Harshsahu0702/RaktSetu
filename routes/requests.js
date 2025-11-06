const express = require('express');
const router = express.Router();

// Requests Page - No authentication for now
router.get('/requests', (req, res) => {
    try {
        // For testing, just render the page with sample data
        const sampleUser = {
            fullName: 'Test User',
            email: 'test@example.com',
            bloodGroup: 'O+',
            city: 'Sample City',
            contactInfo: '1234567890'
        };

        res.render('requests', {
            user: sampleUser,
            title: 'My Blood Requests - RaktSetu',
            active: 'requests'
        });
    } catch (error) {
        console.error('Error rendering requests page:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
