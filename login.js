import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vaxusxabmdygkbliimfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheHVzeGFibWR5Z2tibGlpbWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MDIxODQsImV4cCI6MjA2MDE3ODE4NH0.NCUjQTzg8Wh0GS2395nLOeJUc7JBEPno8OniQCwjMpQ'
);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'f.aguirreillanes@gmail.com',
    password: '261090'
  });

  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('JWT:', data.session.access_token);
  }
}

login();