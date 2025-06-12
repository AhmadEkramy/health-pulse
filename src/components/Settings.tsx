import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Target, Menu, Save } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface SettingsProps {
  isRTL: boolean;
}

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    height: string;
    weight: string;
    bloodType: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    waterReminders: boolean;
    exerciseReminders: boolean;
    medicationReminders: boolean;
    weeklyReports: boolean;
    achievementAlerts: boolean;
  };
  privacy: {
    profileVisibility: string;
    shareData: boolean;
    analytics: boolean;
    location: boolean;
  };
  preferences: {
    language: string;
    units: string;
    theme: string;
    timeFormat: string;
  };
  goals: {
    dailySteps: string;
    waterIntake: string;
    sleepHours: string;
    dailyCalories: string;
  };
}

const defaultSettings: UserSettings = {
  profile: {
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    height: '',
    weight: '',
    bloodType: 'O+'
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    waterReminders: true,
    exerciseReminders: true,
    medicationReminders: false,
    weeklyReports: true,
    achievementAlerts: true
  },
  privacy: {
    profileVisibility: 'private',
    shareData: false,
    analytics: true,
    location: false
  },
  preferences: {
    language: 'en',
    units: 'metric',
    theme: 'light',
    timeFormat: '24h'
  },
  goals: {
    dailySteps: '10000',
    waterIntake: '2.5',
    sleepHours: '8',
    dailyCalories: '2000'
  }
};

type TabId = 'profile' | 'notifications' | 'privacy' | 'preferences' | 'goals';

