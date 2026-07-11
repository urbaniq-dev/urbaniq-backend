const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/urbaniq');
const Inquiry = require('./src/modules/interaction/inquiry.model').default;
require('./src/modules/property/property.model');
require('./src/modules/user/user.model');

async function run() {
  const inquiries = await Inquiry.find().populate({
    path: 'propertyId',
    populate: [
      { path: 'agentId', select: 'firstName lastName profileImage role' },
      { path: 'ownerId', select: 'firstName lastName profileImage role' }
    ]
  });
  console.log(JSON.stringify(inquiries[0].propertyId, null, 2));
  process.exit(0);
}
run();
