import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, Hash, BarChart, TrendingUp, Loader2 } from 'lucide-react'; // ⬅️ Loader2 icon for spinner
import { baseURL } from '../utils/constants';

const Signup = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    setLoading(true); // ⬅️ Start loading

    const formData = new FormData();
    formData.append('name', name);
    formData.append('username', email);
    formData.append('password', password);
    formData.append('phone', "0000000000");
    formData.append('location', "Not specified");
    formData.append('about', "A new Kabaddi enthusiast!");
    formData.append('age', parseInt(age, 10) || 0);
    formData.append('height', parseFloat(height) || 0);
    formData.append('weight', parseFloat(weight) || 0);

    try {
      await axios.post(baseURL + '/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Account created successfully! Redirecting to login...');
      navigate('/login');
    } catch (error) {
      console.error('Signup failed:', error);
      alert(`Signup failed: ${error.response ? error.response.data.message : error.message}`);
    } finally {
      setLoading(false); // ⬅️ Stop loading regardless of success/failure
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-gray-400 mt-2">Join the league and start your journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-300 font-medium mb-2" htmlFor="name">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-gray-300 font-medium mb-2" htmlFor="email">Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="text"
                placeholder="you1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Age/Height/Weight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2" htmlFor="age">Age</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="age" type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white" required />
              </div>
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-2" htmlFor="height">Height (cm)</label>
              <div className="relative">
                <BarChart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="height" type="number" placeholder="180" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-2" htmlFor="weight">Weight (kg)</label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="weight" type="number" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-300 font-medium mb-2" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-300 font-medium mb-2" htmlFor="confirm-password">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 ${
              loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
            } text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform ${
              loading ? '' : 'hover:scale-105 hover:shadow-lg'
            } focus:outline-none focus:ring-4 focus:ring-orange-500/50`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <a href="/login" className="font-medium text-sm text-gray-400 hover:text-orange-400 transition-colors">
              Already have an account? Sign In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
