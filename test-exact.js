const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./dist/modules/user/user.model').default;
const Property = require('./dist/modules/property/property.model').default;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Let's create a dummy user
  const u = await User.create({
    firstName: 'Test', lastName: 'User', email: 'test@example.com',
    role: 'Buyer', isVerified: true, savedProperties: []
  });

  const uPop = await User.findById(u._id).populate('savedProperties');
  console.log('Saved properties for new user:', uPop.savedProperties.length);

  // Let's check Agent properties
  const agent = await User.create({
    firstName: 'Agent', lastName: 'User', email: 'agent@example.com',
    role: 'Agent', isVerified: true
  });
  const propertyService = require('./dist/modules/property/property.service');
  const result = await propertyService.queryProperties({ agentId: agent._id.toString() }, {});
  console.log('Properties for new agent:', result.properties.length);

  await User.deleteMany({ email: { $in: ['test@example.com', 'agent@example.com'] } });
  
  mongoose.disconnect();
}
run().catch(console.error);
