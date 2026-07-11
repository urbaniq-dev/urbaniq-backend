const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Mocks to bypass auth
const mockAuth = (req, res, next) => {
  req.user = { id: '60d0fe4f5311236168a109ca', _id: '60d0fe4f5311236168a109ca', role: 'Agent' };
  next();
};

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected DB');

  const app = require('./dist/index').default; 
  // Wait, dist/index.ts has app.listen inside it, it might start the server automatically if required!
  // Let's just run the test directly using supertest or axios on the running server if it's already running.
}
test();
