import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Cpu, FileText, BookOpen, Sparkles, TrendingUp, Clock } from 'lucide-react';
import SearchBar from '../components/UI/SearchBar';
import PublicationCard from '../components/Publication/PublicationCard';
import { getRecentPublications, getTrendingPublications } from '../services/publications';
import { Publication } from '../types';

const categories = [
  { name: 'Applications', icon: Cpu, color: 'bg-purple-500', href: '/apps' },
  { name: 'APIs', icon: Code, color: 'bg-blue-500', href: '/apis' },
  { name: 'Tutoriels', icon: BookOpen, color: 'bg-orange-500', href: '/tutorials' },
  { name: 'Articles', icon: FileText, color: 'bg-pink-500', href: '/articles' }
];

const Home: React.FC = () => {
  const [recentPublications, setRecentPublications] = useState<Publication[]>([]);
  const [trendingPublications, setTrendingPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const [recent, trending] = await Promise.all([
          getRecentPublications(6),
          getTrendingPublications(4)
        ]);
        setRecentPublications(recent);
        setTrendingPublications(trending);
      } catch (error) {
        console.error('Error fetching publications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-bluesky-500 via-bluesky-600 to-bluesky-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              L'innovation tech<br />
              <span className="text-bluesky-200">Made in Côte d'Ivoire</span>
            </h1>
            <p className="text-xl text-bluesky-100 mb-8">
              Découvrez et partagez les applications, APIs et ressources techniques
              créées par les développeurs ivoiriens.
            </p>
            <SearchBar large className="max-w-xl mx-auto" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-bluesky-200">Populaire:</span>
              <Link to="/search?q=mobile" className="text-sm bg-white/10 px-3 py-1 rounded-full hover:bg-white/20">
                Mobile
              </Link>
              <Link to="/search?q=fintech" className="text-sm bg-white/10 px-3 py-1 rounded-full hover:bg-white/20">
                Fintech
              </Link>
              <Link to="/search?q=react" className="text-sm bg-white/10 px-3 py-1 rounded-full hover:bg-white/20">
                React
              </Link>
              <Link to="/search?q=api" className="text-sm bg-white/10 px-3 py-1 rounded-full hover:bg-white/20">
                API REST
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => (
              <Link
                key={category.name}
                to={category.href}
                className="flex flex-col items-center p-6 rounded-xl border border-gray-100 hover:border-bluesky-200 hover:shadow-md transition-all"
              >
                <div className={`${category.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-900">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Publications */}
      {trendingPublications.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-bluesky-500" />
                <h2 className="text-2xl font-bold text-gray-900">Tendances</h2>
              </div>
              <Link
                to="/explore?sort=trending"
                className="text-bluesky-500 hover:text-bluesky-600 flex items-center text-sm font-medium"
              >
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingPublications.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Publications */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-bluesky-500" />
              <h2 className="text-2xl font-bold text-gray-900">Publications récentes</h2>
            </div>
            <Link
              to="/explore"
              className="text-bluesky-500 hover:text-bluesky-600 flex items-center text-sm font-medium"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

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
          ) : recentPublications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPublications.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Soyez le premier à publier!
              </h3>
              <p className="text-gray-500 mb-6">
                Partagez votre projet avec la communauté des développeurs ivoiriens.
              </p>
              <Link
                to="/publish"
                className="inline-flex items-center px-6 py-3 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600"
              >
                Publier maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-bluesky-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Partagez votre innovation
          </h2>
          <p className="text-xl text-bluesky-100 mb-8">
            Rejoignez la communauté et contribuez à la base de données de l'innovation technologique ivoirienne.
          </p>
          <Link
            to="/publish"
            className="inline-flex items-center px-8 py-4 bg-white text-bluesky-600 rounded-lg font-semibold hover:bg-bluesky-50 transition-colors"
          >
            Commencer à publier
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
