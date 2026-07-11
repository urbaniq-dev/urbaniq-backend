const axios = require('axios'); // Wait, axios is not installed. I will use fetch.
require('dotenv').config();

async function run() {
  try {
    const fakeOwnerId = "609c12345678901234567890";
    console.log('Fetching properties for fake owner:', fakeOwnerId);
    const res = await fetch(`http://localhost:5001/api/properties?ownerId=${fakeOwnerId}`);
    const data = await res.json();
    console.log('Returned properties length:', data.data ? data.data.length : data);
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
