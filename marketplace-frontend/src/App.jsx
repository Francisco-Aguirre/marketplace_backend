import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [title, setTitle] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [status, setStatus] = useState('');

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus('Login failed: ' + error.message);
      return;
    }
    setStatus('Login successful!');
    setToken(data.session.access_token);
  };

  const signup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setStatus('Signup failed: ' + error.message);
      return;
    }
    setStatus('Signup successful! Please confirm your email before logging in.');
  };

  const postProduct = async () => {
    const res = await fetch('https://marketplace-api-t9od.onrender.com/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        price_min: parseInt(priceMin),
        category_id: 10000,
        subcategory_id: 10001,
        item_id: '10001-ABC',
        size_id: 1,
        gender: 'M',
        condition: 'Usado - Como Nuevo',
        color_id: 1,
      }),
    });

    const data = await res.json();
    console.log('Product response:', data);
    alert(data.error || 'Product posted!');
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Login / Signup</h2>
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', marginBottom: 10 }}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
        <button onClick={login}>Login</button>
        <button onClick={signup}>Sign Up</button>
      </div>

      {status && <p>{status}</p>}

      {token && (
        <>
          <h2>Post Product</h2>
          <input
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: 'block', marginBottom: 10 }}
          />
          <input
            placeholder="Price Min"
            onChange={(e) => setPriceMin(e.target.value)}
            style={{ display: 'block', marginBottom: 10 }}
          />
          <button onClick={postProduct}>Submit Product</button>
        </>
      )}
    </div>
  );
}

export default App;
