require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const Setting = require('./models/Setting');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Uploading shield logo to Cloudinary...');
    const result = await cloudinary.uploader.upload('../frontend/public/logo.png', {
      folder: 'shield_showdown_proofs'
    });
    const logoUrl = result.secure_url;
    console.log('Uploaded successfully. URL:', logoUrl);

    console.log('Generating 10 instances...');
    const value = [];
    for (let i = 0; i < 10; i++) {
      value.push({
        id: `shield-${i}-${Date.now()}`,
        logoUrl: logoUrl
      });
    }

    console.log('Updating setting key "invited_teams" in MongoDB...');
    await Setting.findOneAndUpdate(
      { key: 'invited_teams' },
      { value },
      { new: true, upsert: true }
    );
    console.log('Setting updated successfully with 10 instances of the logo!');

    await mongoose.connection.close();
    console.log('Done.');
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

run();
