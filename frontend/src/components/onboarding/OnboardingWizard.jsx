/**
 * OnboardingWizard Component
 * Multi-step wizard for new client onboarding
 *
 * Task: P3.1, P3.2, P3.3
 * Owner: Patricia (Product Manager)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WelcomeStep from './steps/WelcomeStep';
import WebsiteStep from './steps/WebsiteStep';
import DiscoveryStep from './steps/DiscoveryStep';
import ScheduleStep from './steps/ScheduleStep';
import CompleteStep from './steps/CompleteStep';
import './OnboardingWizard.css';

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'website', title: 'Add Website', component: WebsiteStep },
  { id: 'discovery', title: 'Discover Pages', component: DiscoveryStep },
  { id: 'schedule', title: 'Set Schedule', component: ScheduleStep },
  { id: 'complete', title: 'All Set!', component: CompleteStep }
];

const OnboardingWizard = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    website: {
      url: '',
      name: '',
      type: 'marketing' // marketing, ecommerce, webapp
    },
    discovery: {
      pages: [],
      selectedPages: [],
      status: 'idle' // idle, running, complete, error
    },
    schedule: {
      smoke: { enabled: true, frequency: 'daily' },
      lighthouse: { enabled: true, frequency: 'daily' },
      visualRegression: { enabled: true, frequency: 'weekly' },
      discovery: { enabled: true, frequency: 'monthly' }
    },
    websiteId: null
  });

  // Update wizard data from steps
  const updateData = useCallback((key, value) => {
    setWizardData(prev => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value
    }));
  }, []);

  // Navigation handlers
  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  // Complete onboarding
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete(wizardData);
    }
    navigate('/dashboard');
  }, [onComplete, wizardData, navigate]);

  // Skip onboarding
  const handleSkip = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="onboarding-wizard">
      {/* Progress Bar */}
      <div className="onboarding-wizard__progress">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`onboarding-wizard__progress-step ${
              index === currentStep ? 'active' : ''
            } ${index < currentStep ? 'completed' : ''}`}
            onClick={() => index < currentStep && goToStep(index)}
          >
            <div className="progress-step__indicator">
              {index < currentStep ? (
                <span className="progress-step__check">✓</span>
              ) : (
                <span className="progress-step__number">{index + 1}</span>
              )}
            </div>
            <span className="progress-step__title">{step.title}</span>
          </div>
        ))}
        <div
          className="onboarding-wizard__progress-bar"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="onboarding-wizard__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="onboarding-wizard__step"
          >
            <CurrentStepComponent
              data={wizardData}
              updateData={updateData}
              goNext={goNext}
              goBack={goBack}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              onComplete={handleComplete}
              onSkip={handleSkip}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip Link (only on first steps) */}
      {currentStep < 2 && (
        <button
          className="onboarding-wizard__skip"
          onClick={handleSkip}
        >
          Skip setup for now
        </button>
      )}
    </div>
  );
};

export default OnboardingWizard;
