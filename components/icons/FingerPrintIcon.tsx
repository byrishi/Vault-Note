import React from 'react';

const FingerPrintIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 7.5c0 2.278-1.02 4.28-2.616 5.562a.75.75 0 0 1-1.162-.088l-1.95-2.167a.75.75 0 0 0-1.162-.088l-1.95 2.167a.75.75 0 0 1-1.162 0l-1.95-2.167a.75.75 0 0 0-1.162 0l-1.95 2.167a.75.75 0 0 1-1.162 0l-1.12-1.244a1.5 1.5 0 0 0-2.12 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6H6a6 6 0 0 0 6 6Z" />
    </svg>
);

export default FingerPrintIcon;
