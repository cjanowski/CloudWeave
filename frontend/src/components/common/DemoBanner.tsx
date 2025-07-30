import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setDemoIndicatorsVisible, transitionToReal } from '../../store/slices/demoSlice';
import { demoDataService } from '../../services/demoDataService';
import GlassButton from './GlassButton';

interface DemoBannerProps {
  className?: string;
  showTransitionButton?: boolean;
  showHideButton?: boolean;
}

const DemoBanner: React.FC<DemoBannerProps> = ({
  className = '',
  showTransitionButton = true,
  showHideButton = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDemo, scenario, demoIndicatorsVisible, loading } = useSelector((state: RootState) => state.demo);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  if (!isDemo || !demoIndicatorsVisible) {
    return null;
  }

  const scenarioData = demoDataService.getScenarioById(scenario);

  const handleTransitionToReal = async () => {
    try {
      await dispatch(transitionToReal({
        cloudProviders: ['aws'], // Default to AWS
        keepSettings: true,
      })).unwrap();
      setShowTransitionModal(false);
    } catch (error) {
      console.error('Failed to transition to real data:', error);
    }
  };

  const handleHideBanner = () => {
    dispatch(setDemoIndicatorsVisible(false));
  };

  return (
    <>
      <div className={`
        relative overflow-hidden rounded-lg border border-blue-300/30 
        bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20
        backdrop-blur-sm p-4 mb-6
        ${className}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                Demo Mode Active
              </span>
            </div>
            
            {scenarioData && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <span className="font-medium">{scenarioData.name} Scenario</span>
                <span className="mx-2">•</span>
                <span>{scenarioData.estimatedCost}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showTransitionButton && (
              <GlassButton
                variant="primary"
                size="small"
                onClick={() => setShowTransitionModal(true)}
                disabled={loading}
              >
                Connect Real Data
              </GlassButton>
            )}
            
            {showHideButton && (
              <GlassButton
                variant="ghost"
                size="small"
                onClick={handleHideBanner}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Hide
              </GlassButton>
            )}
          </div>
        </div>

        {scenarioData && (
          <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            <p>{scenarioData.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {scenarioData.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100/50 dark:bg-blue-800/30 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Connect Real Cloud Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will remove all demo data and connect your real cloud providers. 
              Your settings and preferences will be preserved.
            </p>
            
            <div className="flex gap-3 justify-end">
              <GlassButton
                variant="ghost"
                onClick={() => setShowTransitionModal(false)}
                disabled={loading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleTransitionToReal}
                disabled={loading}
              >
                {loading ? 'Transitioning...' : 'Connect Real Data'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DemoBanner;