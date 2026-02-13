import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from '../shared/providers/ThemeProvider';
import Layout from './Layout';
import '../index.css';

// Bolt: Extract loaders for prefetching
const loadHome = () => import('../features/home/HomePage');
const loadMediators = () => import('../features/mediators/MediatorsPage');
const loadResources = () => import('../features/resources/ResourcesPage');
const loadContact = () => import('../features/contact/ContactPage');

const Home = React.lazy(loadHome);
const Mediators = React.lazy(loadMediators);
const Resources = React.lazy(loadResources);
const Contact = React.lazy(loadContact);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <nav className="flex justify-center gap-4 mb-4">
            <Link to="/" onMouseEnter={loadHome} onFocus={loadHome}>Home</Link>
            <Link to="/mediators" onMouseEnter={loadMediators} onFocus={loadMediators}>Mediators</Link>
            <Link to="/resources" onMouseEnter={loadResources} onFocus={loadResources}>Resources</Link>
            <Link to="/contact" onMouseEnter={loadContact} onFocus={loadContact}>Contact</Link>
          </nav>
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mediators" element={<Mediators />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </React.Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
