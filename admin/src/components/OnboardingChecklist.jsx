import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Package,
  Key,
  Mail,
  Settings,
  FileText,
  Tag,
  TestTube,
  Send
} from 'lucide-react';

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [congratulationShown, setCongratulationShown] = useState(false);

  const steps = [
    {
      id: 'import_products',
      title: 'Import Products',
      description: 'Sync your digital products from Shopify',
      icon: Package,
      link: '/products',
      autoComplete: false
    },
    {
      id: 'add_licenses',
      title: 'Add License Keys',
      description: 'Upload license keys via CSV or manually',
      icon: Key,
      link: '/products',
      autoComplete: false
    },
    {
      id: 'sender_name',
      title: 'Configure Sender Name',
      description: 'Set the "From" name for your emails',
      icon: Send,
      link: '/settings',
      autoComplete: false
    },
    {
      id: 'reply_email',
      title: 'Set Reply-To Email',
      description: 'Configure where customer replies go',
      icon: Mail,
      link: '/settings',
      autoComplete: false
    },
    {
      id: 'review_template',
      title: 'Review Email Template',
      description: 'Check your default license email design',
      icon: FileText,
      link: '/templates',
      autoComplete: false
    },
    {
      id: 'template_rules',
      title: 'Setup Template Rules (Optional)',
      description: 'Assign templates by product tags or vendor',
      icon: Tag,
      link: '/template-rules',
      autoComplete: false
    },
    {
      id: 'system_settings',
      title: 'Configure System Settings',
      description: 'Review email delivery and automation settings',
      icon: Settings,
      link: '/settings',
      autoComplete: false
    },
    {
      id: 'test_order',
      title: 'Test License Delivery (Optional)',
      description: 'Place a test order to verify everything works',
      icon: TestTube,
      link: '/orders',
      autoComplete: false
    }
  ];

  // Load completed steps from localStorage on mount
  useEffect(() => {
    // Check for force reset URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const forceReset = urlParams.get('reset_onboarding') === 'true';

    if (forceReset) {
      localStorage.removeItem('onboarding_checklist_steps');
      localStorage.removeItem('onboarding_checklist_dismissed');
      localStorage.removeItem('onboarding_checklist_congratulated');
      localStorage.removeItem('onboarding_checklist_minimized');
      setCompletedSteps(new Set());
      setIsVisible(true);
      setIsMinimized(false);
      setCongratulationShown(false);
      return;
    }

    const savedSteps = localStorage.getItem('onboarding_checklist_steps');
    const dismissed = localStorage.getItem('onboarding_checklist_dismissed');
    const congratulated = localStorage.getItem('onboarding_checklist_congratulated');
    const minimized = localStorage.getItem('onboarding_checklist_minimized');

    if (dismissed === 'true') {
      setIsVisible(false);
    }

    if (savedSteps) {
      setCompletedSteps(new Set(JSON.parse(savedSteps)));
    }

    if (congratulated === 'true') {
      setCongratulationShown(true);
    }

    if (minimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('onboarding_checklist_steps', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const toggleMinimize = () => {
    // If currently expanded and user is minimizing, offer to close permanently
    if (!isMinimized) {
      const choice = window.confirm('Close this checklist?\n\nOK = Close permanently\nCancel = Just minimize');

      if (choice) {
        // User clicked OK - close permanently
        localStorage.setItem('onboarding_checklist_dismissed', 'true');
        setIsVisible(false);
      } else {
        // User clicked Cancel - just minimize
        setIsMinimized(true);
        localStorage.setItem('onboarding_checklist_minimized', 'true');
      }
    } else {
      // If currently minimized, just expand it
      setIsMinimized(false);
      localStorage.setItem('onboarding_checklist_minimized', 'false');
    }
  };

  const handleDismiss = (e) => {
    // Prevent any event bubbling that might interfere in embedded context
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Dismiss immediately without confirmation for better mobile experience
    localStorage.setItem('onboarding_checklist_dismissed', 'true');
    setIsVisible(false);
  };

  const goToStep = (step) => {
    if (step.link) {
      navigate(step.link);
    }
  };

  // Auto-hide when all required steps are complete
  const requiredSteps = steps.filter(s => !s.title.includes('Optional'));
  const requiredCompleted = requiredSteps.filter(s => completedSteps.has(s.id)).length;
  const allRequiredComplete = requiredCompleted === requiredSteps.length;

  useEffect(() => {
    if (allRequiredComplete && completedSteps.size >= 5 && !congratulationShown) {
      // Show congratulations after a brief delay
      const timer = setTimeout(() => {
        // Mark as shown immediately to prevent re-showing
        setCongratulationShown(true);
        localStorage.setItem('onboarding_checklist_congratulated', 'true');

        if (window.confirm('🎉 Congratulations! You\'ve completed the essential setup steps. Would you like to close this checklist?')) {
          localStorage.setItem('onboarding_checklist_dismissed', 'true');
          setIsVisible(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allRequiredComplete, completedSteps.size, congratulationShown]);

  if (!isVisible) return null;

  const progress = (completedSteps.size / steps.length) * 100;
  const completedCount = completedSteps.size;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-40 sm:w-96 max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 sm:p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Setup Checklist</span>
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0 pr-1">
            <button
              onClick={toggleMinimize}
              className="text-white hover:bg-white/20 rounded p-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center relative z-50"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isMinimized ? <ChevronUp className="w-5 h-5 pointer-events-none" /> : <ChevronDown className="w-5 h-5 pointer-events-none" />}
            </button>
            <button
              onClick={handleDismiss}
              onTouchEnd={handleDismiss}
              type="button"
              className="text-white hover:bg-white/20 rounded p-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center relative z-50"
              aria-label="Close permanently"
              style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
            <span className="flex-shrink-0">{completedCount} of {steps.length} completed</span>
            <span className="flex-shrink-0">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      {!isMinimized && (
        <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-green-300 ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => goToStep(step)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(step.id);
                    }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-green-500" />
                    )}
                  </button>

                  {/* Icon */}
                  <div className={`flex-shrink-0 mt-0.5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer tip when minimized */}
      {isMinimized && (
        <div className="p-3 text-center text-xs text-gray-500 border-t">
          Click to expand checklist
        </div>
      )}
    </div>
  );
}
