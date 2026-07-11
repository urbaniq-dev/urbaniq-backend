require('dotenv').config();

async function run() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./dist/modules/user/user.model').default;
    
    // Find an Agent
    let agent = await User.findOne({ role: 'Agent' });
    if (!agent) {
      console.log('No agent found');
      return;
    }
    
    // Find a Buyer
    let buyer = await User.findOne({ role: 'Buyer' });
    if (!buyer) {
      console.log('No buyer found, creating one...');
      buyer = await User.create({
        firstName: 'Test', lastName: 'Buyer', email: 'buyer_test@example.com',
        role: 'Buyer', isVerified: true, savedProperties: []
      });
    }

    const jwt = require('jsonwebtoken');
    const buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('Agent ID:', agent._id.toString());
    const res = await fetch(`http://localhost:5001/api/properties?agentId=${agent._id.toString()}`);
    const resData = await res.json();
    console.log('Agent properties endpoint returned:', resData.data ? resData.data.length : resData);

    console.log('Buyer ID:', buyer._id.toString());
    const res2 = await fetch(`http://localhost:5001/api/users/favorites`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const res2Data = await res2.json();
    console.log('Buyer favorites endpoint returned:', Array.isArray(res2Data) ? res2Data.length : res2Data);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
