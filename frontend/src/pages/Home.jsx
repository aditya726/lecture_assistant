import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, BookOpen, Lightbulb, Tag, BarChart, Key } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const features = [
    { title: 'AI Chat', description: 'Chat with AI for instant answers', icon: MessageSquare, link: '/ai-chat', color: 'blue' },
    { title: 'Summarize', description: 'Get concise summaries of long texts', icon: BookOpen, link: '/ai-summarize', color: 'green' },
    { title: 'Explain Doubt', description: 'Get detailed explanations', icon: Lightbulb, link: '/ai-explain', color: 'purple' },
    { title: 'Extract Topics', description: 'Identify main topics from content', icon: Tag, link: '/ai-topics', color: 'orange' },
    { title: 'Extract Keywords', description: 'Find key terms and concepts', icon: Key, link: '/ai-keywords', color: 'pink' },
    { title: 'Classify Difficulty', description: 'Assess content difficulty level', icon: BarChart, link: '/ai-difficulty', color: 'red' },
    { title: 'Manage Texts', description: 'Store and organize documents', icon: FileText, link: '/texts', color: 'gray' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.email}
        </h1>
        <p className="text-gray-600">
          AI-powered learning tools at your fingertips
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} to={feature.link} className="block">
              <div className={`bg-white rounded-lg p-6 border border-gray-200 hover:border-${feature.color}-500 hover:shadow-md transition-all`}>
                <Icon className={`w-8 h-8 text-${feature.color}-600 mb-3`} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
