import { useState, useEffect } from 'react';
import { X, ArrowRight, Check, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const tourSteps: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to DataFlow! 🎉',
    content: 'Your powerful analytics platform is ready! Let\'s take a quick tour of the amazing features.',
    placement: 'bottom',
  },
  {
    target: '.hamburger-menu',
    title: 'Navigation Menu',
    content: 'Access all pages from this menu. Click it to open the sidebar and explore your dashboard, scrapers, queries, and more.',
    placement: 'right',
  },
  {
    target: 'body',
    title: 'Command Palette (⌘K)',
    content: 'Press ⌘K (or Ctrl+K) anywhere to instantly search and navigate. This is your superpower for speed!',
    placement: 'bottom',
  },
  {
    target: 'body',
    title: 'Keyboard Shortcuts',
    content: 'Press ? anytime to see all available shortcuts. Navigate faster with keyboard commands!',
    placement: 'bottom',
  },
  {
    target: '.notification-bell',
    title: 'Notifications',
    content: 'Stay updated with real-time notifications. The pulsing badge shows unread items.',
    placement: 'left',
  },
  {
    target: 'body',
    title: 'You\'re All Set! 🚀',
    content: 'Start exploring your data! Create scrapers, run queries, and analyze insights. Have fun!',
    placement: 'bottom',
  },
];

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const seen = localStorage.getItem('dataflow-tour-completed');
    if (!seen) {
      // Start tour after a short delay
      setTimeout(() => setIsActive(true), 1000);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem('dataflow-tour-completed', 'true');
    setHasSeenTour(true);
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('dataflow-tour-completed', 'true');
    setHasSeenTour(true);
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    // Show "Restart Tour" button in corner if they've completed it
    if (hasSeenTour) {
      return (
        <button
          onClick={restartTour}
          className="fixed bottom-4 right-4 z-[90] px-4 py-2 bg-[#FFD700] text-[#0D0D0D] rounded-lg font-semibold hover:bg-[#E6C200] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Restart Tour
        </button>
      );
    }
    return null;
  }

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] animate-in fade-in duration-300" />

      {/* Spotlight effect */}
      <div className="fixed inset-0 z-[96] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
      </div>

      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[97] px-4 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#0D0D0D]/98 border-2 border-[#FFD700]/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Progress bar */}
          <div className="h-1 bg-[#3B2F2F]">
            <div
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#E6C200] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step counter */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#FFD700] text-sm font-semibold">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <button
                onClick={skipTour}
                className="text-[#F5F5DC]/50 hover:text-[#F5F5DC] text-sm transition-colors"
              >
                Skip tour
              </button>
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-[#FFD700]/20 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-[#FFD700]" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[#F5F5DC] mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-[#F5F5DC]/80 mb-6 leading-relaxed">
              {step.content}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              {currentStep > 0 ? (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 border border-[#FFD700]/30 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/10 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#FFD700] text-[#0D0D0D] rounded-lg font-semibold hover:bg-[#E6C200] transition-colors flex items-center gap-2 group"
              >
                {currentStep < tourSteps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Get Started
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step indicators */}
          <div className="px-6 pb-4 flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-[#FFD700]' : 'bg-[#3B2F2F]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Quick tour launcher button
export function TourLauncher() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('dataflow-tour-completed');
    setShow(!!completed);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        localStorage.removeItem('dataflow-tour-completed');
        window.location.reload();
      }}
      className="fixed bottom-4 right-4 z-[90] px-4 py-2 bg-[#FFD700] text-[#0D0D0D] rounded-lg font-semibold hover:bg-[#E6C200] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
      title="Restart the onboarding tour"
    >
      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">Take Tour</span>
    </button>
  );
}
