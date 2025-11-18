import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-bluesky-500 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PublieDev</span>
            </Link>
            <p className="text-gray-400 max-w-md">
              La plateforme de référence pour découvrir et partager l'innovation technologique
              des développeurs ivoiriens. Applications, APIs, tutoriels et articles techniques.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-bluesky-400">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-bluesky-400">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-bluesky-400">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Explorer</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/apps" className="text-gray-400 hover:text-bluesky-400">
                  Applications
                </Link>
              </li>
              <li>
                <Link to="/apis" className="text-gray-400 hover:text-bluesky-400">
                  APIs
                </Link>
              </li>
              <li>
                <Link to="/tutorials" className="text-gray-400 hover:text-bluesky-400">
                  Tutoriels
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-gray-400 hover:text-bluesky-400">
                  Articles
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Ressources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-bluesky-400">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="text-gray-400 hover:text-bluesky-400">
                  Directives
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-bluesky-400">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-bluesky-400">
                  Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} PublieDev. Tous droits réservés.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0 flex items-center">
            Fait avec <Heart className="w-4 h-4 mx-1 text-red-500" /> en Côte d'Ivoire
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
