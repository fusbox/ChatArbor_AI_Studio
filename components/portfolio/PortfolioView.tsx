import React from 'react';
import { PORTFOLIO_ITEMS, ABOUT_ME } from '../../constants';
import ProjectCard from './ProjectCard';

const PortfolioView: React.FC = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-20">

                {/* Hero / About Me Section */}
                <section className="relative">
                    {/* Background Decor */}
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
                        {/* Avatar / Image Placeholder */}
                        <div className="flex-none">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue p-1 shadow-2xl shadow-brand-purple/30">
                                <div className="w-full h-full rounded-full bg-brand-dark flex items-center justify-center overflow-hidden">
                                    <span className="text-4xl font-bold text-white opacity-80">{ABOUT_ME.name.charAt(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio Content */}
                        <div className="text-center md:text-left space-y-4 max-w-2xl">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                                    {ABOUT_ME.name}
                                </h1>
                                <p className="text-xl text-brand-blue font-medium">
                                    {ABOUT_ME.role}
                                </p>
                            </div>

                            <p className="text-lg text-brand-grey leading-relaxed">
                                {ABOUT_ME.bio}
                            </p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                {ABOUT_ME.skills.map((skill) => (
                                    <span key={skill} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-brand-pale backdrop-blur-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Showcase Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-1 bg-brand-purple rounded-full"></span>
                            Selected Projects
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PORTFOLIO_ITEMS.map((item) => (
                            <ProjectCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>

                {/* Footer / Contact CTA */}
                <section className="py-12 border-t border-white/5 text-center">
                    <p className="text-brand-grey mb-6">Interested in working together?</p>
                    <a
                        href="mailto:contact@example.com"
                        className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue text-brand-dark font-bold rounded-xl hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
                    >
                        Get in Touch
                    </a>
                </section>

            </div>
        </div>
    );
};

export default PortfolioView;
