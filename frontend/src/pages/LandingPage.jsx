import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Mic, FileText, Bot, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    const features = [
        {
            icon: <Mic className="w-6 h-6 text-blue-500" />,
            title: "Real-Time Transcription",
            description: "Convert your lectures and meetings to text instantly with high accuracy.",
            color: "bg-blue-500/10 border-blue-500/20"
        },
        {
            icon: <FileText className="w-6 h-6 text-green-500" />,
            title: "Smart Summaries",
            description: "Automatically generate formatted notes, key points, and action items.",
            color: "bg-green-500/10 border-green-500/20"
        },
        {
            icon: <Bot className="w-6 h-6 text-purple-500" />,
            title: "Interactive Doubt Resolution",
            description: "Highlight any confusing text and get an instant, detailed AI explanation.",
            color: "bg-purple-500/10 border-purple-500/20"
        },
        {
            icon: <Globe className="w-6 h-6 text-orange-500" />,
            title: "Resource Linking",
            description: "Let AI find relevant videos, articles, and external resources for your topics.",
            color: "bg-orange-500/10 border-orange-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">

            {/* Abstract Background Gradients */}
            <div className="absolute top-0 -left-48 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-pulse"></div>
            <div className="absolute top-0 -right-48 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-48 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[128px] opacity-70"></div>

            {/* Navigation Bar */}
            <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">Tutor Lab</span>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <Link to="/workspace" className="modern-button px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md font-semibold flex items-center gap-2">
                            Go to Workspace <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
                                Sign In
                            </Link>
                            <Link to="/register" className="modern-button px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md font-semibold flex items-center gap-2">
                                Get Started <ArrowRight className="w-4 h-4" />
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-8">
                        <Zap className="w-4 h-4" /> <span>Next Generation Learning</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                        Turn every lecture into <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">actionable knowledge.</span>
                    </h1>

                    <p className="text-lg md:text-xl font-medium text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        Record, transcribe, and summarize your classes in real-time. Unsure about a concept? Just ask the AI for a detailed explanation instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {user ? (
                            <Link to="/workspace" className="modern-button w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 font-semibold text-lg flex items-center justify-center gap-2">
                                Enter Workspace
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="modern-button w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 font-semibold text-lg flex items-center justify-center gap-2">
                                    Start Learning for Free
                                </Link>
                                <Link to="/login" className="modern-button w-full sm:w-auto px-8 py-4 rounded-full border border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-muted transition-all font-semibold text-lg flex items-center justify-center">
                                    Sign In to Workspace
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-24 text-left"
                >
                    {features.map((feature, idx) => (
                        <div key={idx} className={`modern-glass p-8 rounded-3xl border ${feature.color} backdrop-blur-xl hover:-translate-y-1 transition-transform duration-300`}>
                            <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-sm mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </main>

            {/* Footer minimal */}
            <footer className="relative z-10 w-full text-center py-8 text-sm font-medium text-muted-foreground border-t border-border/40">
                &copy; {new Date().getFullYear()} Tutor Lab. Master your classes.
            </footer>
        </div>
    );
}
