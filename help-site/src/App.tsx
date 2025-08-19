import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HelpLayout from './components/HelpLayout';
import HomePage from './pages/HomePage';
import TopicPage from './pages/TopicPage';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <HelpLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/help" element={<HomePage />} />
            <Route path="/help/:topic/*" element={<TopicPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </HelpLayout>
      </div>
    </Router>
  );
}

export default App;