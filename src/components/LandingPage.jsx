import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Search, Clock, MapPin, Plus, Loader2 } from 'lucide-react';
import { baseURL, socketURL } from '../utils/constants';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { io } from 'socket.io-client';

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const user = localStorage.getItem('user');

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    const socket = io(socketURL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
     // console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('matchUpdated', (data) => {
      setMatches((prevMatches) => {
        const matchExists = prevMatches.some((m) => m.id === data.id);

        const updatedMatch = {
          id: data.id,
          team1: data.team1,
          team2: data.team2,
          status: data.status.toUpperCase(),
          venue: data.venue,
          date: new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          remainingDuration: data.remainingDuration,
          creatorName: data.creatorName || 'Unknown',
        };

        if (matchExists) {
          // Update existing match
          return prevMatches.map((m) => (m.id === data.id ? { ...m, ...updatedMatch } : m));
        } else {
          // Add new match if not present
          return [...prevMatches, updatedMatch];
        }
      });
    });

    socket.on('disconnect', () => {
     // console.log('🔴 Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get(baseURL + '/matches/all');

        const transformedData = response.data.data.map((match) => ({
          id: match._id,
          team1: {
            name: match.team1Name,
            photo:
              match.team1Photo ||
              `https://ui-avatars.com/api/?name=${match.team1Name.split(' ').join('+')}&background=random`,
            score: match.team1Score,
          },
          team2: {
            name: match.team2Name,
            photo:
              match.team2Photo ||
              `https://ui-avatars.com/api/?name=${match.team2Name.split(' ').join('+')}&background=random`,
            score: match.team2Score,
          },
          status: match.status.toUpperCase(),
          venue: match.venue,
          creatorName: match.createdBy?.name || 'Unknown',
          date: new Date(match.matchDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          remainingDuration: match.remainingDuration || 0,
        }));

        setMatches(transformedData);
      } catch (error) {
        console.error('Error fetching match data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    const hasLiveMatch = matches.some((match) => match.status === 'LIVE');
    if (!hasLiveMatch) return;

    const timerInterval = setInterval(() => {
      setMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.status === 'LIVE' && match.remainingDuration > 0) {
            return { ...match, remainingDuration: match.remainingDuration - 1 };
          }
          return match;
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [matches]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500 text-white animate-pulse';
      case 'COMPLETED':
        return 'bg-green-500 text-white';
      case 'UPCOMING':
        return 'bg-blue-500 text-white';
      case 'PAUSED':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getWinner = (match) => {
    if (match.status !== 'COMPLETED') return null;
    return match.team1.score > match.team2.score ? 'team1' : match.team2.score > match.team1.score ? 'team2' : 'draw';
  };

  const filteredMatches = matches
    .filter((match) => (activeFilter === 'all' ? true : match.status.toLowerCase() === activeFilter))
    .filter((match) => {
      const term = searchTerm.toLowerCase();
      return (
        match.team1.name.toLowerCase().includes(term) || match.team2.name.toLowerCase().includes(term) || term === ''
      );
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm"></div>
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-2xl">
                <Link to="/">
                  <Flame className="w-8 h-8 text-white" />
                </Link>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                GULLY KABADDI 
              </h1>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/mymatches"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                >
                  MyMatches
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    to="/create-match"
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </Link>
                  <ProfileDropdown />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 ">
                <Link
                  to="/login"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-10 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  SignUp
                </Link>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white z-5" />
              <input
                type="text"
                placeholder="Search for a team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto px-6 pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center bg-white/5 backdrop-blur-lg rounded-2xl p-2 border border-white/10">
            {['all', 'live', 'paused', 'completed', 'upcoming'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches Section */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-xl">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <span className="text-3xl ml-4">Loading Matches...</span>
        </div>
      ) : (
        <div className="container mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => {
                const winner = getWinner(match);
                return (
                  <div
                    key={match.id}
                    onClick={() => navigate(`/scorecard/${match.id}`)}
                    className="cursor-pointer bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {match.status}
                      </span>

                      {(match.status === 'LIVE' || match.status === 'PAUSED') && (
                        <div
                          className={`flex items-center space-x-2 ${
                            match.status === 'LIVE' ? 'text-orange-400' : 'text-yellow-400'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-sm">{formatTime(match.remainingDuration)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`flex-1 text-center ${
                          winner === 'team1' ? 'scale-105' : ''
                        } transition-transform duration-300`}
                      >
                        <div className="relative mb-3">
                          <img
                            src={match.team1.photo}
                            alt={match.team1.name}
                            className={`w-20 h-20 rounded-full mx-auto object-cover border-4 ${
                              winner === 'team1' ? 'border-yellow-400' : 'border-white/20'
                            }`}
                          />
                          {winner === 'team1' && (
                            <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />
                          )}
                        </div>
                        <h3 className={`font-bold mb-2 ${winner === 'team1' ? 'text-yellow-400' : 'text-white'}`}>
                          {match.team1.name}
                        </h3>
                        <div className={`text-4xl font-bold ${winner === 'team1' ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {match.status !== 'UPCOMING' ? match.team1.score : '-'}
                        </div>
                      </div>

                      <div className="px-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-2">
                          <span className="text-white font-bold text-sm">VS</span>
                        </div>
                      </div>

                      <div
                        className={`flex-1 text-center ${
                          winner === 'team2' ? 'scale-105' : ''
                        } transition-transform duration-300`}
                      >
                        <div className="relative mb-3">
                          <img
                            src={match.team2.photo}
                            alt={match.team2.name}
                            className={`w-20 h-20 rounded-full mx-auto object-cover border-4 ${
                              winner === 'team2' ? 'border-yellow-400' : 'border-white/20'
                            }`}
                          />
                          {winner === 'team2' && (
                            <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />
                          )}
                        </div>
                        <h3 className={`font-bold mb-2 ${winner === 'team2' ? 'text-yellow-400' : 'text-white'}`}>
                          {match.team2.name}
                        </h3>
                        <div className={`text-4xl font-bold ${winner === 'team2' ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {match.status !== 'UPCOMING' ? match.team2.score : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-center text-sm text-gray-300">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{match.venue}, {match.date}</span>
                      </div>
                      <div className="text-right text-gray-300 text-sm mt-1">
                        {`Created by - ${match.creatorName}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="lg:col-span-2 text-center py-16 bg-white/5 rounded-3xl">
                <h3 className="text-2xl font-bold text-white">No Matches Found</h3>
                <p className="text-gray-400 mt-2">Try adjusting your search or filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 py-16">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Join the Action</h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Don't miss out on the most exciting Kabaddi matches of the season. Get your tickets now!
          </p>
          <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            Book Tickets Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
