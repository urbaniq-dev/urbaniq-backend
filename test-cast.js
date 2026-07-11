const mongoose = require('mongoose');

async function run() {
  const schema = new mongoose.Schema({ agentId: mongoose.Schema.Types.ObjectId });
  const Model = mongoose.model('Test', schema);
  
  try {
    const q = Model.find({ agentId: "undefined" });
    console.log(q.getQuery());
    // Mongoose query casting is lazy, we can force it
    q.cast(Model);
    console.log(q.getQuery());
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
