/**
 * WelcomeStep Component
 * First step of onboarding - welcome message
 *
 * Task: P3.1
 */

import React from 'react';
import { motion } from 'framer-motion';

const WelcomeStep = ({ goNext, onSkip }) => {
  return (
    <div className="onboarding-step welcome-step">
      <motion.div
        className="welcome-step__icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        🚀
      </motion.div>

      <motion.h1
        className="welcome-step__title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome to QA Testing Agent
      </motion.h1>

      <motion.p
        className="welcome-step__description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Let's set up automated testing for your website in just a few minutes.
        We'll help you discover pages, run initial tests, and set up a testing schedule.
      </motion.p>

      <motion.div
        className="welcome-step__features"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="feature-item">
          <span className="feature-icon">🔍</span>
          <div className="feature-text">
            <strong>Auto-Discovery</strong>
            <span>We'll automatically find all your pages</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">⚡</span>
          <div className="feature-text">
            <strong>Performance Testing</strong>
            <span>Lighthouse audits for speed & SEO</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎨</span>
          <div className="feature-text">
            <strong>Visual Regression</strong>
            <span>Catch UI changes automatically</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🤖</span>
          <div className="feature-text">
            <strong>AI Self-Healing</strong>
            <span>Tests that fix themselves</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="welcome-step__actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button className="btn btn-primary btn-lg" onClick={goNext}>
          Let's Get Started
          <span className="btn-arrow">→</span>
        </button>
      </motion.div>
    </div>
  );
};

export default WelcomeStep;
