const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes'); // added
const resultRoutes = require('./routes/resultRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'PADIKKUVEEN API is running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/categories', categoryRoutes); // mounting category routes
app.use('/api', questionRoutes); // mounting question routes
app.use('/api/results', resultRoutes); // mounting result routes
app.use('/api/notifications', notificationRoutes); // mounting notification routes
app.use('/api/admin', adminRoutes); // mounting admin routes

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
