import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Image as ImageIcon, Link as LinkIcon, Save, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPublication } from '../services/publications';
import { indexPublication } from '../services/search';
import { PublicationType } from '../types';

const typeOptions = [
  { value: 'app', label: 'Application', description: 'Application web ou mobile' },
  { value: 'api', label: 'API', description: 'Interface de programmation' },
  { value: 'program', label: 'Programme', description: 'Script ou outil CLI' },
  { value: 'tutorial', label: 'Tutoriel', description: 'Guide pas à pas' },
  { value: 'article', label: 'Article', description: 'Article technique' }
];

const Publish: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'app' as PublicationType,
    tags: [] as string[],
    categories: [] as string[],
    technologies: [] as string[],
    githubUrl: '',
    demoUrl: '',
    documentationUrl: '',
    version: '',
    license: '',
    coverImage: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour publier du contenu.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleAddTech = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, techInput.trim()]
      });
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter(t => t !== tech)
    });
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const searchKeywords = indexPublication(formData);
      const slug = generateSlug(formData.title);

      const publicationData = {
        ...formData,
        slug,
        authorId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Anonyme',
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        status: isDraft ? 'draft' as const : 'published' as const,
        searchKeywords,
        publishedAt: isDraft ? undefined : new Date()
      };

      const id = await createPublication(publicationData);
      navigate(`/publication/${slug}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle publication</h1>
          <p className="text-gray-500 mt-2">
            Partagez votre projet avec la communauté des développeurs ivoiriens
          </p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Type */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de publication
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: option.value as PublicationType })}
                  className={`p-3 rounded-lg border text-left ${
                    formData.type === option.value
                      ? 'border-bluesky-500 bg-bluesky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
              placeholder="Nom de votre projet"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description courte *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
              placeholder="Décrivez brièvement votre projet..."
              required
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu détaillé *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500 font-mono text-sm"
              placeholder="Détaillez votre projet (Markdown supporté)..."
              required
            />
          </div>

          {/* Technologies */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technologies utilisées
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                placeholder="React, Node.js, Python..."
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map(tech => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-3 py-1 bg-bluesky-50 text-bluesky-700 rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="ml-2 hover:text-bluesky-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                placeholder="Ajouter des tags..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Liens</h3>

            <div>
              <label className="block text-sm text-gray-600 mb-1">URL GitHub</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">URL Démo</label>
              <input
                type="url"
                value={formData.demoUrl}
                onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Image de couverture (URL)</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bluesky-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Brouillon
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-bluesky-500 text-white rounded-lg hover:bg-bluesky-600 disabled:opacity-50"
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Publish;
