const express = require('express');
const router = express.Router();
const axios = require('axios');

const GESTIONAR_API_URL = 'https://api.gestionarlogistica.com';
const API_KEY = process.env.GESTIONAR_API_KEY;

// Middleware para agregar API key
router.use((req, res, next) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  req.headers['secret-token-key'] = API_KEY;
  next();
});

// GET /api/gestionar/sales/:platform_id
router.get('/sales/:platform_id', async (req, res) => {
  try {
    const { platform_id } = req.params;
    const { data } = await axios.get(
      `${GESTIONAR_API_URL}/api/external-client/sales/${platform_id}`,
      {
        params: req.query,
        headers: {
          'secret-token-key': API_KEY,
        },
      }
    );
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// GET /api/gestionar/packages
router.get('/packages', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${GESTIONAR_API_URL}/api/external-client/packages`,
      {
        params: req.query,
        headers: {
          'secret-token-key': API_KEY,
        },
      }
    );
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// GET /api/gestionar/pickup-times
router.get('/pickup-times', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${GESTIONAR_API_URL}/api/external-client/pickup-times`,
      {
        headers: {
          'secret-token-key': API_KEY,
        },
      }
    );
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// POST /api/gestionar/pickup
router.post('/pickup', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${GESTIONAR_API_URL}/api/external-client/pickup`,
      req.body,
      {
        headers: {
          'secret-token-key': API_KEY,
        },
      }
    );
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;