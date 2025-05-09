const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Health routes
app.get('/health', (req, res) => res.send('API is running'));
app.get('/', (req, res) => res.send('Marketplace API is live!'));

// 🔐 Middleware: Validate token and user
const ensureUserExists = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Decoded token:", decoded);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 👇 Adjust this if your ID is stored elsewhere in the token
  const user_id = decoded.sub;

  if (!user_id) return res.status(401).json({ error: 'Invalid token: missing user_id' });

  req.user = { id: user_id };

  const { data: existingUser, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Error checking user in DB' });
  }

  if (!existingUser) {
    return res.status(403).json({ error: 'User not registered. Please register via /users' });
  }

  next();
};

// 🧾 Create a user
app.post('/users', async (req, res) => {
  const { username, rut, last_name, name, phone } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Decoded token for /users:", decoded);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user_id = decoded.sub;
  if (!user_id) return res.status(401).json({ error: 'Invalid token: missing user_id' });

  if (!validateRut(rut)) {
    return res.status(400).json({ error: 'Invalid RUT' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        user_id,
        user_name: username,
        rut,
        name,
        last_name,
        phone
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});


app.get('/users/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user_id = decoded.sub;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });

  res.status(200).json(data);
});


// 👕 Post a product
app.post('/products', ensureUserExists, async (req, res) => {
  const {
    title,
    description,
    brand_id,
    category_id,
    subcategory_id,
    item_id,
    size_id,
    gender,
    condition,
    price_min,
    color_id
  } = req.body;

  const seller_id = req.user.id;

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        seller_id,
        title,
        description,
        brand_id,
        category_id,
        subcategory_id,
        item_id,
        size_id,
        gender,
        condition,
        price_min,
        price_current: price_min,
        color_id
      }
    ])
    .select();

  if (error) {
    console.error('Product insert error:', error);
    return res.status(400).json({ error: error.message });
  }

  await supabase
    .from('users')
    .update({ is_seller: true })
    .eq('user_id', seller_id);

  res.status(201).json(data);
});

// 🇨🇱 Chilean RUT validation
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

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});