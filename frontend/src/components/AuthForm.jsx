import { useState } from 'react';
import axios from 'axios';

export default function AuthForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const url = `${process.env.REACT_APP_API_BASE_URL}/api/auth/${isRegister ? 'register' : 'login'}`;
    try {
      const res = await axios.post(url, { email, password });
      if (!isRegister) onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-500">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button onClick={() => setIsRegister(!isRegister)} className="text-blue-500 underline">
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}
