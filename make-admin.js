require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./dist/modules/user/user.model').default;
    
    // Find the user and make them an Admin
    const emailToMakeAdmin = 'rihenrw@gmail.com'; 
    const user = await User.findOneAndUpdate(
      { email: emailToMakeAdmin }, 
      { role: 'Admin' }, 
      { new: true }
    );
    
    if (user) {
      console.log(`Successfully made ${user.email} an Admin!`);
    } else {
      console.log(`Could not find user with email ${emailToMakeAdmin}`);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
