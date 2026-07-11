const mongoose = require('mongoose');
require('dotenv').config();

const Property = require('./dist/modules/property/property.model').default;
const User = require('./dist/modules/user/user.model').default;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Test 1: Fetch properties with a fake agentId
  const fakeAgentId = new mongoose.Types.ObjectId().toString();
  console.log('Testing with agentId:', fakeAgentId);
  
  const properties = await Property.find({ agentId: fakeAgentId });
  console.log(`Properties found for fake agentId: ${properties.length}`);

  // Test 2: Check validate middleware logic manually
  const Joi = require('joi');
  const schema = Joi.object({
    agentId: Joi.string().hex().length(24),
    status: Joi.string().valid('Draft', 'Published')
  });

  const query = { agentId: fakeAgentId };
  const { error, value } = schema.validate(query, { abortEarly: false });
  console.log('Joi Validation Error:', error ? error.message : 'None');
  console.log('Joi Validated Value:', value);

  mongoose.disconnect();
}

run().catch(console.error);
