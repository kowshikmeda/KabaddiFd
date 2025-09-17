import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Clock, MapPin, Flame, Users, Target, Shield, Star, MessageSquare } from 'lucide-react';
import { baseURL, socketURL } from '../utils/constants';
import BackButton from './BackButton';
import { io } from 'socket.io-client';

const ScoreCard = () => {
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [matchName, setMatchName] = useState('');
  const { matchId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [commentaries, setCommentaries] = useState([]);
  const [activeTab, setActiveTab] = useState('playerStats'); // 'playerStats' or 'commentary'

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
    const socket = io(socketURL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('matchUpdated', (data) => {
      if (data.id !== matchId) return;
      console.log("update", data);

      const transformPlayers = (players) =>
        (players || []).map(p => ({
          id: p.playerId,
          name: p.name,
          raidPoints: p.raidPoints || 0,
          tacklePoints: p.tacklePoints || 0,
          totalPoints: (p.raidPoints || 0) + (p.tacklePoints || 0),
        }));

      setMatch((prevMatch) => {
        const updatedMatch = {
          ...prevMatch,
          id: data.id,
          matchName: data.matchName,
          team1: {
            ...data.team1,
            players: transformPlayers(data.players?.team1),
          },
          team2: {
            ...data.team2,
            players: transformPlayers(data.players?.team2),
          },
          status: data.status,
          time: formatTimeFromSeconds(data.remainingDuration),
          remainingDuration: data.remainingDuration,
          venue: data.venue,
          date: data.date,
        };

        if (prevMatch.status === 'PAUSED' && updatedMatch.status === 'LIVE' && !timerRef.current) {
          timerRef.current = setInterval(() => {
            setRemainingTime(prevTime => {
              if (prevTime <= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                return 0;
              }
              return prevTime - 1;
            });
          }, 1000);
        }

        setRemainingTime(updatedMatch.remainingDuration);

        return updatedMatch;
      });
    });

    socket.on("NewCommentary", (commentary) => {
      if (commentary.matchId === matchId) {
        setCommentaries(prev => [commentary, ...prev]);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.disconnect();
    };
  }, [matchId]);

  useEffect(() => {
    const fetchMatchData = async () => {
      const id = matchId || '68aee36d66f3dabbe87e76fb';

      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/matchstats/match/scorecard/${id}`);
        const commentary = await axios.get(`${baseURL}/matches/match/${id}/commentary`);
        setCommentaries(commentary.data.data);
        const apiData = response.data.data;

        const transformPlayers = (players) =>
          (players || []).map(p => ({
            id: p.playerId._id,
            name: p.playerId.name,
            raidPoints: p.raidPoints || 0,
            tacklePoints: p.tacklePoints || 0,
            totalPoints: (p.raidPoints || 0) + (p.tacklePoints || 0),
          }));

        const team1Players = transformPlayers(apiData.team1);
        const team2Players = transformPlayers(apiData.team2);

        const transformedData = {
          id: apiData.matchId._id,
          matchName: `${apiData.team1Name} vs ${apiData.team2Name}`,
          team1: {
            name: apiData.team1Name,
            photo: apiData.matchId.team1Photo || `https://ui-avatars.com/api/?name=${apiData.team1Name.split(' ').join('+')}&background=random`,
            score: apiData.matchId?.team1Score || 0,
            players: team1Players,
          },
          team2: {
            name: apiData.team2Name,
            photo: apiData.matchId.team2Photo || `https://ui-avatars.com/api/?name=${apiData.team2Name.split(' ').join('+')}&background=random`,
            score: apiData.matchId?.team2Score || 0,
            players: team2Players,
          },
          status: (apiData.matchId.status || apiData.status).toUpperCase(),
          time: formatTimeFromSeconds(apiData.matchId.remainingDuration) || "40:00",
          remainingDuration: apiData.matchId.remainingDuration,
          venue: apiData.matchId.venue || "Kabaddi Stadium",
          date: apiData.matchId.matchDate || new Date().toISOString(),
        };

        setMatch(transformedData);
        setMatchName(transformedData.matchName);
        setRemainingTime(transformedData.remainingDuration);

        if (timerRef.current) clearInterval(timerRef.current);

        if (transformedData.status === 'LIVE' && transformedData.remainingDuration > 0) {
          timerRef.current = setInterval(() => {
            setRemainingTime(prevTime => {
              if (prevTime <= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500 text-white animate-pulse';
      case 'COMPLETED': return 'bg-green-500 text-white';
      case 'PAUSED': return 'bg-yellow-500 text-white';
      case 'UPCOMING': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-white text-xl">Loading Scorecard...</div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-red-400 text-xl">{error}</div>;
  if (!match) return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center text-gray-400 text-xl">Match data not found.</div>;

  const winner = match.status === 'COMPLETED'
    ? (match.team1.score > match.team2.score ? 'team1' :
      (match.team2.score > match.team1.score ? 'team2' : 'draw'))
    : null;

  const currentTeamData = selectedTeam === 'team1' ? match.team1 : match.team2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <BackButton />
      <div className="container mx-auto max-w-7xl space-y-8 mt-5">
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
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 text-left">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(match.status)}`}>
                  {match.status}
                </span>
              </div>
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-white tracking-wide">{matchName}</h2>
              </div>
              <div className="flex-1 text-right">
                {match.status === 'LIVE' && (
                  <div className="inline-flex items-center gap-2 text-orange-400 font-mono text-lg bg-white/10 px-4 py-2 rounded-full">
                    <Clock className="w-5 h-5" />
                    <span>{formatTimeFromSeconds(remainingTime)}</span>
                  </div>
                )}
                {(match.status === 'COMPLETED' || match.status === 'PAUSED' || match.status === 'UPCOMING') && (
                  <div className="inline-flex items-center gap-2 text-gray-300 font-mono text-lg bg-white/10 px-4 py-2 rounded-full">
                    <Clock className="w-5 h-5" />
                    <span>{match.time}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center items-center mb-8">
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

          {/* Tabs Navigation */}
          <div className="flex  p-2  bg-white/5 rounded-xl space-x-4 my-4 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('playerStats')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === 'playerStats' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span>Player Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('commentary')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === 'commentary' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Commentary</span>
            </button>
          </div>

          {/* Conditional Rendering based on active tab */}
          {activeTab === 'playerStats' && (
            <div>
              {/* Player Stats Section */}
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
                  {(currentTeamData.players || []).map((player, index) => (
                    <div key={player.id || index} onClick={() => navigate(`/player/${player.id}`)} className="grid grid-cols-6 gap-4 items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-300 cursor-pointer">
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
                      <div className="text-2xl font-bold text-blue-400">{(currentTeamData.players || []).reduce((sum, p) => sum + p.raidPoints, 0)}</div>
                      <div className="text-gray-300 text-sm">Total Raid Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{(currentTeamData.players || []).reduce((sum, p) => sum + p.tacklePoints, 0)}</div>
                      <div className="text-gray-300 text-sm">Total Tackle Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{currentTeamData.score}</div>
                      <div className="text-gray-300 text-sm">Team Total Points</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commentary' && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-white text-center mb-4 flex items-center justify-center space-x-2">
                <MessageSquare className="w-6 h-6 text-orange-400" />
                <span>Match Commentary</span>
              </h3>
              {commentaries.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {commentaries.map((commentary, index) => (
                    <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col md:flex-row md:items-start text-sm">
                      <div className="text-gray-400 text-xs md:text-sm md:w-1/4 flex-shrink-0 mb-2 md:mb-0">
                        {new Date(commentary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-gray-500 text-xs">{new Date(commentary.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-white md:w-3/4">
                        {commentary.commentary}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">No historical commentary available yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;