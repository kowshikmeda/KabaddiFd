import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you use React Router for IDs
import axios from 'axios';
import { Trophy, Target, Shield, Calendar, MapPin, TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { baseURL } from '../utils/constants';
import BackButton from './BackButton';

const PlayerProfile = () => {
  // const player = {
//   id: 1,
//   name: "Pardeep Narwal",
//   nickname: "The Dubki King",
//   photo: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=400&fit=crop&crop=face",
//   team: "Patna Pirates",
//   teamLogo: "https://images.unsplash.com/photo-1594736797933-d0201ba2fe65?w=100&h=100&fit=crop",
//   position: "Raider",
//   jerseyNumber: 16,
//   age: 27,
//   height: "5'9"",
//   weight: "75 kg",
//   hometown: "Rindhana, Haryana",
//   debut: "2014",
//   careerStats: {
//     totalMatches: 142,
//     totalPoints: 1674,
//     raidPoints: 1589,
//     tacklePoints: 85,
//     successfulRaids: 892,
//     raidSuccessRate: 65.8,
//     averagePoints: 11.8,
//     superRaids: 156,
//     super10s: 89,
//     doOrDieRaidSuccess: 72.3
//   },
//   lastFiveMatches: [
//     {
//       date: "2024-08-20",
//       opponent: "Bengal Warriors",
//       venue: "EKA Arena",
//       result: "Won",
//       score: "34-28",
//       playerPoints: 15,
//       raidPoints: 14,
//       tacklePoints: 1,
//       performance: "excellent"
//     },
//     {
//       date: "2024-08-17",
//       opponent: "Dabang Delhi",
//       venue: "Thyagaraj Complex",
//       result: "Lost",
//       score: "26-31",
//       playerPoints: 12,
//       raidPoints: 11,
//       tacklePoints: 1,
//       performance: "good"
//     },
//     {
//       date: "2024-08-14",
//       opponent: "U Mumba",
//       venue: "NSCI Dome",
//       result: "Won",
//       score: "38-29",
//       playerPoints: 18,
//       raidPoints: 16,
//       tacklePoints: 2,
//       performance: "excellent"
//     },
//     {
//       date: "2024-08-11",
//       opponent: "Tamil Thalaivas",
//       venue: "Nehru Stadium",
//       result: "Won",
//       score: "35-30",
//       playerPoints: 13,
//       raidPoints: 12,
//       tacklePoints: 1,
//       performance: "good"
//     },
//     {
//       date: "2024-08-08",
//       opponent: "Jaipur Pink Panthers",
//       venue: "Sawai Mansingh Stadium",
//       result: "Lost",
//       score: "28-33",
//       playerPoints: 8,
//       raidPoints: 7,
//       tacklePoints: 1,
//       performance: "average"
//     }
//   ]
// };
  // State for player data, loading, and error handling
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the player ID from the URL, e.g., /players/123
  const { id } = useParams();

  useEffect(() => {
    // Hardcoded ID for demonstration if not available from URL
    const playerId = id || 'some-player-id';
  console.log("Fetching data for player ID:", playerId);
    const fetchPlayerData = async () => {
      try {
        // Fetch both user and profile data in parallel
        const [userResponse, profileResponse] = await Promise.all([
          axios.get(baseURL+`/users/user/${playerId}`),
          axios.get(baseURL+`/users/user/${playerId}/profile`)
        ]);

        const userData = userResponse.data;
        const profileData = profileResponse.data;
        
        // Transform the API data into the structure the UI expects
        const transformedData = {
          id: userData.id,
          name: userData.name,
          nickname: userData.about || "The Finisher", // Fallback nickname
           photo: userData.url ,// || `https://ui-avatars.com/api/john}&background=random`,
          team: "Team Name", // Placeholder as it's not in API
         // teamLogo: "https://via.placeholder.com/100", // Placeholder
          position: "Raider", // Placeholder
          jerseyNumber: Math.floor(Math.random() * 100), // Placeholder
          age: userData.age,
          height: `${Math.floor(userData.height / 30.48)}'${Math.round((userData.height % 30.48) / 2.54)}"`, // Assuming cm
          weight: `${userData.weight} kg`,
          hometown: userData.location,
          debut: new Date(profileData.debutMatch).getFullYear().toString(),

          careerStats: {
            totalMatches: profileData.totalMatches,
            totalPoints: profileData.totalPoints,
            raidPoints: profileData.raidPoints,
            tacklePoints: profileData.tacklePoints,
            // Calculate average points
            averagePoints: profileData.totalMatches > 0 ? (profileData.totalPoints / profileData.totalMatches).toFixed(1) : 0,
             // Calculate success rate as a percentage of total points
            raidSuccessRate: profileData.totalPoints > 0 ? ((profileData.raidPoints / profileData.totalPoints) * 100).toFixed(1) : 0
          },
          
          // Transform recent matches data
          lastFiveMatches: profileData.matches.slice(0, 5).map(match => {
            const isWin = match.team1Score > match.team2Score; // Assumption
            let performance = 'average';
            if (match.totalPoints >= 15) performance = 'excellent';
            else if (match.totalPoints >= 10) performance = 'good';
            else if (match.totalPoints < 5) performance = 'poor';

            return {
              date: new Date(match.matchDate).toISOString().split('T')[0],
              opponent: match.oppositeTeamName,
              venue: match.location,
              result: isWin ? "Won" : "Lost",
              score: `${match.team1Score}-${match.team2Score}`,
              playerPoints: match.totalPoints,
              raidPoints: match.raidPoints,
              tacklePoints: match.tacklePoints,
              performance: performance
            };
          })
        };
        
        setPlayer(transformedData);
      } catch (err) {
        setError("Failed to fetch player data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]); // Refetch if the ID in the URL changes

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'good': return 'text-blue-400 bg-blue-500/20';
      case 'average': return 'text-yellow-400 bg-yellow-500/20';
      case 'poor': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getResultColor = (result) => {
    return result === 'Won' ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white text-2xl">Loading Player Profile...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-400 text-2xl">{error}</div>;
  }

  if (!player) {
    return null; // Or a "Player not found" message
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <BackButton/>
      <div className="container mx-auto max-w-7xl">
        
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Player Profile
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Player Info */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Player Card */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden">
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-orange-500 to-red-600"></div>
                <div className="absolute -bottom-16 left-6">
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-32 h-32 rounded-2xl border-4 border-white/20 shadow-2xl object-cover"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1">
                  <span className="text-white font-bold text-lg">#{player.jerseyNumber}</span>
                </div>
              </div>
              
              <div className="pt-20 p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                  <img src={player.teamLogo} alt={player.team} className="w-8 h-8 rounded-full" />
                </div>
                <p className="text-orange-400 font-medium mb-1">"{player.nickname}"</p>
                <p className="text-gray-300 mb-4">{player.position} • {player.team}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-orange-400 font-bold">Age</div>
                    <div className="text-white text-lg">{player.age}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-orange-400 font-bold">Height</div>
                    <div className="text-white text-lg">{player.height}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-orange-400 font-bold">Weight</div>
                    <div className="text-white text-lg">{player.weight}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-orange-400 font-bold">Debut</div>
                    <div className="text-white text-lg">{player.debut}</div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm">Hometown</div>
                  <div className="text-white font-medium">{player.hometown}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Recent Matches */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Career Stats */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span>Career Stats</span>
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{player.careerStats.totalMatches}</div>
                    <div className="text-gray-300 text-sm">Matches Played</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl">
                    <div className="text-3xl font-bold text-orange-400 mb-1">{player.careerStats.totalPoints}</div>
                    <div className="text-gray-300 text-sm">Total Points</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl">
                    <div className="text-3xl font-bold text-green-400 mb-1">{player.careerStats.averagePoints}</div>
                    <div className="text-gray-300 text-sm">Avg Points</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{player.careerStats.raidSuccessRate}%</div>
                    <div className="text-gray-300 text-sm">Raid Success</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300 flex items-center space-x-2">
                      <Target className="w-4 h-4 text-red-400" />
                      <span>Raid Points</span>
                    </span>
                    <span className="text-red-400 font-bold">{player.careerStats.raidPoints}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>Tackle Points</span>
                    </span>
                    <span className="text-blue-400 font-bold">{player.careerStats.tacklePoints}</span>
                  </div>
                 
                </div>
              </div>

            {/* Last 5 Matches */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-6">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                <span>Recent Matches</span>
              </h3>
              
              <div className="space-y-4">
                {player.lastFiveMatches.map((match, index) => (
                  <div key={index} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400 text-sm">{match.date}</div>
                        <span className="text-gray-500">•</span>
                        <div className="flex items-center space-x-2 text-gray-300 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{match.venue}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(match.performance)}`}>
                        {match.performance.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-white font-bold">vs {match.opponent}</div>
                        <div className={`font-bold ${getResultColor(match.result)}`}>
                          {match.result} {match.score}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {match.result === 'Won' ? (
                          <ArrowUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-orange-400 mb-1">{match.playerPoints}</div>
                        <div className="text-gray-300 text-xs">Total Points</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-red-400 mb-1">{match.raidPoints}</div>
                        <div className="text-gray-300 text-xs">Raid Points</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{match.tacklePoints}</div>
                        <div className="text-gray-300 text-xs">Tackle Points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Last 5 Matches Average</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-400">
                        {Math.round((player.lastFiveMatches.reduce((sum, match) => sum + match.playerPoints, 0) / 5) * 10) / 10}
                      </div>
                      <div className="text-xs text-gray-400">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {player.lastFiveMatches.filter(match => match.result === 'Won').length}/5
                      </div>
                      <div className="text-xs text-gray-400">Wins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;