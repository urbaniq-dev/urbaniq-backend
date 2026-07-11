require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./dist/modules/user/user.model').default;
    
    const adminEmail = 'admin@urbaniq.com';
    const existing = await User.findOne({ email: adminEmail });
    
    if (!existing) {
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'Admin',
        isVerified: true
      });
      console.log(`Created admin account: ${adminEmail}`);
    } else {
      existing.role = 'Admin';
      existing.password = 'admin123';
      await existing.save();
      console.log(`Updated admin account: ${adminEmail}`);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
