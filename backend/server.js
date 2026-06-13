require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();

// Connect to MongoDB Database
connectDB();

// CORS configuration - allow Vite frontend local address
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes definition
app.use('/api/registrations', registrationRoutes);

// Default status root page
app.get('/', (req, res) => {
  res.send('The Shield Showdown MERN API server is running...');
});

// Multer Size Limit and Custom Error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File is too large. Maximum file size allowed is 5MB.' });
  }
  res.status(400).json({ message: err.message || 'An unexpected error occurred.' });
});

// Start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
