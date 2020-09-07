const express = require('express');
const morgan = require('morgan');
const colors = require('colors');
const config = require('config');

const app = express();

// DB File
const connectDB = require('./config/db');

connectDB();

// Use incoming requests
app.use(express.json({ extended: false }));

// Dev Logging Middleware
if (config.get('NODE_ENV') === 'development') app.use(morgan('dev'));

// Import Routes
const users = require('./routes/api/users');
const posts = require('./routes/api/posts');
const profile = require('./routes/api/profile');
const auth = require('./routes/api/auth');
const { raw } = require('express');

const PORT = process.env.PORT || 5000;

// Mount Route
app.use('/api/v1/users', users);
app.use('/api/v1/auth', auth);
app.use('/api/v1/posts', posts);
app.use('/api/v1/profile', profile);

const server = app.listen(PORT, () =>
  console.log(`Serevr started on Port ${PORT}`.yellow.bold)
);

// Handle Unhandled Rejection
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red.bold);
  // Close Server and Exit
  server.close(() => process.exit(1));
});
