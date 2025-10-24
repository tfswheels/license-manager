import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Package, Key, Sparkles, ArrowRight, X } from 'lucide-react';

export default function WelcomeOnboarding({ onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    {
      title: 'Welcome to DigiKey HQ!',
      description: 'Automate license key delivery for your digital products. Let\'s get you set up in 3 easy steps.',
      icon: Sparkles,
      action: null,
      buttonText: 'Get Started'
    },
    {
      title: 'Import Your Products',
      description: 'Sync your digital products from Shopify. This helps us know which products need license keys.',
      icon: Package,
      action: () => navigate('/products'),
      buttonText: 'Import Products',
      skipText: 'I\'ll do this later'
    },
    {
      title: 'Add License Keys',
      description: 'Upload license keys via CSV or add them individually. You can add more anytime.',
      icon: Key,
      action: () => navigate('/products'),
      buttonText: 'Add Licenses',
      skipText: 'I\'ll do this later'
    },
    {
      title: 'You\'re All Set!',
      description: 'Your store is ready to automatically deliver license keys when customers place orders.',
      icon: CheckCircle,
      action: () => navigate('/'),
      buttonText: 'Go to Dashboard'
    }
  ];

  const handleNext = () => {
    const step = steps[currentStep];

    if (currentStep === steps.length - 1) {
      // Last step - mark onboarding complete
      localStorage.setItem('onboarding_completed', 'true');
      if (onComplete) onComplete();
      if (step.action) step.action();
    } else {
      // Mark current step as complete and move to next
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (step.action) {
        // If step has an action, execute it and mark onboarding complete
        localStorage.setItem('onboarding_completed', 'true');
        if (onComplete) onComplete();
        step.action();
      } else {
        // Just move to next step
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
    navigate('/');
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 relative">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-3 mb-8">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              {completedSteps.has(index) ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : index === currentStep ? (
                <Circle className="w-6 h-6 text-blue-600 fill-blue-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-6">
            <Icon className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
          >
            {step.buttonText}
            <ArrowRight className="w-5 h-5" />
          </button>

          {step.skipText && (
            <button
              onClick={() => {
                setCurrentStep(currentStep + 1);
              }}
              className="px-8 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium text-lg"
            >
              {step.skipText}
            </button>
          )}
        </div>

        {/* Quick tips */}
        {currentStep === 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              <strong>Quick Tip:</strong> You can always access help and documentation from the sidebar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
