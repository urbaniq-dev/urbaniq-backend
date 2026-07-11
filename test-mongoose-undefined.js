require('dotenv').config();
const mongoose = require('mongoose');
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Schema = mongoose.Schema;
  const TestSchema = new Schema({ ownerId: { type: mongoose.Schema.Types.ObjectId, required: true } });
  const TestModel = mongoose.model('TestUndef', TestSchema);
  
  await TestModel.deleteMany({});
  await TestModel.create({ ownerId: new mongoose.Types.ObjectId() });
  
  const countAll = await TestModel.countDocuments({});
  console.log('Total documents:', countAll);
  
  const query = { ownerId: undefined };
  console.log('Query:', query);
  
  const result = await TestModel.find(query);
  console.log('Result length with undefined ownerId:', result.length);
  
  mongoose.disconnect();
}
run();
