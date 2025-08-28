import { useState } from 'react';
import { LogOut } from 'lucide-react';
import PdfManager from './components/Updated PdfManager'; 
import AuthForm from './components/AuthForm.jsx'; 

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="container max-w-[900px] mx-auto mt-10 p-6 font-sans rounded-xl shadow-lg 
                bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-blue-900">
        <img 
          src="/favicon-32x32.png" 
          alt="AI DocuMate Logo" 
          className="w-8 h-8"
        />
        AI DocuMate
      </h1>

      {token ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
          <PdfManager token={token} />
        </>
      ) : (
        <AuthForm onLogin={handleLogin} />
      )}
    </div>
  );
}
