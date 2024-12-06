require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { GridFSBucket } = require('mongodb');
const authMiddleware = require('./middleware/authMiddleware');


const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.set('strictPopulate', false);
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Configure multer for file uploads


// Image upload route


// // Image retrieval route
// app.get('/files/:filename', (req, res) => {
//   gfs.openDownloadStreamByName(req.params.filename)
//     .pipe(res)
//     .on('error', (err) => {
//       res.status(500).json({ error: err.message });
//     });
// });

// Routes
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
