const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

// Import models
const Lost = require('./schema/db_lost');
const Found = require('./schema/db_found');

const app = express();
const PORT = 5000;

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
mongoose.connect('mongodb://localhost:27017/Nova_Items')
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
