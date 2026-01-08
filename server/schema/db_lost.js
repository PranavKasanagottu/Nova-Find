const mongoose = require('mongoose');

// Define the Lost Item Schema
const lostSchema = new mongoose.Schema({
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
const Lost = mongoose.model('Lost', lostSchema, 'lost');

module.exports = Lost;
