const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/desserts', async (req, res) => {
  const { location, term } = req.query;

  try {
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        term: term || 'desserts',
        location: location || 'Fullerton, CA',
        limit: 10
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Yelp API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Yelp' });
  }
});

module.exports = router;
