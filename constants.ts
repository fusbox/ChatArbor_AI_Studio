export const APP_NAME = "Job Connections Virtual Assistant";

export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    tags: string[];
    imageUrl?: string;
    link?: string;
    featured?: boolean;
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
    {
        id: '1',
        title: 'AI Chat Assistant',
        description: 'A sophisticated RAG-based chatbot capable of context-aware conversations and document analysis.',
        tags: ['React', 'TypeScript', 'Gemini API', 'ChromaDB'],
        featured: true,
    },
    {
        id: '2',
        title: 'AI-Native Federated Applicant Tracking System',
        description: 'Federated talent ecosystem built with AI-native components from the ground up.',
        tags: ['TBD'],
        featured: true,
    },
    {
        id: '3',
        title: 'Task Management API',
        description: 'Scalable RESTful API for project management with team collaboration features.',
        tags: ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
    },
    {
        id: '4',
        title: 'Mobile Fitness App',
        description: 'Cross-platform mobile application for tracking workouts and nutrition plans.',
        tags: ['React Native', 'Firebase', 'Redux'],
    }
];

export const ABOUT_ME = {
    name: "Fu Chen",
    role: "Solutions Architect",
    bio: "Passionate about building intuitive user experiences and leveraging AI to solve complex problems. Experienced in modern web technologies and always eager to learn new tools.",
    skills: ["React", "TypeScript", "Node.js", "Python", "AI/ML Integration", "UI/UX Design"]
};