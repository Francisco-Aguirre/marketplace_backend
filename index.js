const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Health check route
app.get('/', (req, res) => {
  res.send('Marketplace API is live!');
});

// ✅ POST /users route
app.post('/users', async (req, res) => {
  const { username, rut, is_seller } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const rawToken = authHeader.split(' ')[1];
  console.log('Incoming JWT token:', rawToken);

  let decoded;
  try {
    decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user_id = decoded.sub;
  if (!user_id) {
    console.error('Token decoded, but sub is missing');
    return res.status(401).json({ error: 'Invalid token: missing sub' });
  }

  if (!validateRut(rut)) {
    return res.status(400).json({ error: 'Invalid RUT' });
  }

  const { data, error } = await supabase.from('users').insert([
    {
      user_id,
      user_name: username, // Match your Supabase column name
      rut,
      is_seller
    }
  ]);

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

// ✅ Chilean RUT validation function
function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  rut = rut.replace(/\./g, '').replace('-', '');
  const body = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const expected = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return dv === expected;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
