import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Plus, BookOpen, Code, FileText, Cpu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-bluesky-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PublieDev</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher apps, APIs, tutoriels..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/explore" className="text-gray-600 hover:text-bluesky-500 px-3 py-2 text-sm font-medium">
              Explorer
            </Link>
            <Link to="/categories" className="text-gray-600 hover:text-bluesky-500 px-3 py-2 text-sm font-medium">
              Catégories
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/publish"
                  className="inline-flex items-center px-4 py-2 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Publier
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-bluesky-500">
                    <User className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 hidden group-hover:block">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mon profil
                    </Link>
                    <Link to="/my-publications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mes publications
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600 text-sm font-medium"
              >
                Connexion
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </form>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/explore"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <BookOpen className="w-5 h-5 text-bluesky-500" />
              <span>Explorer</span>
            </Link>
            <Link
              to="/apps"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <Cpu className="w-5 h-5 text-bluesky-500" />
              <span>Applications</span>
            </Link>
            <Link
              to="/apis"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <Code className="w-5 h-5 text-bluesky-500" />
              <span>APIs</span>
            </Link>
            <Link
              to="/tutorials"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <FileText className="w-5 h-5 text-bluesky-500" />
              <span>Tutoriels</span>
            </Link>

            <div className="border-t border-gray-100 pt-3">
              {currentUser ? (
                <>
                  <Link
                    to="/publish"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-bluesky-500 text-white rounded-lg"
                  >
                    Publier
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="mt-2 block w-full text-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 bg-bluesky-500 text-white rounded-lg"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
