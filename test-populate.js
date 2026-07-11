const mongoose = require('mongoose');

async function run() {
  const PropSchema = new mongoose.Schema({ title: String });
  const Property = mongoose.model('Prop', PropSchema);
  
  const UserSchema = new mongoose.Schema({ saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prop' }] });
  const User = mongoose.model('Usr', UserSchema);
  
  await mongoose.connect(process.env.MONGO_URI);
  
  await Property.deleteMany({});
  await User.deleteMany({});
  
  await Property.create({ title: 'A' });
  await Property.create({ title: 'B' });
  
  // Create user with null/undefined in array
  const u = await User.create({ saved: [null] });
  
  const uPop = await User.findById(u._id).populate('saved');
  console.log('Populated saved count with null:', uPop.saved.length);
  console.log('Saved items:', uPop.saved);
  
  mongoose.disconnect();
}
run().catch(console.error);
