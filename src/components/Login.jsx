import React, { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react'; // Import Loader2 for the spinner icon
import { baseURL } from '../utils/constants';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // New loading state
  const cookies = new Cookies();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when the form is submitted

    try {
      const response = await axios.post(baseURL + '/auth/login', {
        username: email, // Changed from email to username as per your API structure
        password,
      });

      localStorage.setItem('user', response.data.user);
      alert('Login successful!');
      cookies.set('token', response.data.token);
      console.log('Server response:', response.data);
      navigate("/");

    } catch (error) {
      alert('Login failed. Please check your credentials.');
      console.error('Login error:', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false); // Set loading back to false when the request is complete (success or error)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Admin Access
          </h1>
          <p className="text-gray-400 mt-2">Sign in to manage your matches</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="text"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300"
                required
                disabled={loading} // Disable input while loading
              />
            </div>
          </div>
          {/* Password Input */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password" // Changed to type="password" for security
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300"
                required
                disabled={loading} // Disable input while loading
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded bg-white/10 border-white/20 text-orange-500 focus:ring-orange-500 cursor-pointer"
                disabled={loading} // Disable checkbox while loading
              />
              <label htmlFor="remember" className="text-gray-400 cursor-pointer">Remember me</label>
            </div>
            <a
              href="#"
              className={`font-medium text-orange-400 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-orange-500'}`}
              onClick={(e) => loading && e.preventDefault()} // Prevent click if loading
            >
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300
                        ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-orange-600 hover:to-red-700 transform hover:scale-105 hover:shadow-lg'}
                        focus:outline-none focus:ring-4 focus:ring-orange-500/50 flex items-center justify-center`}
            disabled={loading} // Disable button while loading
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 w-5 h-5" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;