import { Link } from 'react-router-dom';
import { Home, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  // Mock auth state for UI development
  const isAuthenticated = false; 

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
              <Link to="/dashboard" className="text-gray-600 hover:text-primary flex items-center gap-1 transition-colors">
                <UserIcon size={20} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
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
