import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Activity, Droplets, Heart, Clock } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface DashboardProps {
  isRTL: boolean;
}

const Dashboard = ({ isRTL }: DashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const quickActionsSection = useScrollAnimation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const quickActions = [
    {
      title: isRTL ? "الخطوات" : "Steps",
      value: "8,432",
      target: "10,000",
      icon: <Activity className="w-12 h-12" />,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      hoverColor: "hover:bg-blue-100",
      glowColor: "hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
      path: "/activity",
      description: isRTL ? "تتبع نشاطك اليومي" : "Track your daily activity"
    },
    {
      title: isRTL ? "الماء" : "Water",
      value: "1.8L",
      target: "2.5L",
      icon: <Droplets className="w-12 h-12" />,
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-500",
      hoverColor: "hover:bg-cyan-100",
      glowColor: "hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
      path: "/water",
      description: isRTL ? "تتبع استهلاك الماء" : "Track water intake"
    },
    {
      title: isRTL ? "معدل القلب" : "Heart Rate",
      value: "72",
      target: "BPM",
      icon: <Heart className="w-12 h-12" />,
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      hoverColor: "hover:bg-red-100",
      glowColor: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
      path: "/nutrition",
      description: isRTL ? "تتبع صحة قلبك" : "Monitor your heart health"
    },
    {
      title: isRTL ? "النوم" : "Sleep",
      value: "7.5h",
      target: "8h",
      icon: <Clock className="w-12 h-12" />,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
      hoverColor: "hover:bg-purple-100",
      glowColor: "hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
      path: "/sleep",
      description: isRTL ? "تتبع نومك وجودته" : "Track your sleep quality"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isRTL={isRTL} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`bg-white shadow-glow border-b border-accent-blue/20 px-6 py-4 ${isVisible ? 'slide-in-down' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-dark-blue hover:text-accent-blue transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-dark-blue">
                {isRTL ? "لوحة القيادة" : "Dashboard"}
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content - Full Page Quick Actions */}
        <main className="flex-1 p-8 flex items-center justify-center">
          <div 
            ref={quickActionsSection.elementRef}
            className={`w-full max-w-7xl ${quickActionsSection.isVisible ? 'scroll-slide-up visible' : 'scroll-slide-up'}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`p-8 rounded-3xl ${action.bgColor} ${action.hoverColor} transition-all duration-300 group hover:scale-105 ${action.glowColor} ${
                    quickActionsSection.isVisible ? `scroll-fade-in visible delay-${index * 100}` : 'scroll-fade-in'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-24 h-24 rounded-2xl bg-white flex items-center justify-center mb-6 group-hover:animate-pulse ${action.iconColor} shadow-lg`}>
                      {action.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-dark-blue mb-2">
                      {action.title}
                    </h2>
                    <div className="text-4xl font-bold text-accent-blue mb-2">
                      {action.value}
                    </div>
                    <div className="text-gray-600 mb-4">
                      {action.target} {isRTL ? "من" : "of"}
                    </div>
                    <p className="text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
