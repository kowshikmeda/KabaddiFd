import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Clock, MapPin, Flame, Users, Target, Shield, Star } from 'lucide-react';
import { baseURL } from '../utils/constants';
import BackButton from './BackButton';

const ScoreCard = () => {
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0); // New state for ticking timer
  const [matchName, setMatchName] = useState(''); // New state for match name
  const { matchId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null); // Ref to hold the interval ID

  const formatTimeFromSeconds = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
      return "00:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = Math.floor(totalSeconds % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${paddedMinutes}:${paddedSeconds}`;
  };

  useEffect(() => {
    const fetchMatchData = async () => {
      const id = matchId || '68aee36d66f3dabbe87e76fb'; // Fallback for testing

      try {
        setLoading(true);
        const response = await axios.get(baseURL + `/matchstats/match/scorecard/${id}`);
        const apiData = response.data;
        console.log("Fetched Match Data:", apiData);

        const transformPlayers = (players) =>
          players.map(p => ({
            id: p.playerId,
            name: p.playerName,
            raidPoints: p.raidPoints,
            tacklePoints: p.tacklePoints,
            totalPoints: p.raidPoints + p.tacklePoints,
          }));

        const team1Players = transformPlayers(apiData.team1);
        const team2Players = transformPlayers(apiData.team2);

        const transformedData = {
          id: apiData.matchId,
          matchName: apiData.matchName || "Kabaddi Match", // Get match name from API
          team1: {
            name: apiData.team1Name,
            photo: `https://ui-avatars.com/api/?name=${apiData.team1Name.split(' ').join('+')}&background=random`,
            score: team1Players.reduce((sum, p) => sum + p.totalPoints, 0),
            players: team1Players,
          },
          team2: {
            name: apiData.team2Name,
            photo: `https://ui-avatars.com/api/?name=${apiData.team2Name.split(' ').join('+')}&background=random`,
            score: team2Players.reduce((sum, p) => sum + p.totalPoints, 0),
            players: team2Players,
          },
          status: apiData.status,
          time: formatTimeFromSeconds(apiData.remainingDuration) || "40:00", // Initial formatted time
          remainingDuration: apiData.remainingDuration, // Store raw seconds for timer
          venue: apiData.location || "Kabaddi Stadium",
          date: apiData.createdAt || new Date().toISOString(),
        };

        setMatch(transformedData);
        setMatchName(transformedData.matchName); // Set match name
        setRemainingTime(transformedData.remainingDuration); // Initialize ticking timer with backend value
        
        // Clear any existing timer before starting a new one
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Start timer if match is LIVE
        if (transformedData.status === 'LIVE' && transformedData.remainingDuration > 0) {
          timerRef.current = setInterval(() => {
            setRemainingTime(prevTime => {
              if (prevTime <= 1) { // Stop at 0 or below
                clearInterval(timerRef.current);
                timerRef.current = null;
                // Optionally refetch or update status to COMPLETED
                return 0;
              }
              return prevTime - 1;
            });
          }, 1000);
        }

      } catch (err) {
        setError("Failed to fetch match scorecard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();

    // Cleanup interval on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [matchId]); // Re-run effect if matchId changes

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500 text-white animate-pulse';
      case 'COMPLETED': return 'bg-green-500 text-white';
      case 'FINISHED': return 'bg-green-500 text-white';
      case 'UPCOMING': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-white text-xl">Loading Scorecard...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-red-400 text-xl">{error}</div>;
  }
  if (!match) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-gray-400 text-xl">Match data not found.</div>;
  }

  const winner = match.status === 'COMPLETED' || match.status === 'FINISHED'
    ? (match.team1.score > match.team2.score ? 'team1' :
      (match.team2.score > match.team1.score ? 'team2' : 'draw'))
    : null;

  const currentTeamData = selectedTeam === 'team1' ? match.team1 : match.team2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <BackButton/>
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg">
              <Link to={"/"}> <Flame className="w-8 h-8 text-white" /></Link>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              KABADDI LEAGUE SCORECARD
            </h1>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-8 border-b border-white/10">
            {/* New Header Layout with 3 equally spaced columns */}
            <div className="flex justify-between items-center mb-4">
                {/* Column 1: Match Status (Aligned Left) */}
                <div className="flex-1 text-left">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(match.status)}`}>
                        {match.status}
                    </span>
                </div>

                {/* Column 2: Match Name (Centered, added this) */}
                <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold text-white tracking-wide">{matchName}</h2>
                </div>

                {/* Column 3: Live Timer (Aligned Right) */}
                <div className="flex-1 text-right">
                    {match.status === 'LIVE' && ( // Only show ticking timer for LIVE matches
                        <div className="inline-flex items-center gap-2 text-orange-400 font-mono text-lg bg-white/10 px-4 py-2 rounded-full">
                            <Clock className="w-5 h-5" />
                            <span>{formatTimeFromSeconds(remainingTime)}</span>
                        </div>
                    )}
                    {(match.status === 'COMPLETED' || match.status === 'PAUSED' || match.status === 'UPCOMING') && (
                        <div className="inline-flex items-center gap-2 text-gray-300 font-mono text-lg bg-white/10 px-4 py-2 rounded-full">
                             <Clock className="w-5 h-5" />
                            <span>{match.time}</span> {/* Display initial time for non-live matches */}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-center items-center mb-8"> {/* Adjusted margin for date/venue */}
                <div className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{match.venue}, {new Date(match.date).toLocaleDateString()}</span>
                </div>
            </div>


            <div className="flex items-center justify-around">
              <div className={`flex-1 text-center ${winner === 'team1' ? 'scale-105' : ''} transition-transform duration-300`}>
                <div className="relative mb-3 inline-block">
                  <img src={match.team1.photo} alt={match.team1.name} className={`w-24 h-24 rounded-full mx-auto object-cover border-4 ${winner === 'team1' ? 'border-yellow-400' : 'border-white/20'}`} />
                  {winner === 'team1' && <Trophy className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}
                </div>
                <h3 className={`font-bold text-lg mb-2 ${winner === 'team1' ? 'text-yellow-400' : 'text-white'}`}>{match.team1.name}</h3>
                <div className={`text-5xl font-bold ${winner === 'team1' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.team1.score}</div>
              </div>

              <div className="px-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-3">
                  <span className="text-white font-bold text-lg">VS</span>
                </div>
              </div>

              <div className={`flex-1 text-center ${winner === 'team2' ? 'scale-105' : ''} transition-transform duration-300`}>
                <div className="relative mb-3 inline-block">
                  <img src={match.team2.photo} alt={match.team2.name} className={`w-24 h-24 rounded-full mx-auto object-cover border-4 ${winner === 'team2' ? 'border-yellow-400' : 'border-white/20'}`} />
                  {winner === 'team2' && <Trophy className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}
                </div>
                <h3 className={`font-bold text-lg mb-2 ${winner === 'team2' ? 'text-yellow-400' : 'text-white'}`}>{match.team2.name}</h3>
                <div className={`text-5xl font-bold ${winner === 'team2' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.team2.score}</div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white text-center mb-4">View Player Statistics</h3>
            <div className="flex bg-white/10 rounded-2xl p-2 max-w-md mx-auto">
              <button onClick={() => setSelectedTeam('team1')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${selectedTeam === 'team1' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                <img src={match.team1.photo} alt={match.team1.name} className="w-6 h-6 rounded-full" />
                <span>{match.team1.name}</span>
              </button>
              <button onClick={() => setSelectedTeam('team2')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${selectedTeam === 'team2' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                <img src={match.team2.photo} alt={match.team2.name} className="w-6 h-6 rounded-full" />
                <span>{match.team2.name}</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-6 gap-4 mb-4 p-4 bg-white/10 rounded-xl">
              <div className="col-span-2 text-gray-400 font-semibold">Player</div>
              <div className="text-center text-gray-400 font-semibold flex items-center justify-center space-x-1"><Target className="w-4 h-4" /><span>Raids</span></div>
              <div className="text-center text-gray-400 font-semibold flex items-center justify-center space-x-1"><Shield className="w-4 h-4" /><span>Tackles</span></div>
              <div className="text-center text-gray-400 font-semibold flex items-center justify-center space-x-1"><Star className="w-4 h-4" /><span>Total</span></div>
              <div className="text-center text-gray-400 font-semibold">Performance</div>
            </div>

            <div className="space-y-3">
              {currentTeamData.players.map((player, index) => (
                <div key={index}  onClick={() => navigate(`/player/${player.id}`) } className="grid grid-cols-6 gap-4 items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
                  <div className="col-span-2 text-white font-semibold">{player.name}</div>
                  <div className="text-center"><span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg font-bold">{player.raidPoints}</span></div>
                  <div className="text-center"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold">{player.tacklePoints}</span></div>
                  <div className="text-center"><span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg font-bold">{player.totalPoints}</span></div>
                  <div className="text-center">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((player.totalPoints / 15) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{currentTeamData.players.reduce((sum, p) => sum + p.raidPoints, 0)}</div>
                  <div className="text-gray-300 text-sm">Total Raid Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{currentTeamData.players.reduce((sum, p) => sum + p.tacklePoints, 0)}</div>
                  <div className="text-gray-300 text-sm">Total Tackle Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">{currentTeamData.players.reduce((sum, p) => sum + p.totalPoints, 0)}</div>
                  <div className="text-gray-300 text-sm">Team Total Points</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;