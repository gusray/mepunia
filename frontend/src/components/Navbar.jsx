import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User as UserIcon, LogOut } from 'lucide-react';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
    // Listen for storage events (when logging in from another tab or component)
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="font-bold text-xl text-dark">Mepunia</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-primary flex items-center gap-1 transition-colors">
              <Home size={20} />
              <span className="hidden sm:inline">Beranda</span>
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-gray-600 hover:text-primary flex items-center gap-1 transition-colors">
                  <UserIcon size={20} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors ml-2">
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 rounded-md text-primary font-medium hover:bg-orange-50 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-md bg-primary text-white font-medium hover:bg-orange-600 shadow-sm transition-colors">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
