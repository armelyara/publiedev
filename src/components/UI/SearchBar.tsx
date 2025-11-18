import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import { getSuggestions } from '../../services/search';

interface SearchBarProps {
  large?: boolean;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  large = false,
  placeholder = "Rechercher applications, APIs, tutoriels...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const results = await getSuggestions(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSearch(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bluesky-500 focus:border-transparent ${
            large
              ? 'pl-12 pr-12 py-4 text-lg'
              : 'pl-10 pr-10 py-3'
          }`}
        />
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${large ? 'w-6 h-6' : 'w-5 h-5'}`}
          >
            <X className="w-full h-full" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSearch(suggestion)}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-bluesky-50' : ''
              }`}
            >
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
