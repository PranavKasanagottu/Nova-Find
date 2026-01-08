const mongoose = require('mongoose');

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

// Create the model with collection name 'found'
const Found = mongoose.model('Found', foundSchema, 'found');

module.exports = Found;