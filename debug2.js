const mongoose = require('mongoose');
require('dotenv').config();

const propertyService = require('./dist/modules/property/property.service');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected DB');

  const result = await propertyService.queryProperties({ agentId: "6a4cc6bfe3ffa72e4c228225" }, { limit: 10 });
  console.log('Query result count:', result.properties.length);
  
  const resultAll = await propertyService.queryProperties({}, { limit: 10 });
  console.log('Query all result count:', resultAll.properties.length);

  mongoose.disconnect();
}
run().catch(console.error);
