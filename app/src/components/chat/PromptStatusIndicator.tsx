import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { PromptValidationStatus } from '../../types';

interface PromptStatusIndicatorProps {
    status: PromptValidationStatus;
}

const PromptStatusIndicator: React.FC<PromptStatusIndicatorProps> = ({ status }) => {
    if (status.status === 'idle' || !status.message) {
        return null;
    }

    let bgColorClass = '';
    let textColorClass = '';
    let Icon = CheckCircle;

    switch (status.status) {
        case 'valid':
            bgColorClass = 'bg-green-900/30';
            textColorClass = 'text-green-400';
            Icon = CheckCircle;
            break;
        case 'warning':
            bgColorClass = 'bg-amber-900/30';
            textColorClass = 'text-amber-400';
            Icon = AlertTriangle;
            break;
        case 'error':
            bgColorClass = 'bg-red-900/30';
            textColorClass = 'text-red-400';
            Icon = XCircle;
            break;
    }

    return (
        <div className={`mb-2 px-3 py-2 rounded-md text-sm flex items-center ${bgColorClass} ${textColorClass}`}>
            <Icon className="w-4 h-4 mr-2" />
            {status.message}
        </div>
    );
};

export default PromptStatusIndicator;