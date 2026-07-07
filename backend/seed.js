require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');

const seed = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/training_center';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@skillbridge.com' });
    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('   Email:    admin@skillbridge.com');
      console.log('   Password: Admin@123');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: 'admin@skillbridge.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
    });
    await admin.save();

    const adminProfile = new Profile({
      userId: admin._id,
      firstName: 'Admin',
      lastName: 'SkillBridge',
      phone: '9999999999',
    });
    await adminProfile.save();

    admin.profile = adminProfile._id;
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Email:    admin@skillbridge.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     admin');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
