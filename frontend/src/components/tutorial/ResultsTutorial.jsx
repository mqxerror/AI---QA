/**
 * Results Tutorial / Guided Tour Component
 * Provides interactive walkthrough of the test results interface
 *
 * Task: P3.4
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, X, ChevronRight, ChevronLeft, CheckCircle2,
  BarChart3, FileText, Play, Download, Settings, Eye
} from 'lucide-react';
import './ResultsTutorial.css';

// Tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Test Results',
    content: 'This guided tour will help you understand how to read and use your test results effectively.',
    target: null,
    icon: HelpCircle,
    position: 'center'
  },
  {
    id: 'overview',
    title: 'Results Overview',
    content: 'The overview tab shows your test summary including pass rate, total tests, and key metrics at a glance.',
    target: '[data-tutorial="overview-tab"]',
    icon: BarChart3,
    position: 'bottom'
  },
  {
    id: 'scores',
    title: 'Understanding Scores',
    content: 'Green (90+) is excellent, Orange (50-89) needs attention, Red (<50) requires immediate action. These thresholds help prioritize fixes.',
    target: '[data-tutorial="score-display"]',
    icon: Eye,
    position: 'right'
  },
  {
    id: 'details',
    title: 'Detailed Results',
    content: 'Click on any test to see detailed information including screenshots, error messages, and performance metrics.',
    target: '[data-tutorial="results-list"]',
    icon: FileText,
    position: 'left'
  },
  {
    id: 'actions',
    title: 'Quick Actions',
    content: 'Re-run tests, export reports, or compare with previous runs using the action buttons at the top.',
    target: '[data-tutorial="action-buttons"]',
    icon: Play,
    position: 'bottom'
  },
  {
    id: 'export',
    title: 'Export Reports',
    content: 'Generate PDF or JSON reports to share with your team or archive for compliance purposes.',
    target: '[data-tutorial="export-button"]',
    icon: Download,
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    content: 'You now know how to navigate test results. You can restart this tour anytime from the help menu.',
    target: null,
    icon: CheckCircle2,
    position: 'center'
  }
];

// Tooltip component for highlighting elements
function TutorialTooltip({ step, onNext, onPrev, onSkip, currentStep, totalSteps }) {
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCentered = step.position === 'center';

  return (
    <motion.div
      className={`tutorial-tooltip ${step.position} ${isCentered ? 'centered' : ''}`}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="tutorial-tooltip-header">
        <div className="tutorial-tooltip-icon">
          <Icon size={20} />
        </div>
        <h3 className="tutorial-tooltip-title">{step.title}</h3>
        <button className="tutorial-close-btn" onClick={onSkip} aria-label="Close tutorial">
          <X size={16} />
        </button>
      </div>

      <p className="tutorial-tooltip-content">{step.content}</p>

      <div className="tutorial-tooltip-footer">
        <div className="tutorial-progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`tutorial-progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-nav-buttons">
          {!isFirst && (
            <button className="tutorial-nav-btn prev" onClick={onPrev}>
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <button className="tutorial-nav-btn next" onClick={onNext}>
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <button className="tutorial-skip-link" onClick={onSkip}>
        Skip tutorial
      </button>
    </motion.div>
  );
}

// Spotlight overlay for highlighting elements
function SpotlightOverlay({ targetSelector }) {
  const [spotlightStyle, setSpotlightStyle] = useState(null);

  useEffect(() => {
    if (!targetSelector) {
      setSpotlightStyle(null);
      return;
    }

    const updateSpotlight = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setSpotlightStyle({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2
        });
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [targetSelector]);

  if (!spotlightStyle) return null;

  return (
    <div className="tutorial-spotlight" style={spotlightStyle}>
      <div className="tutorial-spotlight-pulse" />
    </div>
  );
}

// Main Tutorial Component
export function ResultsTutorial({ onComplete, autoStart = false }) {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Check localStorage for tutorial completion
  useEffect(() => {
    const seen = localStorage.getItem('qa-results-tutorial-completed');
    setHasSeenTutorial(seen === 'true');
    if (!seen && autoStart) {
      setIsActive(true);
    }
  }, [autoStart]);

  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('qa-results-tutorial-completed', 'true');
    setHasSeenTutorial(true);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem('qa-results-tutorial-completed');
    setHasSeenTutorial(false);
    startTutorial();
  }, [startTutorial]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handlePrev, handleSkip]);

  return (
    <>
      {/* Tutorial trigger button */}
      <button
        className="tutorial-trigger-btn"
        onClick={startTutorial}
        title="Start guided tour"
      >
        <HelpCircle size={18} />
        <span>Tour</span>
      </button>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              className="tutorial-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSkip}
            />

            <SpotlightOverlay targetSelector={step.target} />

            <TutorialTooltip
              step={step}
              onNext={handleNext}
              onPrev={handlePrev}
              onSkip={handleSkip}
              currentStep={currentStep}
              totalSteps={TUTORIAL_STEPS.length}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook for tutorial state management
export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  const startTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const endTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem('qa-results-tutorial-completed');
    startTutorial();
  }, [startTutorial]);

  return {
    showTutorial,
    startTutorial,
    endTutorial,
    resetTutorial
  };
}

export default ResultsTutorial;
