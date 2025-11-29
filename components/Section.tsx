
import React from 'react';

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
    return (
        <section className="animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-3 mb-4">
                <span className="text-brand-primary">{icon}</span>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{title}</h3>
            </div>
            <div className="pl-9">
                {children}
            </div>
        </section>
    );
};

export default Section;
