import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Eye, Heart, Bookmark, Share2, Github, ExternalLink, Calendar,
  User, Tag, Code, ChevronLeft, Copy, Check
} from 'lucide-react';
import { getPublicationBySlug, incrementViews } from '../services/publications';
import { getRelatedPublications } from '../services/search';
import { Publication } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PublicationCard from '../components/Publication/PublicationCard';

const PublicationDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [related, setRelated] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPublication = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        const pub = await getPublicationBySlug(slug);
        if (pub) {
          setPublication(pub);
          await incrementViews(pub.id);

          // Fetch related publications
          const relatedPubs = await getRelatedPublications(pub, 3);
          setRelated(relatedPubs);
        }
      } catch (error) {
        console.error('Error fetching publication:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublication();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Publication non trouvée</h1>
          <Link to="/" className="text-bluesky-500 hover:text-bluesky-600">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/explore"
            className="inline-flex items-center text-gray-600 hover:text-bluesky-500"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour à l'exploration
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {publication.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              {publication.authorPhoto ? (
                <img
                  src={publication.authorPhoto}
                  alt={publication.authorName}
                  className="w-8 h-8 rounded-full mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-bluesky-100 flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-bluesky-600" />
                </div>
              )}
              <span className="font-medium text-gray-900">{publication.authorName}</span>
            </div>

            {publication.publishedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(publication.publishedAt), "d MMMM yyyy", { locale: fr })}
              </div>
            )}

            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {publication.views} vues
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center px-4 py-2 bg-bluesky-50 text-bluesky-600 rounded-lg hover:bg-bluesky-100">
              <Heart className="w-4 h-4 mr-2" />
              {publication.likes}
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              <Bookmark className="w-4 h-4 mr-2" />
              Sauvegarder
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Copié!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </>
              )}
            </button>

            {publication.githubUrl && (
              <a
                href={publication.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            )}

            {publication.demoUrl && (
              <a
                href={publication.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Démo
              </a>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {publication.coverImage && (
          <div className="mb-8">
            <img
              src={publication.coverImage}
              alt={publication.title}
              className="w-full rounded-xl"
            />
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed">{publication.description}</p>
        </div>

        {/* Technologies */}
        {publication.technologies && publication.technologies.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Technologies
            </h2>
            <div className="flex flex-wrap gap-2">
              {publication.technologies.map(tech => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-bluesky-50 text-bluesky-700 rounded-lg text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: publication.content }}
          />
        </div>

        {/* Tags */}
        {publication.tags && publication.tags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center flex-wrap gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {publication.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Publications */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Publications similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(pub => (
                <PublicationCard key={pub.id} publication={pub} compact />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default PublicationDetail;
