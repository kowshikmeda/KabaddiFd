import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Users, Clock, Plus, Minus, Play, Pause, Power, FlagOff } from 'lucide-react';
import { baseURL } from '../utils/constants';

import ProfileDropdown from './ProfileDropdown';
import BackButton from './BackButton';

// Helper function to convert seconds to a MM:SS string.
const secondsToTime = (totalSeconds) => {
  const secondsNum = parseInt(totalSeconds, 10);
  if (isNaN(secondsNum) || secondsNum < 0) {
      return '00:00';
  }
  const minutes = Math.floor(secondsNum / 60);
  const seconds = secondsNum % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


const UpdateMatch = () => {
  const { id: matchId } = useParams();
  const currentUserID = localStorage.getItem('user');

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    selectedTeam: 'teamA',
    selectedPlayer: '',
    pointType: 'raid',
    points: 1
  });

  // Effect to fetch initial match data
  useEffect(() => {
    if (!matchId) return;

    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/matchstats/match/livescorecard/${matchId}`, {
          withCredentials: true
        });

        const apiData = response.data.data;

        const transformPlayers = (players) => (players || []).map(p => ({
          id: p.playerId._id,
          name: p.playerId.name,
          raidPoints: p.raidPoints || 0,
          tacklePoints: p.tacklePoints || 0,
        }));

        const team1Players = transformPlayers(apiData.team1);
        const team2Players = transformPlayers(apiData.team2);

        const transformedData = {
          teamA: {
            name: apiData.team1Name,
            score: apiData.matchId?.team1Score || 0,
            color: 'from-red-500 to-red-600',
            players: team1Players,
          },
          teamB: {
            name: apiData.team2Name,
            score: apiData.matchId?.team2Score || 0,
            color: 'from-blue-500 to-blue-600',
            players: team2Players,
          },
          timeRemaining: apiData.matchId?.remainingDuration || 0,
          status: (apiData.matchId?.status || 'UPCOMING').toUpperCase(),
        };

        setMatchData(transformedData);
        if (transformedData.teamA.players.length > 0) {
          setUpdateForm(prev => ({ ...prev, selectedPlayer: transformedData.teamA.players[0].id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch match data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  // Countdown Timer
  useEffect(() => {
    if (matchData?.status !== 'LIVE') {
      return;
    }
    const timer = setInterval(() => {
      setMatchData(prevData => {
        if (prevData.status !== 'LIVE' || prevData.timeRemaining <= 1) {
          clearInterval(timer);
          if (prevData.timeRemaining <= 1) {
            handleStatusChange('end');
            return { ...prevData, timeRemaining: 0, status: 'COMPLETED' };
          }
          return prevData;
        }
        return { ...prevData, timeRemaining: prevData.timeRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [matchData?.status, matchData?.timeRemaining]);

  const pointTypes = [
    { value: 'raid', label: 'Raid Point', points: [1, 2, 3, 4, 5, 6, 7] },
    { value: 'tackle', label: 'Tackle Point', points: [1, 2] },
    { value: 'bonus', label: 'Bonus Point', points: [1] },
    { value: 'technical', label: 'Technical Point', points: [1, 2] },
    { value: 'allout', label: 'All Out', points: [2] }
  ];

  const handleStatusChange = async (actionType) => {
    try {
      const response = await axios.put(`${baseURL}/matches/match/${actionType}/${matchId}/${currentUserID}`, {}, {
        withCredentials: true
      });
      const updatedMatchDto = response.data.data;
      setMatchData(prev => ({
        ...prev,
        status: updatedMatchDto.status.toUpperCase(),
        timeRemaining: updatedMatchDto.remainingDuration
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to perform action: ${actionType}`;
      alert(`Error: ${errorMessage}`);
      console.error(`Failed to perform action '${actionType}':`, err);
    }
  };

  const startMatch = () => handleStatusChange('start');
  const endMatch = () => handleStatusChange('end');
  const togglePause = () => handleStatusChange(matchData.status === 'PAUSED' ? 'resume' : 'pause');

  const handleScoreUpdate = async (pointsValue) => {
    // --- BUG FIX: Add safeguard to prevent score updates if match is not LIVE ---
    if (matchData?.status !== 'LIVE') {
      alert('You can only update the score while the match is live.');
      return;
    }

    if (!updateForm.selectedPlayer && ['raid', 'tackle'].includes(updateForm.pointType)) {
      alert('Please select a player for raid or tackle points.');
      return;
    }
    
    const pointTypeMapping = {
      raid: 'RAID_POINT', tackle: 'TACKLE_POINT', bonus: 'BONUS_POINT',
      technical: 'TECHNICAL_POINT', allout: 'ALL_OUT_POINT'
    };

    const payload = {
      teamName: matchData[updateForm.selectedTeam].name,
      playerId: updateForm.selectedPlayer,
      pointType: pointTypeMapping[updateForm.pointType],
      points: pointsValue,
    };

    setIsUpdatingScore(true);
    try {
      await axios.put(`${baseURL}/matchstats/match/${matchId}/update/${currentUserID}`, payload, {
        withCredentials: true
      });

      setMatchData(prev => {
        const newMatchData = JSON.parse(JSON.stringify(prev));
        const teamKey = updateForm.selectedTeam;
        
        newMatchData[teamKey].score += pointsValue;

        if (['raid', 'tackle'].includes(updateForm.pointType)) {
          const playerIndex = newMatchData[teamKey].players.findIndex(p => p.id === updateForm.selectedPlayer);
          if (playerIndex > -1) {
            const player = newMatchData[teamKey].players[playerIndex];
            if (updateForm.pointType === 'raid') {
              player.raidPoints += pointsValue;
            } else if (updateForm.pointType === 'tackle') {
              player.tacklePoints += pointsValue;
            }
          }
        }
        return newMatchData;
      });

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update score.';
      alert(`Error: ${errorMessage}`);
      console.error('Failed to update score:', err);
    } finally {
      setIsUpdatingScore(false);
    }
  };


  const getSelectedPointType = () => pointTypes.find(type => type.value === updateForm.pointType);
  
  const handleTeamChange = (e) => {
    const newTeam = e.target.value;
    setUpdateForm(prev => ({
      ...prev,
      selectedTeam: newTeam,
      selectedPlayer: matchData[newTeam].players[0]?.id || ''
    }));
  };

  const renderMatchControlButton = () => {
    if (!matchData) return null;
    switch (matchData.status) {
      case 'UPCOMING':
        return <button onClick={startMatch} className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600"><Power /> Start Match</button>;
      case 'LIVE':
        return (
          <div className="flex gap-4">
            <button onClick={togglePause} className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600"><Pause /> Pause Match</button>
            <button onClick={endMatch} className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600"><FlagOff /> End Match</button>
          </div>
        );
      case 'PAUSED':
        return (
          <div className="flex gap-4">
            <button onClick={togglePause} className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600"><Play /> Resume Match</button>
            <button onClick={endMatch} className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600"><FlagOff /> End Match</button>
          </div>
        );
      case 'COMPLETED':
        return <div className="text-white font-bold py-3 px-6 rounded-xl bg-gray-600">Match Finished</div>;
      default:
        return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white text-xl">Loading Match Details...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">{error}</div>;
  if (!matchData) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">No match data found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <BackButton/>
      <div className="max-w-6xl mx-auto space-y-8 mt-5">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between">
                <div/>
                <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-3xl font-bold text-white">Pro Kabaddi League</h1>
                </div>
                {currentUserID && <ProfileDropdown />}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm mt-4">
              <span className={`px-3 py-1 rounded-full ${matchData.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} text-white font-semibold`}>{matchData.status}</span>
              <span className="text-white/80 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {secondsToTime(matchData.timeRemaining)}
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center"><div className={`bg-gradient-to-r ${matchData.teamA.color} rounded-2xl p-6`}><div className="text-white mb-4"><Users className="w-8 h-8 mx-auto mb-2" /><h2 className="text-xl font-bold">{matchData.teamA.name}</h2></div><div className="text-6xl font-black text-white">{matchData.teamA.score}</div></div></div>
            <div className="text-center"><div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto"><span className="text-2xl font-black text-white">VS</span></div></div>
            <div className="text-center"><div className={`bg-gradient-to-r ${matchData.teamB.color} rounded-2xl p-6`}><div className="text-white mb-4"><Users className="w-8 h-8 mx-auto mb-2" /><h2 className="text-xl font-bold">{matchData.teamB.name}</h2></div><div className="text-6xl font-black text-white">{matchData.teamB.score}</div></div></div>
          </div>
          <div className="mt-8 flex justify-center gap-4">{renderMatchControlButton()}</div>
        </div>
        
        {/* --- BUG FIX: The entire panel is now wrapped in a 'group' div and a fieldset that disables its contents --- */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 group">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Score Update Panel</h2>
          <fieldset disabled={matchData?.status !== 'LIVE'}>
            <div className="grid md:grid-cols-3 gap-6 transition-opacity duration-300 group-disabled:opacity-50 group-disabled:cursor-not-allowed">
              <div className="md:col-span-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Select Team</label>
                  <select className="w-full bg-white/20 rounded-xl px-4 py-3 text-white" value={updateForm.selectedTeam} onChange={handleTeamChange}><option value="teamA" className="bg-slate-800">{matchData.teamA.name}</option><option value="teamB" className="bg-slate-800">{matchData.teamB.name}</option></select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Select Player</label>
                  <select className="w-full bg-white/20 rounded-xl px-4 py-3 text-white" value={updateForm.selectedPlayer} onChange={(e) => setUpdateForm(prev => ({ ...prev, selectedPlayer: e.target.value }))}>
                    {matchData[updateForm.selectedTeam].players.map(player => (<option key={player.id} value={player.id} className="bg-slate-800">{player.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="md:col-span-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Point Type</label>
                  <select className="w-full bg-white/20 rounded-xl px-4 py-3 text-white" value={updateForm.pointType} onChange={(e) => { const selectedType = pointTypes.find(type => type.value === e.target.value); setUpdateForm(prev => ({ ...prev, pointType: e.target.value, points: selectedType?.points[0] || 1 })); }}>
                    {pointTypes.map(type => <option key={type.value} value={type.value} className="bg-slate-800">{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Points</label>
                  <select className="w-full bg-white/20 rounded-xl px-4 py-3 text-white" value={updateForm.points} onChange={(e) => setUpdateForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}>
                    {getSelectedPointType()?.points.map(point => <option key={point} value={point} className="bg-slate-800">{point} {point === 1 ? 'Point' : 'Points'}</option>)}
                  </select>
                </div>
              </div>
              <div className="md:col-span-1 flex items-end gap-3">
                <button 
                  onClick={() => handleScoreUpdate(updateForm.points)} 
                  disabled={isUpdatingScore}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingScore ? 'Updating...' : <><Plus />Add</>}
                </button>
                <button 
                  onClick={() => handleScoreUpdate(-updateForm.points)} 
                  disabled={isUpdatingScore}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingScore ? 'Updating...' : <><Minus />Deduct</>}
                </button>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};

export default UpdateMatch;