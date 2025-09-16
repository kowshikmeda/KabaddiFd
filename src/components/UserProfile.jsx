import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Calendar, Camera, Edit2, Save, X, Lock, PersonStanding, Weight, GitCommitVertical, Loader2 } from 'lucide-react';
import { baseURL } from '../utils/constants';
import Cookies from 'universal-cookie';
import BackButton from './BackButton';

const UserProfile = () => {
 
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('user');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(baseURL + `/users/userdetails/${userId}`, {
         withCredentials: true,
        });
        const data = response.data.data;
        
        // --- FIX 1: Ensure all form fields are initialized with a non-undefined value ---
        // Use `|| ''` to provide an empty string fallback for any optional fields.
        const formattedData = {
          name: data.name || '',
          username: data.email || '',
          password: '',
          phone: data.phone || '',
          location: data.location || '',
          joinDate: data.createdAt,
          bio: data.about || '',
          avatar: data.photo || null, // Avatar can be null if none exists
          height: data.height || '',
          weight: data.weight || '',
          age: data.age || '',
        };

        setProfileData(formattedData);
        setTempData(formattedData);
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
        fetchUserData();
    } else {
        setError("No user ID found.");
        setLoading(false);
    }
  }, [userId]);

  const handleEdit = () => {
    setTempData({ ...profileData, password: '' });
    setAvatarPreview(null);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const updatePayload = new FormData();

    // Append all fields from the tempData state
    updatePayload.append('name', tempData.name);
    updatePayload.append('phone', tempData.phone);
    updatePayload.append('location', tempData.location);
    updatePayload.append('about', tempData.bio);
    updatePayload.append('height', tempData.height);
    updatePayload.append('weight', tempData.weight);
    updatePayload.append('age', tempData.age);

    if (tempData.password) {
      updatePayload.append("password", tempData.password);
    }

    if (tempData.avatar instanceof File) {
      // The key should match what your backend expects (e.g., 'photo', 'image', 'avatar')
      updatePayload.append('photo', tempData.avatar);
    }

    try {
      // --- FIX 2: Use `withCredentials: true` for the PUT request to match the GET request ---
      // Remove the explicit 'Authorization' header, as the cookie is sent automatically.
      const response = await axios.put(baseURL + `/users/user/update/${userId}`, updatePayload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      const updatedData = response.data.data;

      // Create a fresh profile data object from the response to ensure UI is in sync
      const newProfileData = {
          ...tempData,
          avatar: updatedData.photo || avatarPreview, // Prefer the URL from backend response
          password: '' // Always clear password field after save
      };

      setProfileData(newProfileData);
      setIsEditing(false);
      alert('Profile updated successfully!');

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      console.error(err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempData({ ...profileData, password: '' });
    setAvatarPreview(null);
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setTempData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setTempData(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading && !profileData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-xl">
      <Loader2 className="animate-spin h-10 w-10 mb-4 text-orange-500" />
      <span className='text-3xl'>Loading Profile...</span>
    </div>
  );

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">{error}</div>;
  if (!profileData) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">User not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <BackButton/>
      <div className="max-w-6xl mx-auto mt-5">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden mt-3">

          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 relative ">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full ring-4 ring-white/20 overflow-hidden shadow-2xl">
                  <img src={avatarPreview || profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                {isEditing && (
                  <>
                    <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-all duration-300 cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
              </div>
              <div className="text-center sm:text-left text-white flex-grow">
                <h1 className="text-4xl font-bold mb-2">{isEditing ? tempData.name : profileData.name}</h1>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm mt-4">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><MapPin className="w-4 h-4 text-orange-400" /><span className="text-gray-300">{isEditing ? tempData.location : profileData.location}</span></div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><Calendar className="w-4 h-4 text-orange-400" /><span className="text-gray-300">Joined {formatDate(profileData.joinDate)}</span></div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {!isEditing ? (
                  <button onClick={handleEdit} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold"><Edit2 className="w-5 h-5" />Edit Profile</button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={loading} className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? (<><Loader2 className="animate-spin w-4 h-4" /><span>Saving...</span></>) : (<><Save className="w-4 h-4" /><span>Save</span></>)}
                    </button>
                    <button onClick={handleCancel} disabled={loading} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"><X className="w-4 h-4" />Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Contact & Security</h2>
                <div className="space-y-4">
                  {['name', 'username', 'phone', 'password', 'location'].map(field => {
                    const icons = { name: User, username: Mail, phone: Phone, password: Lock, location: MapPin };
                    const Icon = icons[field];
                    return (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-gray-400 mb-2 capitalize">{field}</label>
                        {isEditing ? (
                          <input
                            type={field === 'username' ? 'email' : field === 'password' ? 'password' : 'text'}
                            // Use `tempData[field]` which is guaranteed to be a string
                            value={tempData ? tempData[field] : ''}
                            placeholder={field === 'password' ? 'Leave blank to keep current' : ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        ) : (
                          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl">
                            <Icon className="w-5 h-5 text-orange-400" />
                            <span className="text-gray-300 font-medium truncate">
                              {field === 'password' ? '********' : profileData[field]}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Physical Attributes</h2>
                <div className="space-y-4">
                    {['age', 'height', 'weight'].map(field => {
                    const icons = { age: PersonStanding, height: GitCommitVertical, weight: Weight };
                    const labels = { age: 'Age (Years)', height: 'Height (cm)', weight: 'Weight (kg)'};
                    const Icon = icons[field];
                    return (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-gray-400 mb-2 capitalize">{labels[field]}</label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={tempData ? tempData[field] : ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        ) : (
                          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl"><Icon className="w-5 h-5 text-orange-400" /><span className="text-gray-300 font-medium truncate">{profileData[field]}</span></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white">About Me</h2>
                 {isEditing ? (
                    <textarea
                      value={tempData ? tempData.bio : ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows="12"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 ">
                      <p className="text-gray-400 leading-relaxed">{profileData.bio}</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;