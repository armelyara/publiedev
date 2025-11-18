import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, SlidersHorizontal } from 'lucide-react';
import PublicationCard from '../components/Publication/PublicationCard';
import { advancedSearch } from '../services/search';
import { SearchResult, PublicationType, SearchFilters } from '../types';

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'app', label: 'Applications' },
  { value: 'api', label: 'APIs' },
  { value: 'program', label: 'Programmes' },
  { value: 'tutorial', label: 'Tutoriels' },
  { value: 'article', label: 'Articles' }
];

const sortOptions = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'date', label: 'Plus récent' },
  { value: 'views', label: 'Plus vus' },
  { value: 'likes', label: 'Plus aimés' }
];

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const sortBy = searchParams.get('sort') || 'relevance';

  useEffect(() => {
    const performSearch = async () => {
      if (!query && !type) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const filters: SearchFilters = {
          query,
          type: type as PublicationType || undefined,
          sortBy: sortBy as SearchFilters['sortBy'],
          sortOrder: 'desc'
        };

        const searchResults = await advancedSearch(filters);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, type, sortBy]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({ q: query });
  };

  const hasActiveFilters = type || sortBy !== 'relevance';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {query ? `Résultats pour "${query}"` : 'Explorer'}
            </h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                showFilters || hasActiveFilters
                  ? 'bg-bluesky-100 text-bluesky-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 bg-bluesky-500 text-white rounded-full text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 py-4 border-t">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => updateFilter('type', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 mt-5"
                >
                  <X className="w-4 h-4 mr-1" />
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(result => (
                <PublicationCard
                  key={result.publication.id}
                  publication={result.publication}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun résultat trouvé
            </h2>
            <p className="text-gray-500 mb-6">
              {query
                ? `Aucune publication ne correspond à "${query}"`
                : 'Commencez par effectuer une recherche'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-400">Suggestions:</span>
              {['React', 'Flutter', 'Node.js', 'API REST'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setSearchParams({ q: suggestion })}
                  className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
