import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage'
import ScoreCard from './components/ScoreCard';
import PlayerProfile from './components/PlayerProfile';
import CreateMatch from './components/CreateMatch';
import UpdateMatch from './components/UpdateMatch';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import Signup from './components/Signup';
import Mymatches from './components/Mymatches';

const App = () => {
  return (
   <Routes>
     
      <Route path="/" element={<LandingPage />} />
       <Route path="/login" element={<Login/>} />
      <Route path="/signup" element={<Signup/>} />
      <Route path="/scorecard/:matchId" element={<ScoreCard />} />
      <Route path="/player/:id" element={<PlayerProfile/>} />
      <Route path="/create-match" element={<CreateMatch />} />
      <Route path="/update-match/:id" element={<UpdateMatch />} />
      <Route path="/profile" element={<UserProfile/>} />
      <Route path="/mymatches" element={<Mymatches />} />

    </Routes>
  )
}

export default App


