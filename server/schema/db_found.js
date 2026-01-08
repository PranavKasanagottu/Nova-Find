const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Nova_Items')
  .then(() => console.log('Connected to Nova_Items database'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the Found Item Schema
const foundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'documents', 'accessories', 'books', 'others']
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  image: {
    data: Buffer,
    contentType: String
  }
});

// Create the model with collection name 'lost'
const Found = mongoose.model('Found', foundSchema, 'found');

module.exports = Found;