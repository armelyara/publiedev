import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Bookmark, ExternalLink, Github, Code, FileText, BookOpen, Cpu } from 'lucide-react';
import { Publication } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublicationCardProps {
  publication: Publication;
  compact?: boolean;
}

const typeIcons = {
  app: Cpu,
  api: Code,
  program: Code,
  tutorial: BookOpen,
  article: FileText
};

const typeLabels = {
  app: 'Application',
  api: 'API',
  program: 'Programme',
  tutorial: 'Tutoriel',
  article: 'Article'
};

const typeColors = {
  app: 'bg-purple-100 text-purple-700',
  api: 'bg-blue-100 text-blue-700',
  program: 'bg-green-100 text-green-700',
  tutorial: 'bg-orange-100 text-orange-700',
  article: 'bg-pink-100 text-pink-700'
};

const PublicationCard: React.FC<PublicationCardProps> = ({ publication, compact = false }) => {
  const TypeIcon = typeIcons[publication.type];
  const publishedDate = publication.publishedAt
    ? formatDistanceToNow(new Date(publication.publishedAt), { addSuffix: true, locale: fr })
    : 'Récemment';

  if (compact) {
    return (
      <Link
        to={`/publication/${publication.slug}`}
        className="block p-4 bg-white rounded-lg border border-gray-100 hover:border-bluesky-200 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[publication.type]}`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeLabels[publication.type]}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{publication.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{publication.authorName}</p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {publication.views}
            </span>
            <span className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {publication.likes}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="bg-white rounded-xl border border-gray-100 hover:border-bluesky-200 hover:shadow-lg transition-all overflow-hidden">
      {publication.coverImage && (
        <Link to={`/publication/${publication.slug}`}>
          <img
            src={publication.coverImage}
            alt={publication.title}
            className="w-full h-48 object-cover"
          />
        </Link>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[publication.type]}`}>
            <TypeIcon className="w-3.5 h-3.5 mr-1" />
            {typeLabels[publication.type]}
          </span>
          <span className="text-xs text-gray-400">{publishedDate}</span>
        </div>

        <Link to={`/publication/${publication.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 hover:text-bluesky-500 mb-2 line-clamp-2">
            {publication.title}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {publication.description}
        </p>

        {publication.technologies && publication.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {publication.technologies.slice(0, 4).map(tech => (
              <span
                key={tech}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tech}
              </span>
            ))}
            {publication.technologies.length > 4 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{publication.technologies.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {publication.authorPhoto ? (
              <img
                src={publication.authorPhoto}
                alt={publication.authorName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-bluesky-100 flex items-center justify-center">
                <span className="text-xs font-medium text-bluesky-600">
                  {publication.authorName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">{publication.authorName}</span>
          </div>

          <div className="flex items-center space-x-4 text-gray-400">
            <span className="flex items-center text-sm">
              <Eye className="w-4 h-4 mr-1" />
              {publication.views}
            </span>
            <span className="flex items-center text-sm">
              <Heart className="w-4 h-4 mr-1" />
              {publication.likes}
            </span>
            {publication.githubUrl && (
              <a
                href={publication.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-bluesky-500"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {publication.demoUrl && (
              <a
                href={publication.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-bluesky-500"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PublicationCard;
