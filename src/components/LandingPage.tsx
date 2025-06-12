import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Monitor, Droplets, Activity, Clock, Users, Star, ArrowRight, Menu, X } from 'lucide-react';
import { Icon } from '@iconify/react';
import Footer from './Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface LandingPageProps {
  isRTL: boolean;
  setIsRTL: (value: boolean) => void;
}

const LandingPage = ({ isRTL, setIsRTL }: LandingPageProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroSection = useScrollAnimation();
  const aboutSection = useScrollAnimation();
  const featuresSection = useScrollAnimation();
  const nutritionSection = useScrollAnimation();
  const nourishSection = useScrollAnimation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Clock className="w-8 h-8 text-[#6C63FF]" />,
      bgColor: "bg-[#F3F1FF]",
      iconColor: "text-[#6C63FF]",
      shadowColor: "hover:shadow-[0_0_30px_rgba(108,99,255,0.5)]",
      cardGlow: "hover:shadow-[0_0_30px_rgba(108,99,255,0.5)]",
      title: isRTL ? "مراقبة النوم" : "Sleep Monitoring",
      description: isRTL ? "تتبع أنماط نومك وحسن جودة راحتك" : "Track your sleep patterns and quality for better rest"
    },
    {
      icon: <Droplets className="w-8 h-8 text-[#3B82F6]" />,
      bgColor: "bg-[#EFF6FF]",
      iconColor: "text-[#3B82F6]",
      shadowColor: "hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
      cardGlow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
      title: isRTL ? "تتبع الترطيب" : "Hydration Tracking",
      description: isRTL ? "راقب استهلاك الماء اليومي والأهداف" : "Monitor your daily water intake and stay hydrated"
    },
    {
      icon: <Icon icon="mdi:food-apple" className="w-8 h-8 text-[#22C55E]" />,
      bgColor: "bg-[#F0FDF4]",
      iconColor: "text-[#22C55E]",
      shadowColor: "hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]",
      cardGlow: "hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]",
      title: isRTL ? "طعام صحي" : "Healthy Food",
      description: isRTL ? "تتبع عاداتك الغذائية والسعرات" : "Log your meals and track nutritional goals"
    },
    {
      icon: <Activity className="w-8 h-8 text-[#EF4444]" />,
      bgColor: "bg-[#FEF2F2]",
      iconColor: "text-[#EF4444]",
      shadowColor: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
      cardGlow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
      title: isRTL ? "نشاط بدني" : "Physical Activity",
      description: isRTL ? "رصد تمارينك وحرق السعرات" : "Record workouts and monitor your fitness progress"
    }
  ];

  const benefits = [
    isRTL ? "وجبات متوازنة" : "Balanced Meals",
    isRTL ? "نوم أفضل" : "Better Sleep",
    isRTL ? "المزيد من الطاقة" : "More Energy",
    isRTL ? "صحة القلب" : "Heart Health",
    isRTL ? "إدارة الوزن" : "Weight Management",
    isRTL ? "الصحة العقلية" : "Mental Wellness"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue to-white">
      {/* Header - Initial load animation */}
      <header className={`bg-dark-blue shadow-glow sticky top-0 z-50 ${isVisible ? 'slide-in-down' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-white pulse-heart" />
              <span className="text-2xl font-bold text-white">
                {isRTL ? "نبضة الصحة" : "Health Pulse"}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 transition-all duration-300">
              <a 
                href="#home" 
                className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
              >
                {isRTL ? "الرئيسية" : "Home"}
              </a>
              <a 
                href="#about" 
                className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
              >
                {isRTL ? "حولنا" : "About"}
              </a>
              <a 
                href="#features" 
                className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
              >
                {isRTL ? "المميزات" : "Features"}
              </a>
              <a 
                href="#footer" 
                className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
              >
                {isRTL ? "اتصل بنا" : "Contact"}
              </a>
              
              {/* Language Toggle */}
              <button
                onClick={() => setIsRTL(!isRTL)}
                className="px-3 py-1 bg-accent-blue text-white rounded-md hover:bg-primary-blue transition-all duration-300 hover:scale-105"
              >
                {isRTL ? "EN" : "AR"}
              </button>
              
              <div className="flex space-x-4">
                <Link 
                  to="/auth" 
                  className="glow-button transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "تسجيل الدخول" : "Login"}
                </Link>
                <Link 
                  to="/auth" 
                  className="bg-accent-blue text-white px-6 py-3 rounded-lg hover:bg-primary-blue hover:shadow-glow-hover transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "إنشاء حساب" : "Sign Up"}
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 transition-all duration-300 hover:scale-105"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 animate-slide-in-left">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#home" 
                  className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "الرئيسية" : "Home"}
                </a>
                <a 
                  href="#about" 
                  className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "حولنا" : "About"}
                </a>
                <a 
                  href="#features" 
                  className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "المميزات" : "Features"}
                </a>
                <a 
                  href="#footer" 
                  className="text-white hover:text-accent-blue transition-all duration-300 hover:scale-105"
                >
                  {isRTL ? "اتصل بنا" : "Contact"}
                </a>
                <button
                  onClick={() => setIsRTL(!isRTL)}
                  className="text-left px-3 py-1 bg-accent-blue text-white rounded-md hover:bg-primary-blue transition-all duration-300 hover:scale-105 w-fit"
                >
                  {isRTL ? "EN" : "AR"}
                </button>
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/auth" 
                    className="glow-button w-fit transition-all duration-300 hover:scale-105"
                  >
                    {isRTL ? "تسجيل الدخول" : "Login"}
                  </Link>
                  <Link 
                    to="/auth" 
                    className="bg-accent-blue text-white px-6 py-3 rounded-lg hover:bg-primary-blue hover:shadow-glow-hover transition-all duration-300 hover:scale-105 w-fit"
                  >
                    {isRTL ? "إنشاء حساب" : "Sign Up"}
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Initial load + scroll animation */}
      <section 
        ref={heroSection.elementRef}
        id="home" 
        className={`py-20 px-4 bg-[#90e0ef] relative overflow-hidden ${
          heroSection.isVisible ? 'scroll-fade-in visible' : 'scroll-fade-in'
        }`}
      >
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} text-dark-blue`}>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                {isRTL ? "حسن صحتك اليومية" : "Improve Your Daily Health"}
              </h1>
              <h2 className="text-2xl md:text-3xl text-primary-blue mb-4">
                {isRTL ? "مع منصتنا المتكاملة" : "with Our Integrated Platform"}
              </h2>
              <p className="text-lg text-gray-700 mb-8 max-w-2xl">
                {isRTL 
                  ? "راقب صحتك، تتبع أهدافك، وحقق نمط حياة أفضل مع أدواتنا المتقدمة للمراقبة الصحية"
                  : "Track your health metrics, set goals, and achieve a better lifestyle with our comprehensive health monitoring solution."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="glow-button text-lg bg-[#0077b6] hover:bg-[#005b8c] text-white px-8 py-4 rounded-lg transition-all duration-300">
                  {isRTL ? "تحميل التطبيق" : "Download App"}
                </Link>
                <Link to="/auth" className="bg-white text-[#0077b6] px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-glow-hover transition-all duration-300">
                  {isRTL ? "اعرف المزيد" : "Learn More"}
                </Link>
              </div>
            </div>

            {/* Right Content - Medical Shield Animation */}
            <div className="relative">
              <div className="w-64 h-64 mx-auto relative">
                {/* Main Shield */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-accent-blue rounded-lg transform rotate-45 shadow-glow-lg animate-pulse-slow"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon 
                      icon="mdi:plus-box" 
                      className="w-24 h-24 text-white transform -rotate-45"
                      style={{ filter: 'drop-shadow(0 0 12px #60A5FA)' }}
                    />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-0 -left-8 animate-float-slow">
                  <div className="bg-white p-3 rounded-lg shadow-glow">
                    <Icon icon="mdi:pill" className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>
                <div className="absolute top-1/4 -right-12 animate-float-delay">
                  <div className="bg-white p-3 rounded-lg shadow-glow">
                    <Icon icon="mdi:stethoscope" className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>
                <div className="absolute bottom-0 -right-8 animate-float">
                  <div className="bg-white p-3 rounded-lg shadow-glow">
                    <Icon icon="mdi:clipboard-text" className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>
                <div className="absolute -bottom-12 left-1/4 animate-float-delay-long">
                  <div className="bg-white p-3 rounded-lg shadow-glow">
                    <Icon icon="mdi:bandage" className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full"></div>
                  <div className="absolute top-1/2 right-0 w-2 h-2 bg-red-400 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 w-2 h-2 bg-red-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Scroll animation */}
      <section 
        ref={aboutSection.elementRef}
        id="about" 
        className={`py-20 px-4 bg-[#070B39] relative overflow-hidden ${
          aboutSection.isVisible ? 'scroll-slide-up visible' : 'scroll-slide-up'
        }`}
      >
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h3 className="text-[#00B4D8] font-medium mb-4">
                {isRTL ? "تحسين صحتك" : "Improving Your Health"}
              </h3>
              <h2 className="text-5xl font-bold text-white mb-8">
                {isRTL ? "معلومات عنا" : "About Us"}
              </h2>
              <p className="text-lg text-[#00B4D8] mb-8 leading-relaxed">
                {isRTL
                  ? "في صميم منصتنا واجهة سهلة الاستخدام، مصممة لتتبع تقدمك الصحي بسهولة وتسليط الضوء على مجالات التحسين"
                  : "At the core of our platform lies a user-friendly interface, designed to effortlessly track your health progress and highlight areas for improvement."
                }
              </p>
              <p className="text-lg text-[#00B4D8] mb-8 leading-relaxed">
                {isRTL
                  ? "راقب بسهولة تغذيتك اليومية، ونشاطك البدني، وأنماط نومك، ومستويات الترطيب من خلال لوحة المعلومات البديهية. احصل على رؤى وتوصيات مخصصة لاتخاذ قرارات صحية مدروسة"
                  : "Effortlessly monitor your daily nutrition, physical activity, sleep patterns, and hydration levels with our intuitive dashboard. Gain personalized insights and recommendations to make informed health decisions."
                }
              </p>
              <Link to="/auth" className="bg-[#00B4D8] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#0077B6] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,180,216,0.5)]">
                {isRTL ? "اكتشف الآن" : "Explore Now"}
              </Link>
            </div>

            {/* Illustration */}
            <div className="relative animate-fade-in-up">
              <div className="relative w-full h-[500px]">
                {/* Main circular background */}
                <div className="absolute inset-0 bg-[#E0F7FA] rounded-full transform scale-90 shadow-[0_0_50px_rgba(224,247,250,0.3)]">
                  {/* Medical Cross Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-[#0077B6]"></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-1 bg-[#0077B6]"></div>
                  </div>
                </div>
                
                {/* Medical Elements Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4/5 h-4/5">
                    {/* Central Medical Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <Icon 
                            icon="medical-icon:i-health-services" 
                            className="w-24 h-24 text-[#0077B6]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Floating Medical Elements */}
                    <div className="absolute top-0 left-1/4 animate-float-slow">
                      <div className="bg-white p-4 rounded-full shadow-lg">
                        <Icon icon="medical-icon:i-surgery" className="w-8 h-8 text-[#00B4D8]" />
                      </div>
                    </div>

                    <div className="absolute top-1/4 -right-4 animate-float-delay">
                      <div className="bg-white p-4 rounded-full shadow-lg">
                        <Icon icon="medical-icon:i-nutrition" className="w-8 h-8 text-[#22C55E]" />
                      </div>
                    </div>

                    <div className="absolute bottom-1/4 -left-4 animate-float">
                      <div className="bg-white p-4 rounded-full shadow-lg">
                        <Icon icon="medical-icon:i-care-staff-area" className="w-8 h-8 text-[#6C63FF]" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 right-1/4 animate-float-delay-long">
                      <div className="bg-white p-4 rounded-full shadow-lg">
                        <Icon icon="medical-icon:i-cardiology" className="w-8 h-8 text-[#EF4444]" />
                      </div>
                    </div>

                    {/* Connecting Lines */}
                    <div className="absolute inset-0">
                      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(45deg)' }}>
                        <line x1="30%" y1="30%" x2="70%" y2="70%" stroke="#E0F7FA" strokeWidth="2" strokeDasharray="4 4" />
                        <line x1="70%" y1="30%" x2="30%" y2="70%" stroke="#E0F7FA" strokeWidth="2" strokeDasharray="4 4" />
                      </svg>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute inset-0 animate-spin-slow opacity-20">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#00B4D8] rounded-full"></div>
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#00B4D8] rounded-full"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#00B4D8] rounded-full"></div>
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#00B4D8] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glowing Orbs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#00B4D8] rounded-full filter blur-2xl opacity-20 animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#0077B6] rounded-full filter blur-2xl opacity-20 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Scroll animation */}
      <section 
        ref={featuresSection.elementRef}
        id="features" 
        className={`py-20 px-4 bg-white ${
          featuresSection.isVisible ? 'scroll-slide-up visible' : 'scroll-slide-up'
        }`}
      >
        <div className="container mx-auto">
          <h3 className="text-5xl font-bold text-center text-[#1E1B4B] mb-16">
            {isRTL ? "مميزاتنا الرئيسية" : "Key Features"}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center group bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-500 ${feature.cardGlow} ${
                  featuresSection.isVisible ? `scroll-fade-in visible delay-${index * 100}` : 'scroll-fade-in'
                }`}
              >
                <div className={`relative mb-8`}>
                  <div className={`w-24 h-24 rounded-full ${feature.bgColor} flex items-center justify-center relative z-10 transition-all duration-300 ${feature.shadowColor}`}>
                    <div className={`w-16 h-16 flex items-center justify-center ${feature.iconColor}`}>
                      {feature.icon}
                    </div>
                  </div>
                  <div className={`absolute inset-0 rounded-full ${feature.bgColor} blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
                </div>
                <h4 className="text-2xl font-semibold text-[#1E1B4B] mb-4">
                  {feature.title}
                </h4>
                <p className="text-gray-600 max-w-xs">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nutrition Focus Section - Scroll animation */}
      <section 
        ref={nutritionSection.elementRef}
        className={`py-20 px-4 bg-[#90e0ef] ${
          nutritionSection.isVisible ? 'scroll-slide-left visible' : 'scroll-slide-left'
        }`}
      >
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left side - Icon */}
            <div className="animate-fade-in-up">
              <div className="relative">
                <div className="w-80 h-80 mx-auto bg-[#caf0f8] rounded-full flex items-center justify-center shadow-lg">
                  <div className="relative">
                    <Icon 
                      icon="mdi:silverware-fork-knife" 
                      className="w-40 h-40 text-[#070B39]"
                    />
                  </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute -inset-4 bg-[#caf0f8] rounded-full -z-10 opacity-50 blur-2xl"></div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="animate-fade-in-up">
              <h2 className="text-5xl font-bold text-[#070B39] mb-6">
                {isRTL ? "راقب عاداتك الغذائية" : "Monitor Your Eating Habits"}
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {isRTL
                  ? "تحكم في تغذيتك مع نظامنا الشامل لتتبع الطعام. سجل وجباتك، تتبع السعرات الحرارية، وحقق أهدافك الصحية"
                  : "Take control of your nutrition with our comprehensive food tracking system. Log meals, track calories, and achieve your health goals."}
              </p>
              <div className="text-center">
                <Link to="/auth" className="bg-accent-blue text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-blue hover:shadow-glow-hover transition-all duration-300 hover:scale-105">
                  {isRTL ? "ابدأ التتبع" : "Start Tracking"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nourish Your Body Section - Scroll animation */}
      <section 
        ref={nourishSection.elementRef}
        className={`py-20 px-4 bg-white ${
          nourishSection.isVisible ? 'scroll-slide-up visible' : 'scroll-slide-up'
        }`}
      >
        <div className="container mx-auto">
          <h2 className="text-5xl font-bold text-center text-[#070B39] mb-16">
            {isRTL ? "غذي جسمك" : "Nourish Your Body"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Balanced Meals */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-green-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="mdi:silverware-fork-knife" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "وجبات متوازنة" : "Balanced Meals"}
                </h3>
              </div>
            </div>

            {/* Quality Sleep */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-purple-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="ph:moon-stars" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "نوم جيد" : "Quality Sleep"}
                </h3>
              </div>
            </div>

            {/* Proper Hydration */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-blue-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="mdi:water-drop" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "ترطيب مناسب" : "Proper Hydration"}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Regular Exercise */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-red-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="mdi:heart-pulse" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "تمارين منتظمة" : "Regular Exercise"}
                </h3>
              </div>
            </div>

            {/* Mindfulness */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-indigo-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="mdi:brain" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "اليقظة الذهنية" : "Mindfulness"}
                </h3>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 text-orange-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="mdi:trending-up" className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#070B39] mb-2">
                  {isRTL ? "تتبع التقدم" : "Progress Tracking"}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
