import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import PublicationDetail from './pages/PublicationDetail';
import Publish from './pages/Publish';
import Login from './pages/Login';
import Register from './pages/Register';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth pages without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main pages with layout */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/apps" element={<Explore />} />
                    <Route path="/apis" element={<Explore />} />
                    <Route path="/tutorials" element={<Explore />} />
                    <Route path="/articles" element={<Explore />} />
                    <Route path="/categories" element={<Explore />} />
                    <Route path="/publication/:slug" element={<PublicationDetail />} />
                    <Route path="/publish" element={<Publish />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
