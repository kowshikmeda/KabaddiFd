import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Trophy, Clock, MapPin, Flame, FileQuestion, ServerCrash, Frown, User, Plus, Shield, Sword, Loader2 } from 'lucide-react';
import { baseURL } from '../utils/constants';
import ProfileDropdown from './ProfileDropdown';

import BackButton from './BackButton';

// Reusable ScoreCard display component with conditional navigation
const ScorecardDisplay = ({ match, activeTab }) => {
  const navigate = useNavigate();

  // Determine the navigation path based on the active tab
  const destinationPath = activeTab === 'created'
    ? `/update-match/${match.id}`
    : `/scorecard/${match.id}`;

  const handleCardClick = () => {
    navigate(destinationPath);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500 text-white animate-pulse';
      case 'COMPLETED': return 'bg-green-500 text-white';
      case 'UPCOMING': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const winner = match.status === 'COMPLETED'
    ? (match.team1.score > match.team2.score ? 'team1' : (match.team2.score > match.team1.score ? 'team2' : 'draw'))
    : null;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer"
    >
      <div className="p-8 border-b border-white/10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 text-left"><span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(match.status)}`}>{match.status}</span></div>
          <div className="flex-1 text-center">{match.status === 'LIVE' && (<div className="inline-flex items-center gap-2 text-orange-400 font-mono text-lg bg-white/10 px-4 py-2 rounded-full"><Clock className="w-5 h-5" /><span>{match.time}</span></div>)}</div>
          <div className="flex-1 text-right"><div className="inline-flex items-center gap-2 text-sm text-gray-300"><MapPin className="w-4 h-4" /><span>{match.venue}, {new Date(match.date).toLocaleDateString()}</span></div></div>
        </div>
        <div className="flex items-center justify-around">
          <div className={`flex-1 text-center ${winner === 'team1' ? 'scale-105' : ''} transition-transform duration-300`}>
            <div className="relative mb-3 inline-block"><img src={match.team1.photo} alt={match.team1.name} className={`w-24 h-24 rounded-full mx-auto object-cover border-4 ${winner === 'team1' ? 'border-yellow-400' : 'border-white/20'}`} />{winner === 'team1' && <Trophy className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}</div>
            <h3 className={`font-bold text-lg mb-2 ${winner === 'team1' ? 'text-yellow-400' : 'text-white'}`}>{match.team1.name}</h3>
            <div className={`text-5xl font-bold ${winner === 'team1' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.status !== 'UPCOMING' ? match.team1.score : '-'}</div>
          </div>
          <div className="px-4"><div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-3"><span className="text-white font-bold text-lg">VS</span></div></div>
          <div className={`flex-1 text-center ${winner === 'team2' ? 'scale-105' : ''} transition-transform duration-300`}>
            <div className="relative mb-3 inline-block"><img src={match.team2.photo} alt={match.team2.name} className={`w-24 h-24 rounded-full mx-auto object-cover border-4 ${winner === 'team2' ? 'border-yellow-400' : 'border-white/20'}`} />{winner === 'team2' && <Trophy className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}</div>
            <h3 className={`font-bold text-lg mb-2 ${winner === 'team2' ? 'text-yellow-400' : 'text-white'}`}>{match.team2.name}</h3>
            <div className={`text-5xl font-bold ${winner === 'team2' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.status !== 'UPCOMING' ? match.team2.score : '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};


const MyMatches = () => {
  
 
  const [allMatches, setAllMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('created'); // 'created' or 'played'
  
  const user = localStorage.getItem('user');

  useEffect(() => {
    if (user ) {
      const fetchMatches = async () => {
        setLoading(true);
        setError(null);
        setAllMatches([]); // Clear previous matches when tab changes

        const endpoint = activeTab === 'created'
          ? `/users/user/created-matches`
          : `/users/user/played-matches`;

        try {
          const response = await axios.get(baseURL + endpoint, {
            withCredentials: true,
          });
          console.log('Fetched matches:', response.data);
          const transformedMatches = response.data.data.map(match => ({
            id: match._id,
            team1: { name: match.team1Name, score: match.team1Score, photo: match.team1Photo || `https://ui-avatars.com/api/?name=${match.team1Name.replace(/\s+/g, '+')}` },
            team2: { name: match.team2Name, score: match.team2Score, photo: match.team2Photo || `https://ui-avatars.com/api/?name=${match.team2Name.replace(/\s+/g, '+')}` },
            status: match.status, venue: match.venue, date: match.createdAt, time: match.remainingDuration,
          }));

          setAllMatches(transformedMatches);
        } catch (err) {
          setError(`Failed to fetch ${activeTab} matches. Please try again later.`);
          console.error(`Error fetching ${activeTab} matches:`, err);
        } finally {
          setLoading(false);
        }
      };
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [activeTab]); // Re-run effect when activeTab or user.id changes

  const filteredMatches = allMatches.filter(match => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      match.team1.name.toLowerCase().includes(term) ||
      match.team2.name.toLowerCase().includes(term) ||
      match.venue.toLowerCase().includes(term)
    );
  });

  const renderContent = () => {
   if (loading)
  return (
    <div className="lg:col-span-2 flex justify-center items-center space-x-3 py-4 text-white">
      <Loader2 className="animate-spin w-10 h-10" />
      <span className='text-3xl'>Loading...</span>
    </div>
  );

    if (error) return <div className="lg:col-span-2 text-center py-20 bg-white/5 rounded-3xl"><ServerCrash className="w-16 h-16 mx-auto text-red-500 mb-4" /><h2 className="text-2xl font-bold text-red-400">An Error Occurred</h2><p className="text-gray-400 mt-2">{error}</p></div>;
    if (!user) return <div className="lg:col-span-2 text-center py-20 bg-white/5 rounded-3xl"><h2 className="text-2xl font-bold text-white">Please Log In</h2><p className="text-gray-400 mt-2">You need to be logged in to see your matches.</p></div>;
    if (allMatches.length === 0) return <div className="lg:col-span-2 text-center py-20 bg-white/5 rounded-3xl"><Frown className="w-16 h-16 mx-auto text-gray-500 mb-4" /><h2 className="text-2xl font-bold text-white">No Matches Yet</h2><p className="text-gray-400 mt-2">You haven't {activeTab} in any matches.</p></div>;
    if (filteredMatches.length === 0) return <div className="lg:col-span-2 text-center py-20 bg-white/5 rounded-3xl"><FileQuestion className="w-16 h-16 mx-auto text-gray-500 mb-4" /><h2 className="text-2xl font-bold text-white">No Matches Found</h2><p className="text-gray-400 mt-2">Your search for "{searchTerm}" did not return any results.</p></div>;
    
    return filteredMatches.map(match => (
      <ScorecardDisplay key={match.id} match={match} activeTab={activeTab} />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <BackButton/>
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 space-y-6 mt-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to='/' className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg"><Flame className="w-6 h-6 text-white" /></Link>
              <h1 className="text-3xl font-bold text-white">My Matches</h1>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <Link to="/create-match" className="p-3 bg-white/10 rounded-full hover:bg-white/20"><Plus className="w-6 h-6 text-white" /></Link>
                <ProfileDropdown />
              </div>
            )}
          </div>
          
          {/* Tabs for Created/Played Matches */}
          <div className="flex bg-white/10 rounded-2xl p-2 max-w-sm mx-auto">
            <button onClick={() => setActiveTab('created')} className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'created' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/20'}`}>
              <Sword className="w-5 h-5"/> Created
            </button>
            <button onClick={() => setActiveTab('played')} className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'played' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/20'}`}>
               <Shield className="w-5 h-5"/> Played
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Team Name or Venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-14 pr-6 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MyMatches;