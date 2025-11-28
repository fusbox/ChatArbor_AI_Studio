import React from 'react';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    isActive: boolean;
    inactiveClassName?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, isActive, inactiveClassName, className, ...props }) => (
    <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive
            ? 'bg-primary text-white shadow'
            : (inactiveClassName || 'text-neutral-100 hover:bg-primary-dark')
            } ${className || ''}`}
        {...props}
    >
        {label}
    </button>
);

export default NavButton;
