const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ quiet: true });

// Import models
const Lost = require('./schema/db_lost');
const Found = require('./schema/db_found');
const User = require('./schema/db_user');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to Nova_Items database'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== ROUTES ====================

// 1) GET found items
app.get('/api/found-items', async (req, res) => {
  try {
    const foundItems = await Found.find().sort({ date: -1 });
    // Convert image buffer to base64 for frontend display
    const itemsWithBase64 = foundItems.map(item => {
      const itemObj = item.toObject();
      if (itemObj.image && itemObj.image.data) {
        itemObj.image.data = itemObj.image.data.toString('base64');
      }
      return itemObj;
    });
    res.json(itemsWithBase64);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ message: 'Error fetching found items', error: error.message });
  }
});

// 2) GET lost items
app.get('/api/lost-items', async (req, res) => {
  try {
    const lostItems = await Lost.find().sort({ date: -1 });
    // Convert image buffer to base64 for frontend display
    const itemsWithBase64 = lostItems.map(item => {
      const itemObj = item.toObject();
      if (itemObj.image && itemObj.image.data) {
        itemObj.image.data = itemObj.image.data.toString('base64');
      }
      return itemObj;
    });
    res.json(itemsWithBase64);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).json({ message: 'Error fetching lost items', error: error.message });
  }
});

// 3) POST lost items
app.post('/api/lost-items', upload.single('image'), async (req, res) => {
  try {
    const { itemName, category, description, location, lostDate } = req.body;

    const newLostItem = new Lost({
      name: itemName,
      category: category,
      description: description,
      location: location,
      date: lostDate ? new Date(lostDate) : Date.now(),
      image: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : undefined
    });

    await newLostItem.save();
    res.status(201).json({ message: 'Lost item reported successfully', item: newLostItem });
  } catch (error) {
    console.error('Error saving lost item:', error);
    res.status(500).json({ message: 'Error saving lost item', error: error.message });
  }
});

// 4) POST found items
app.post('/api/found-items', upload.single('image'), async (req, res) => {
  try {
    const { itemName, category, description, location, foundDate } = req.body;

    const newFoundItem = new Found({
      name: itemName,
      category: category,
      description: description,
      location: location,
      date: foundDate ? new Date(foundDate) : Date.now(),
      image: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : undefined
    });

    await newFoundItem.save();
    res.status(201).json({ message: 'Found item reported successfully', item: newFoundItem });
  } catch (error) {
    console.error('Error saving found item:', error);
    res.status(500).json({ message: 'Error saving found item', error: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// 5) POST - User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Validation
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check username length
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be between 3 and 30 characters' 
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const newUser = new User({
      username: username.toLowerCase(),
      password: password
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! You can now login.',
      user: { username: newUser.username }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.',
      error: error.message 
    });
  }
});

// 6) POST - User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Compare password using the model method
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Login successful
    res.status(200).json({ 
      success: true, 
      message: 'Login successful!',
      user: { 
        username: user.username,
        id: user._id 
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.',
      error: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
