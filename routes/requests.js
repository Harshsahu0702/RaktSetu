const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Sample data for demonstration
const sampleUser = {
    _id: 'user123',
    fullName: 'Test User',
    email: 'test@example.com',
    bloodGroup: 'O+',
    city: 'Sample City',
    contactInfo: '1234567890'
};

// Sample requests data
const sampleRequests = [
    {
        _id: 'req1',
        patientId: 'user123',
        patientName: 'Test User',
        bloodGroup: 'O+',
        units: 2,
        status: 'pending',
        datetime: new Date('2023-06-15T10:30:00'),
        hospitalName: 'City General Hospital',
        donorId: 'donor456',
        donorName: 'John Doe',
        donorContact: '+1 234 567 8900'
    },
    {
        _id: 'req2',
        patientId: 'user123',
        patientName: 'Test User',
        bloodGroup: 'O+',
        units: 1,
        status: 'completed',
        datetime: new Date('2023-05-20T14:45:00'),
        hospitalName: 'Metro Medical Center',
        donorId: 'donor789',
        donorName: 'Jane Smith',
        donorContact: '+1 234 567 8901'
    },
    {
        _id: 'req3',
        patientId: 'user123',
        patientName: 'Test User',
        bloodGroup: 'O+',
        units: 1,
        status: 'rejected',
        datetime: new Date('2023-04-10T09:15:00'),
        hospitalName: 'Sunrise Hospital',
        reason: 'No matching donor available'
    },
    {
        _id: 'req4',
        patientId: 'user123',
        patientName: 'Test User',
        bloodGroup: 'O+',
        units: 2,
        status: 'in-progress',
        datetime: new Date('2023-06-18T16:20:00'),
        hospitalName: 'City General Hospital',
        donorId: 'donor123',
        donorName: 'Robert Johnson',
        donorContact: '+1 234 567 8902'
    }
];

// Get all requests for the current user
router.get('/requests', (req, res) => {
    try {
        // In a real app, you would fetch requests for the logged-in user
        const userRequests = sampleRequests.filter(req => req.patientId === sampleUser._id);
        
        // Calculate request statistics
        const stats = {
            total: userRequests.length,
            pending: userRequests.filter(req => req.status === 'pending').length,
            completed: userRequests.filter(req => req.status === 'completed').length,
            inProgress: userRequests.filter(req => req.status === 'in-progress').length
        };

        res.render('requests', {
            user: sampleUser,
            requests: userRequests,
            stats: stats,
            title: 'My Blood Requests - RaktSetu',
            active: 'requests'
        });
    } catch (error) {
        console.error('Error rendering requests page:', error);
        res.status(500).send('Server error');
    }
});

// Get request details
router.get('/api/requests/:id', (req, res) => {
    try {
        const request = sampleRequests.find(req => req._id === req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        res.json({ success: true, data: request });
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Cancel a request
router.post('/api/requests/:id/cancel', (req, res) => {
    try {
        const requestIndex = sampleRequests.findIndex(req => req._id === req.params.id);
        if (requestIndex === -1) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        // In a real app, you would update the status in the database
        sampleRequests[requestIndex].status = 'cancelled';
        sampleRequests[requestIndex].cancelledAt = new Date();
        
        res.json({ 
            success: true, 
            message: 'Request cancelled successfully',
            data: sampleRequests[requestIndex]
        });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel request' });
    }
});

module.exports = router;
