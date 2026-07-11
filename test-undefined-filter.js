require('dotenv').config();

async function run() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI);
    const Assignment = require('./dist/modules/property/assignment.model').default;
    
    const countAll = await Assignment.countDocuments({});
    console.log('Total assignments:', countAll);
    
    const query = { ownerId: undefined };
    console.log('Query:', query);
    
    // Test what Mongoose does with { ownerId: undefined }
    const result = await Assignment.find(query);
    console.log('Result length with undefined ownerId:', result.length);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
