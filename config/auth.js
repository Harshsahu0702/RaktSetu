// Authentication middleware to check if user is logged in
exports.ensureAuthenticated = (req, res, next) => {
    // Check if user is authenticated (you can modify this based on your auth system)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    // If not authenticated, redirect to login or send error
    res.redirect('/'); // or res.status(401).send('Not authenticated');
};

// Optional: Role-based access control middleware
exports.ensureRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send('Not authenticated');
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).send('Not authorized');
        }
        next();
    };
};
