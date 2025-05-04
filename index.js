const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken'); // for later if needed

const app = express();
app.use(cors());
app.use(express.json()); // to parse JSON bodies

const PORT = process.env.PORT || 3000;

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ROUTES
app.get('/', (req, res) => {
  res.send('Marketplace API is live!');
});

// 👇 NEW: Create user route
app.post('/users', async (req, res) => {
  const { username, rut, is_seller } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
let user_id;
 try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user_id = decoded.sub;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  // Validate RUT
  if (!validateRut(rut)) {
    return res.status(400).json({ error: 'Invalid RUT' });
  }

  const { data, error } = await supabase.from('users').insert([
    {
      user_id,
      username,
      rut,
      is_seller
    }
  ]);

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json(data);
});

// RUT validator
function validateRut(rut) {
  rut = rut.replace(/\./g, '').replace('-', '');
  const body = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();

  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const expected = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return dv === expected;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));