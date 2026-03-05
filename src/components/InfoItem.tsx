import React from 'react';

interface InfoItemProps {
  label: string;
  value: string | number | null;
  originalValue?: string;
  highlight?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ 
  label, 
  value, 
  originalValue, 
  highlight = false 
}) => (
  <div className={`p-3 rounded-lg border ${highlight ? 'bg-primary/10 border-primary/30' : 'bg-base-200 border-base-300'}`}>
    <div className="text-xs text-base-content/70 mb-1 font-medium">{label}</div>
    <div className={`font-mono text-sm ${highlight ? 'text-primary font-semibold' : 'text-base-content'}`}>
      {value !== null && value !== undefined ? value : '-'}
    </div>
    {originalValue && originalValue !== String(value) && (
      <div className="text-xs text-base-content/50 mt-1">
        原值: {originalValue}
      </div>
    )}
  </div>
);

export default InfoItem;