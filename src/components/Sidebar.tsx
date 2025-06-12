import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  Droplets, 
  Clock, 
  Settings, 
  Home, 
  Activity as Steps,
  Monitor,
  Calendar,
  Bell,
  X,
  LogOut,
  UtensilsCrossed
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isRTL: boolean;
}

const Sidebar = ({ isOpen, setIsOpen, isRTL }: SidebarProps) => {
  const location = useLocation();

  const handleLogout = () => {
    // Navigate back to landing page
    window.location.href = '/';
  };

  const menuItems = [
    {
      title: isRTL ? "لوحة القيادة" : "Dashboard",
      icon: <Home className="w-5 h-5" />,
      path: "/dashboard"
    },
    {
      title: isRTL ? "تتبع التغذية" : "Nutrition Tracking",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      path: "/nutrition"
    },
    {
      title: isRTL ? "تتبع الماء" : "Water Tracking",
      icon: <Droplets className="w-5 h-5" />,
      path: "/water"
    },
    {
      title: isRTL ? "تتبع النشاط" : "Activity Tracking",
      icon: <Activity className="w-5 h-5" />,
      path: "/activity"
    },
    {
      title: isRTL ? "مراقبة النوم" : "Sleep Tracking",
      icon: <Clock className="w-5 h-5" />,
      path: "/sleep"
    },
    {
      title: isRTL ? "التقارير" : "Reports",
      icon: <Monitor className="w-5 h-5" />,
      path: "/reports"
    },
    {
      title: isRTL ? "الأهداف" : "Goals",
      icon: <Calendar className="w-5 h-5" />,
      path: "/goals"
    },
    {
      title: isRTL ? "التذكيرات" : "Reminders",
      icon: <Bell className="w-5 h-5" />,
      path: "/reminders"
    },
    {
      title: isRTL ? "تتبع الخطوات" : "Steps Tracking",
      icon: <Steps className="w-5 h-5" />,
      path: "/steps"
    },
    {
      title: isRTL ? "معدل ضربات القلب" : "Heart Rate",
      icon: <Heart className="w-5 h-5" />,
      path: "/heart-rate"
    },
    {
      title: isRTL ? "سكر الدم" : "Blood Sugar",
      icon: <Monitor className="w-5 h-5" />,
      path: "/blood-sugar"
    },
    {
      title: isRTL ? "ضغط الدم" : "Blood Pressure",
      icon: <Heart className="w-5 h-5" />,
      path: "/blood-pressure"
    },
    {
      title: isRTL ? "الإعدادات" : "Settings",
      icon: <Settings className="w-5 h-5" />,
      path: "/settings"
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 ${isRTL ? 'right-0' : 'left-0'}
        z-50 w-64 bg-dark-blue text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}
        lg:translate-x-0 shadow-glow-lg
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent-blue/30">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-accent-blue pulse-heart" />
            <span className="text-xl font-bold">
              {isRTL ? "نبضة الصحة" : "Health Pulse"}
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white hover:text-accent-blue transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300
                    ${location.pathname === item.path
                      ? 'bg-accent-blue text-white shadow-glow'
                      : 'text-gray-300 hover:bg-accent-blue/20 hover:text-white hover:shadow-glow-md'
                    }
                  `}
                >
                  <span className={location.pathname === item.path ? 'animate-pulse' : ''}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-accent-blue/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-300 hover:bg-red-500/20 hover:text-red-400 hover:shadow-glow-md"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{isRTL ? "تسجيل الخروج" : "Logout"}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-accent-blue/30">
          <div className="text-center text-gray-400 text-sm">
            <Heart className="w-4 h-4 inline-block mr-1 animate-pulse" />
            {isRTL ? "صحتك أولويتنا" : "Your Health Priority"}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
