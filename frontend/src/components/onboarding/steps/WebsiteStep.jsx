/**
 * WebsiteStep Component
 * Add website URL and details
 *
 * Task: P3.2
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const WEBSITE_TYPES = [
  {
    id: 'marketing',
    label: 'Marketing Site',
    description: 'Landing pages, blog, company website',
    icon: '📢'
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    description: 'Online store, product catalog, checkout',
    icon: '🛒'
  },
  {
    id: 'webapp',
    label: 'Web Application',
    description: 'SaaS, dashboard, user portal',
    icon: '💻'
  }
];

const WebsiteStep = ({ data, updateData, goNext, goBack }) => {
  const [url, setUrl] = useState(data.website.url || '');
  const [name, setName] = useState(data.website.name || '');
  const [type, setType] = useState(data.website.type || 'marketing');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  // Validate and normalize URL
  const normalizeUrl = (inputUrl) => {
    let normalized = inputUrl.trim();
    if (!normalized.match(/^https?:\/\//)) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  // Validate URL format and accessibility
  const validateUrl = useCallback(async (urlToValidate) => {
    setValidating(true);
    setError('');

    try {
      const normalizedUrl = normalizeUrl(urlToValidate);
      new URL(normalizedUrl); // Will throw if invalid

      // Try to fetch via our API
      const response = await fetch('/api/websites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Could not validate URL');
      }

      const result = await response.json();

      // Auto-fill name if not set
      if (!name && result.title) {
        setName(result.title);
      }

      return { valid: true, url: normalizedUrl };
    } catch (err) {
      return { valid: false, error: err.message };
    } finally {
      setValidating(false);
    }
  }, [name]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    const validation = await validateUrl(url);

    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    // Save to wizard data
    updateData('website', {
      url: validation.url,
      name: name || new URL(validation.url).hostname,
      type
    });

    goNext();
  };

  return (
    <div className="onboarding-step website-step">
      <motion.h2
        className="step-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Add Your Website
      </motion.h2>

      <motion.p
        className="step-description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Enter your website URL and we'll automatically discover all your pages.
      </motion.p>

      <motion.form
        className="website-step__form"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* URL Input */}
        <div className="form-group">
          <label htmlFor="website-url">Website URL</label>
          <div className="input-with-icon">
            <span className="input-icon">🌐</span>
            <input
              type="text"
              id="website-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={error ? 'error' : ''}
              disabled={validating}
            />
            {validating && <span className="input-loading">⏳</span>}
          </div>
          {error && <span className="error-message">{error}</span>}
        </div>

        {/* Name Input */}
        <div className="form-group">
          <label htmlFor="website-name">Display Name (optional)</label>
          <input
            type="text"
            id="website-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Website"
            disabled={validating}
          />
        </div>

        {/* Website Type Selection */}
        <div className="form-group">
          <label>Website Type</label>
          <div className="website-type-grid">
            {WEBSITE_TYPES.map((typeOption) => (
              <button
                key={typeOption.id}
                type="button"
                className={`website-type-card ${type === typeOption.id ? 'selected' : ''}`}
                onClick={() => setType(typeOption.id)}
                disabled={validating}
              >
                <span className="website-type-icon">{typeOption.icon}</span>
                <span className="website-type-label">{typeOption.label}</span>
                <span className="website-type-desc">{typeOption.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="step-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goBack}
            disabled={validating}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={validating || !url}
          >
            {validating ? 'Validating...' : 'Continue →'}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default WebsiteStep;
