import React,{useState,useEffect} from 'react';
import { Trophy, Flame, Search, Clock, MapPin, Plus, Loader2 } from 'lucide-react';
import { baseURL } from '../utils/constants';
import axios from 'axios';
import { useNavigate,Link } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
 const [matches, setMatches] = useState([]);
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const user=localStorage.getItem("user");
  // const matches = [
  //   {
  //     id: 1,
  //     team1: { name: "Bengal Warriors", photo: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=150&h=150&fit=crop&crop=faces", score: 34 },
  //     team2: { name: "Patna Pirates", photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=faces", score: 28 },
  //     status: "FINISHED",
  //     venue: "Jawaharlal Nehru Indoor Stadium",
  //     date: "Today, 8:00 PM"
  //   },
  //   {
  //     id: 2,
  //     team1: { name: "Dabang Delhi", photo: "https://images.unsplash.com/photo-1594736797933-d0201ba2fe65?w=150&h=150&fit=crop&crop=faces", score: 26 },
  //     team2: { name: "U Mumba", photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=center", score: 26 },
  //     status: "LIVE",
  //     time: "25:12",
  //     venue: "Shree Shivchhatrapati Sports Complex",
  //     date: "Today, 9:00 PM"
  //   },
  //   {
  //     id: 3,
  //     team1: { name: "Tamil Thalaivas", photo: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=150&h=150&fit=crop&crop=center", score: 0 },
  //     team2: { name: "Jaipur Pink Panthers", photo: "https://images.unsplash.com/photo-1594736797933-d0201ba2fe65?w=150&h=150&fit=crop&crop=faces", score: 0 },
  //     status: "UPCOMING",
  //     venue: "EKA Arena",
  //     date: "Tomorrow, 8:00 PM"
  //   },
  //   {
  //     id: 4,
  //     team1: { name: "UP Yoddhas", photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=center", score: 41 },
  //     team2: { name: "Patna Pirates", photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=faces", score: 39 },
  //     status: "FINISHED",
  //     venue: "NSCI Dome",
  //     date: "Yesterday, 9:00 PM"
  //   }
  // ];
 

   useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get(baseURL+'/matches/all');
        
        // Transform the API data to match the structure expected by the UI
        const transformedData = response.data.map(match => ({
          id: match.id,
          team1: {
            name: match.team1Name,
            photo: match.team1PhotoUrl,
            score: match.team1Score
          },
          team2: {
            name: match.team2Name,
            photo: match.team2PhotoUrl,
            score: match.team2Score
          },
          status: match.status,
          venue: match.location,
          creatorName: match.creatorName,
          date: new Date(match.createdAt).toLocaleDateString("en-US", {
            year: 'numeric', month: 'long', day: 'numeric'
          }), // Formatting the date
          time: match.remainingDuration ? `${Math.floor(match.remainingDuration / 60)}:${('0' + match.remainingDuration % 60).slice(-2)}` : null
        }));
        setLoading(false);
        setMatches(transformedData); // Load data into state
      } catch (error) {
        setLoading(false);
        console.error("Error fetching match data:", error);
        // Optionally, set an error state here to show a message to the user
      }
    };

    fetchMatches();
  }, []); // Empty dependency array means this runs once on mount

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500 text-white animate-pulse';
      case 'COMPLETED': return 'bg-green-500 text-white';
      case 'UPCOMING': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getWinner = (match) => {
    if (match.status !== 'COMPLETED') return null;
    return match.team1.score > match.team2.score ? 'team1' :
      match.team2.score > match.team1.score ? 'team2' : 'draw';
  };

  const filteredMatches = matches
    .filter(match => {
      if (activeFilter === 'all') return true;
      return match.status.toLowerCase() === activeFilter;
    })
    .filter(match => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return match.team1.name.toLowerCase().includes(term) || match.team2.name.toLowerCase().includes(term);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
           <div className="relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm"></div>
        <div className="relative z-10 container mx-auto px-6 py-8">
          
          {/* Header Row */}
          <div className="flex justify-between items-center gap-4 mb-8">
            {/* Left side: Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-2xl">
               <Link to={"/"}> <Flame className="w-8 h-8 text-white" /></Link>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                KABADDI LEAGUE
              </h1>
            </div>

            {/* Right side: Auth Buttons */}
           {user?(
            <>
             <div className="flex items-center gap-4">
              <Link to="/mymatches" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                Mymatches
              </Link>
             <div className="flex items-center gap-4">
                <Link to="/create-match" className="p-3 bg-white/10 rounded-full hover:bg-white/20"><Plus className="w-6 h-6 text-white" /></Link>
                <ProfileDropdown />
              </div>
               </div>
            
            </>
           ):
             (
                <>
                 <div className="flex items-center gap-4">
              <Link to="/login" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                Login
              </Link>
              <Link to="/signup" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
                Sign Up
              </Link>
               </div>
                </>
              )}
            
           
          </div>

          {/* Search Bar remains centered */}
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
            {['all', 'live', 'completed', 'upcoming'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${activeFilter === filter
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
        {loading ?  (
    <div className="min-h-screen flex  items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-xl">
      <Loader2 className="animate-spin h-10 w-10  text-orange-500" />
      <span className='text-3xl'>Loading Matches...</span>
    </div>
  ):
     ( <div className="container mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => {
              const winner = getWinner(match);
              return (
                <div key={match.id}  onClick={() => navigate(`/scorecard/${match.id}`) }className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20">
                  <div className="flex justify-between items-center mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                    {match.status === 'LIVE' && (
                      <div className="flex items-center space-x-2 text-orange-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm">{match.time}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className={`flex-1 text-center ${winner === 'team1' ? 'scale-105' : ''} transition-transform duration-300`}>
                      <div className="relative mb-3">
                        <img src={match.team1.photo} alt={match.team1.name} className={`w-20 h-20 rounded-full mx-auto object-cover border-4 ${winner === 'team1' ? 'border-yellow-400' : 'border-white/20'}`} />
                        {winner === 'team1' && <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}
                      </div>
                      <h3 className={`font-bold mb-2 ${winner === 'team1' ? 'text-yellow-400' : 'text-white'}`}>{match.team1.name}</h3>
                      <div className={`text-4xl font-bold ${winner === 'team1' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.status !== 'UPCOMING' ? match.team1.score : '-'}</div>
                    </div>

                    <div className="px-4">
                      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-2">
                        <span className="text-white font-bold text-sm">VS</span>
                      </div>
                    </div>

                    <div className={`flex-1 text-center ${winner === 'team2' ? 'scale-105' : ''} transition-transform duration-300`}>
                      <div className="relative mb-3">
                        <img src={match.team2.photo} alt={match.team2.name} className={`w-20 h-20 rounded-full mx-auto object-cover border-4 ${winner === 'team2' ? 'border-yellow-400' : 'border-white/20'}`} />
                        {winner === 'team2' && <Trophy className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 bg-slate-800 rounded-full p-1" />}
                      </div>
      
                      <h3 className={`font-bold mb-2 ${winner === 'team2' ? 'text-yellow-400' : 'text-white'}`}>{match.team2.name}</h3>
                      <div className={`text-4xl font-bold ${winner === 'team2' ? 'text-yellow-400' : 'text-orange-400'}`}>{match.status !== 'UPCOMING' ? match.team2.score : '-'}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center justify-center text-sm text-gray-300">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{match.venue}, {match.date}</span>
                    </div>
                    <div className="text-right text-gray-300 text-sm mt-1">
                      {`created by-${match.creatorName}`}
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
      </div>)}
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