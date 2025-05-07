import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  const [rut, setRut] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);

  const [title, setTitle] = useState('');
  const [priceMin, setPriceMin] = useState('');

  // ✅ Sign up
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

  // ✅ Log in
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

  // ✅ Register user profile (call /users)
  const registerUser = async () => {
    const res = await fetch('https://marketplace-api-t9od.onrender.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rut,
        username,
        name,
        last_name: lastName,
        phone,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert('User registered!');
      setProfileComplete(true);
    } else {
      alert('Registration failed: ' + data.error);
    }
  };

  // ✅ Submit product (call /products)
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

      {token && !profileComplete && (
        <>
          <h2>Complete Your Profile</h2>
          <input placeholder="RUT" onChange={(e) => setRut(e.target.value)} />
          <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="First Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} />
          <input placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />
          <button onClick={registerUser}>Submit Profile</button>
        </>
      )}

      {token && profileComplete && (
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
