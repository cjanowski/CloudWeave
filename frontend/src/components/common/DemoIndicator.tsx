import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { demoDataService } from '../../services/demoDataService';

interface DemoIndicatorProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showScenario?: boolean;
  inline?: boolean;
}

const DemoIndicator: React.FC<DemoIndicatorProps> = ({
  className = '',
  size = 'medium',
  showScenario = true,
  inline = false,
}) => {
  const { isDemo, scenario, demoIndicatorsVisible } = useSelector((state: RootState) => state.demo);

  if (!isDemo || !demoIndicatorsVisible) {
    return null;
  }

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const scenarioData = demoDataService.getScenarioById(scenario);
  const displayText = showScenario && scenarioData 
    ? `Demo Data (${scenarioData.name})`
    : 'Demo Data';

  const baseClasses = `
    inline-flex items-center gap-2 rounded-full font-medium
    bg-gradient-to-r from-blue-500/20 to-purple-500/20
    border border-blue-300/30 text-blue-700 dark:text-blue-300
    backdrop-blur-sm
    ${sizeClasses[size]}
    ${inline ? '' : 'mb-4'}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span>{displayText}</span>
      {showScenario && scenarioData && (
        <span className="text-xs opacity-75">
          ({scenarioData.estimatedCost})
        </span>
      )}
    </div>
  );
};

export default DemoIndicator;