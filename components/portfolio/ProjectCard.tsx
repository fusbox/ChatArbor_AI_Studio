import React from 'react';
import { PortfolioItem } from '../../constants';

interface ProjectCardProps {
    item: PortfolioItem;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ item }) => {
    return (
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-purple/20 flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-pale transition-colors">
                        {item.title}
                    </h3>
                    {item.featured && (
                        <span className="px-2 py-1 text-xs font-semibold bg-brand-purple/30 text-brand-pale rounded-full border border-brand-purple/20">
                            Featured
                        </span>
                    )}
                </div>

                <p className="text-brand-grey mb-6 flex-grow leading-relaxed">
                    {item.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2.5 py-1 text-xs font-medium bg-white/5 text-brand-blue rounded-md border border-white/5"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