const Settings = ({ isRTL }: SettingsProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState(defaultSettings.profile);
  const [notifications, setNotifications] = useState(defaultSettings.notifications);
  const [privacy, setPrivacy] = useState(defaultSettings.privacy);
  const [preferences, setPreferences] = useState(defaultSettings.preferences);
  const [goals, setGoals] = useState(defaultSettings.goals);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchSettings = async () => {
      try {
        setError(null);
        const settingsRef = doc(db, 'userSettings', user.uid);
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as UserSettings;
          setProfile(data.profile);
          setNotifications(data.notifications);
          setPrivacy(data.privacy);
          setPreferences(data.preferences);
          setGoals(data.goals);
        } else {
          // Initialize with default settings if none exist
          await setDoc(settingsRef, defaultSettings);
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
        setError(isRTL ? 'حدث خطأ أثناء جلب الإعدادات' : 'Error fetching settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, authLoading, navigate, isRTL]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const settingsRef = doc(db, 'userSettings', user.uid);
      await updateDoc(settingsRef, {
        profile,
        notifications,
        privacy,
        preferences,
        goals
      });

      toast({
        title: isRTL ? 'تم الحفظ' : 'Settings Saved',
        description: isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Your settings have been saved successfully',
      });
    } catch (e) {
      console.error('Error saving settings:', e);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings',
      });
    }
  };

  const tabs = [
    { id: 'profile', name: isRTL ? 'الملف الشخصي' : 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'notifications', name: isRTL ? 'الإشعارات' : 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'privacy', name: isRTL ? 'الخصوصية والأمان' : 'Privacy & Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'preferences', name: isRTL ? 'التفضيلات' : 'App Preferences', icon: <Globe className="w-5 h-5" /> },
    { id: 'goals', name: isRTL ? 'الأهداف المخصصة' : 'Custom Goals', icon: <Target className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isRTL={isRTL} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-glow border-b border-accent-blue/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-dark-blue hover:text-accent-blue transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-dark-blue flex items-center space-x-3">
                <SettingsIcon className="w-8 h-8 text-gray-500 animate-pulse" />
                <span>{isRTL ? 'الإعدادات' : 'Settings'}</span>
              </h1>
            </div>
            
            <button
              onClick={handleSave}
              className="glow-button flex items-center space-x-2"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl text-dark-blue">
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              {error}
            </div>
          ) : (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <div className="glow-card">
                  <h3 className="text-lg font-bold text-dark-blue mb-4">
                    {isRTL ? 'فئات الإعدادات' : 'Settings Categories'}
                  </h3>
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabId)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'bg-accent-blue text-white shadow-glow'
                            : 'text-gray-700 hover:bg-gray-100 hover:shadow-glow-md'
                        }`}
                      >
                        <span className={activeTab === tab.id ? 'animate-pulse' : ''}>
                          {tab.icon}
                        </span>
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                <div className="glow-card">
                  {/* Profile Settings */}
                  {activeTab === 'profile' && (
                    <div>
                      <h3 className="text-xl font-bold text-dark-blue mb-6">
                        {isRTL ? 'معلومات الملف الشخصي' : 'Profile Information'}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'الاسم الكامل' : 'Full Name'}
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                          </label>
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                          </label>
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
                          </label>
                          <input
                            type="date"
                            value={profile.dateOfBirth}
                            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'الجنس' : 'Gender'}
                          </label>
                          <select
                            value={profile.gender}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="male">{isRTL ? 'ذكر' : 'Male'}</option>
                            <option value="female">{isRTL ? 'أنثى' : 'Female'}</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'فصيلة الدم' : 'Blood Type'}
                          </label>
                          <select
                            value={profile.bloodType}
                            onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'الطول (سم)' : 'Height (cm)'}
                          </label>
                          <input
                            type="number"
                            value={profile.height}
                            onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'الوزن (كج)' : 'Weight (kg)'}
                          </label>
                          <input
                            type="number"
                            value={profile.weight}
                            onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Settings */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h3 className="text-xl font-bold text-dark-blue mb-6">
                        {isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}
                      </h3>
                      
                      <div className="space-y-6">
                        {Object.entries(notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gradient-to-r from-light-blue/30 to-container-blue/30 rounded-lg">
                            <div>
                              <div className="font-semibold text-dark-blue">
                                {key === 'emailNotifications' && (isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications')}
                                {key === 'pushNotifications' && (isRTL ? 'الإشعارات الفورية' : 'Push Notifications')}
                                {key === 'waterReminders' && (isRTL ? 'تذكيرات شرب الماء' : 'Water Reminders')}
                                {key === 'exerciseReminders' && (isRTL ? 'تذكيرات التمرين' : 'Exercise Reminders')}
                                {key === 'medicationReminders' && (isRTL ? 'تذكيرات الدواء' : 'Medication Reminders')}
                                {key === 'weeklyReports' && (isRTL ? 'التقارير الأسبوعية' : 'Weekly Reports')}
                                {key === 'achievementAlerts' && (isRTL ? 'تنبيهات الإنجازات' : 'Achievement Alerts')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {isRTL ? 'تفعيل أو إلغاء هذا النوع من الإشعارات' : 'Enable or disable this type of notification'}
                              </div>
                            </div>
                            <button
                              onClick={() => setNotifications({ ...notifications, [key]: !value })}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                value ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                value ? 'translate-x-6' : 'translate-x-0.5'
                              }`}></div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy & Security Settings */}
                  {activeTab === 'privacy' && (
                    <div>
                      <h3 className="text-xl font-bold text-dark-blue mb-6">
                        {isRTL ? 'الخصوصية والأمان' : 'Privacy & Security'}
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'مستوى رؤية الملف الشخصي' : 'Profile Visibility'}
                          </label>
                          <select
                            value={privacy.profileVisibility}
                            onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="public">{isRTL ? 'عام' : 'Public'}</option>
                            <option value="friends">{isRTL ? 'الأصدقاء فقط' : 'Friends Only'}</option>
                            <option value="private">{isRTL ? 'خاص' : 'Private'}</option>
                          </select>
                        </div>
                        
                        {Object.entries(privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gradient-to-r from-light-blue/30 to-container-blue/30 rounded-lg">
                            <div>
                              <div className="font-semibold text-dark-blue">
                                {key === 'shareData' && (isRTL ? 'مشاركة البيانات للبحث' : 'Share Data for Research')}
                                {key === 'analytics' && (isRTL ? 'تحليلات الاستخدام' : 'Usage Analytics')}
                                {key === 'location' && (isRTL ? 'خدمات الموقع' : 'Location Services')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {key === 'shareData' && (isRTL ? 'المساهمة في البحوث الطبية المجهولة' : 'Contribute to anonymous medical research')}
                                {key === 'analytics' && (isRTL ? 'مساعدة في تحسين التطبيق' : 'Help improve the app experience')}
                                {key === 'location' && (isRTL ? 'للميزات المرتبطة بالموقع' : 'For location-based features')}
                              </div>
                            </div>
                            <button
                              onClick={() => setPrivacy({ ...privacy, [key]: !value })}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                value ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                value ? 'translate-x-6' : 'translate-x-0.5'
                              }`}></div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* App Preferences */}
                  {activeTab === 'preferences' && (
                    <div>
                      <h3 className="text-xl font-bold text-dark-blue mb-6">
                        {isRTL ? 'تفضيلات التطبيق' : 'App Preferences'}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'اللغة' : 'Language'}
                          </label>
                          <select
                            value={preferences.language}
                            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'وحدات القياس' : 'Measurement Units'}
                          </label>
                          <select
                            value={preferences.units}
                            onChange={(e) => setPreferences({ ...preferences, units: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="metric">{isRTL ? 'متري' : 'Metric'}</option>
                            <option value="imperial">{isRTL ? 'إمبراطوري' : 'Imperial'}</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'تنسيق الوقت' : 'Time Format'}
                          </label>
                          <select
                            value={preferences.timeFormat}
                            onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="12h">{isRTL ? '12 ساعة' : '12 Hour'}</option>
                            <option value="24h">{isRTL ? '24 ساعة' : '24 Hour'}</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'المظهر' : 'Theme'}
                          </label>
                          <select
                            value={preferences.theme}
                            onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                          >
                            <option value="light">{isRTL ? 'فاتح' : 'Light'}</option>
                            <option value="dark">{isRTL ? 'داكن' : 'Dark'}</option>
                            <option value="auto">{isRTL ? 'تلقائي' : 'Auto'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Goals */}
                  {activeTab === 'goals' && (
                    <div>
                      <h3 className="text-xl font-bold text-dark-blue mb-6">
                        {isRTL ? 'الأهداف اليومية المخصصة' : 'Custom Daily Goals'}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'الخطوات اليومية' : 'Daily Steps'}
                          </label>
                          <input
                            type="number"
                            value={goals.dailySteps}
                            onChange={(e) => setGoals({ ...goals, dailySteps: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                            placeholder="10000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'شرب الماء (لتر)' : 'Water Intake (L)'}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={goals.waterIntake}
                            onChange={(e) => setGoals({ ...goals, waterIntake: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                            placeholder="2.5"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'ساعات النوم' : 'Sleep Hours'}
                          </label>
                          <input
                            type="number"
                            value={goals.sleepHours}
                            onChange={(e) => setGoals({ ...goals, sleepHours: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                            placeholder="8"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-blue mb-2">
                            {isRTL ? 'السعرات الحرارية اليومية' : 'Daily Calories'}
                          </label>
                          <input
                            type="number"
                            value={goals.dailyCalories}
                            onChange={(e) => setGoals({ ...goals, dailyCalories: e.target.value })}
                            className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                            placeholder="2000"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
