const axios = require('axios');
(async () => {
  try {
    const api = axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { Authorization: 'Bearer fake_token' }
    });
    
    await Promise.all([
      api.get(`/properties?ownerId=123`),
      api.get('/interactions/inquiries'),
      api.get('/interactions/visits'),
      api.get('/interactions/offers')
    ]);
    console.log('Success');
  } catch (err) {
    console.error(err.message, err.response ? err.response.status : '');
  }
})();
