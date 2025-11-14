import React from 'react';

interface NavButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white shadow'
                : 'text-neutral-100 hover:bg-primary-dark'
        }`}
    >
        {label}
    </button>
);

export default NavButton;
