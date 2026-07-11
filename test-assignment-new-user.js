require('dotenv').config();

async function run() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./dist/modules/user/user.model').default;
    
    // Create new owner
    const newOwner = await User.create({
      firstName: 'New', lastName: 'Owner', email: `new_owner_${Date.now()}@example.com`,
      role: 'Owner', isVerified: true, password: 'password123'
    });
    
    const jwt = require('jsonwebtoken');
    const ownerToken = jwt.sign({ id: newOwner._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('New Owner ID:', newOwner._id.toString());
    
    const res = await fetch(`http://localhost:5001/api/assignments`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const data = await res.json();
    console.log('Assignments for new owner length:', Array.isArray(data) ? data.length : data);

    const res2 = await fetch(`http://localhost:5001/api/properties?ownerId=${newOwner._id.toString()}`);
    const data2 = await res2.json();
    console.log('Properties for new owner length:', data2.data ? data2.data.length : data2);
    
    await User.findByIdAndDelete(newOwner._id);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
