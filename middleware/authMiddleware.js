const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Retrieve token from Authorization header with Bearer scheme
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ msg: 'No token, authorization denied' });

    const token = authHeader.split(' ')[1]; // Extract the token from Bearer scheme
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified.id; // Attach the user ID to the request object
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = authMiddleware;
