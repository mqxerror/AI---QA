/**
 * DiscoveryStep Component
 * Auto-discover and select pages to test
 *
 * Task: P3.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscoveryStep = ({ data, updateData, goNext, goBack }) => {
  const [status, setStatus] = useState('idle'); // idle, running, complete, error
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [error, setError] = useState('');

  // Start discovery when component mounts
  useEffect(() => {
    if (status === 'idle' && data.website.url) {
      startDiscovery();
    }
  }, []);

  // Start page discovery
  const startDiscovery = useCallback(async () => {
    setStatus('running');
    setProgress(0);
    setError('');

    try {
      // First, register the website
      const registerResponse = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.website.url,
          name: data.website.name,
          type: data.website.type
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register website');
      }

      const { websiteId } = await registerResponse.json();
      updateData('websiteId', websiteId);

      // Start discovery via test-api
      const discoveryResponse = await fetch('/api/test/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.website.url,
          websiteId,
          maxDepth: 3,
          maxPages: 50
        })
      });

      if (!discoveryResponse.ok) {
        throw new Error('Discovery request failed');
      }

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/test/discover/status/${websiteId}`);
          const statusData = await statusResponse.json();

          setProgress(statusData.progress || 0);
          setPages(statusData.pages || []);

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setStatus('complete');
            setSelectedPages(statusData.pages.map(p => p.url));
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            setStatus('error');
            setError(statusData.error || 'Discovery failed');
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === 'running') {
          setStatus('error');
          setError('Discovery timed out');
        }
      }, 5 * 60 * 1000);

    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }, [data.website, updateData]);

  // Toggle page selection
  const togglePage = (pageUrl) => {
    setSelectedPages(prev =>
      prev.includes(pageUrl)
        ? prev.filter(u => u !== pageUrl)
        : [...prev, pageUrl]
    );
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map(p => p.url));
    }
  };

  // Continue to next step
  const handleContinue = () => {
    updateData('discovery', {
      pages,
      selectedPages,
      status: 'complete'
    });
    goNext();
  };

  // Retry discovery
  const handleRetry = () => {
    setStatus('idle');
    startDiscovery();
  };

  return (
    <div className="onboarding-step discovery-step">
      <motion.h2
        className="step-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Discovering Your Pages
      </motion.h2>

      <motion.p
        className="step-description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {status === 'running'
          ? 'We\'re crawling your website to find all testable pages...'
          : status === 'complete'
          ? `Found ${pages.length} pages. Select which ones to include in testing.`
          : status === 'error'
          ? 'There was a problem discovering pages.'
          : 'Starting page discovery...'}
      </motion.p>

      {/* Progress indicator */}
      {status === 'running' && (
        <motion.div
          className="discovery-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-stats">
            <span className="progress-percent">{progress}%</span>
            <span className="progress-pages">{pages.length} pages found</span>
          </div>
          <div className="discovery-animation">
            <span className="crawl-icon">🕷️</span>
            <span className="crawl-text">Crawling {data.website.url}...</span>
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <motion.div
          className="discovery-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={handleRetry}>
            Try Again
          </button>
        </motion.div>
      )}

      {/* Page list */}
      {status === 'complete' && pages.length > 0 && (
        <motion.div
          className="discovery-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="discovery-results__header">
            <button
              className="btn btn-text"
              onClick={toggleAll}
            >
              {selectedPages.length === pages.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="selection-count">
              {selectedPages.length} of {pages.length} selected
            </span>
          </div>

          <div className="discovery-results__list">
            <AnimatePresence>
              {pages.map((page, index) => (
                <motion.div
                  key={page.url}
                  className={`page-item ${selectedPages.includes(page.url) ? 'selected' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => togglePage(page.url)}
                >
                  <div className="page-item__checkbox">
                    {selectedPages.includes(page.url) ? '✓' : ''}
                  </div>
                  <div className="page-item__info">
                    <span className="page-item__title">
                      {page.title || page.url}
                    </span>
                    <span className="page-item__url">{page.url}</span>
                  </div>
                  <span className="page-item__type">{page.type || 'page'}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={goBack}
          disabled={status === 'running'}
        >
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={status !== 'complete' || selectedPages.length === 0}
        >
          Continue with {selectedPages.length} pages →
        </button>
      </div>
    </div>
  );
};

export default DiscoveryStep;
