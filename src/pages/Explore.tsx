import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Cpu, Code, FileText, BookOpen } from 'lucide-react';
import PublicationCard from '../components/Publication/PublicationCard';
import { getPublications, getPublicationsByType } from '../services/publications';
import { Publication, PublicationType } from '../types';

const categories = [
  { id: '', name: 'Tout', icon: Grid },
  { id: 'app', name: 'Applications', icon: Cpu },
  { id: 'api', name: 'APIs', icon: Code },
  { id: 'tutorial', name: 'Tutoriels', icon: BookOpen },
  { id: 'article', name: 'Articles', icon: FileText }
];

const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedType = searchParams.get('type') || '';
  const sortBy = searchParams.get('sort') || 'date';

  useEffect(() => {
    const fetchPublications = async () => {
      setLoading(true);
      try {
        if (selectedType) {
          const pubs = await getPublicationsByType(selectedType as PublicationType, 50);
          setPublications(pubs);
        } else {
          const { publications: pubs } = await getPublications({
            sortBy: sortBy as any,
            sortOrder: 'desc'
          });
          setPublications(pubs);
        }
      } catch (error) {
        console.error('Error fetching publications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, [selectedType, sortBy]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explorer</h1>
          <p className="text-gray-600">
            Découvrez les innovations technologiques des développeurs ivoiriens
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => updateFilter('type', category.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === category.id
                  ? 'bg-bluesky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {publications.length} publication{publications.length > 1 ? 's' : ''}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bluesky-500"
            >
              <option value="date">Plus récent</option>
              <option value="views">Plus vus</option>
              <option value="likes">Plus aimés</option>
            </select>
          </div>
        </div>

        {/* Publications Grid */}
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
        ) : publications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map(pub => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune publication
            </h2>
            <p className="text-gray-500 mb-6">
              {selectedType
                ? `Aucune publication de type "${categories.find(c => c.id === selectedType)?.name}" trouvée`
                : 'Soyez le premier à partager votre projet!'}
            </p>
            <Link
              to="/publish"
              className="inline-flex items-center px-6 py-3 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600"
            >
              Publier maintenant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
