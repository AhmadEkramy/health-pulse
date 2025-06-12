import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Activity, Plus, Menu, Target, TrendingUp, Award, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface StepsTrackingProps {
  isRTL: boolean;
}

interface StepsData {
  id: string;
  userId: string;
  steps: number;
  goal: number;
  date: Date;
}

const StepsTracking = ({ isRTL }: StepsTrackingProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dailySteps, setDailySteps] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [manualSteps, setManualSteps] = useState('');
  const [weeklyData, setWeeklyData] = useState<StepsData[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalSteps: 0,
    averageDaily: 0,
    bestDay: 0,
    goalsAchieved: 0,
    totalDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      console.log('Auth is still loading...');
      return;
    }
    
    if (!user) {
      console.log('No user found, redirecting to signin...');
      navigate('/signin');
      return;
    }

    console.log('User authenticated:', user.uid);
    fetchStepsData();
  }, [user, authLoading, navigate]);

  const fetchStepsData = async () => {
    if (!user) return;
    
    try {
      setError(null);
      console.log('Fetching steps data for user:', user.uid);

      // Get all user's steps data
      const stepsRef = collection(db, 'steps');
      const q = query(stepsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedStepsData: StepsData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedStepsData.push({
          id: doc.id,
          userId: data.userId,
          steps: data.steps,
          goal: data.goal,
          date: data.date.toDate()
        });
      });

      console.log('Fetched steps data:', fetchedStepsData);

      // Calculate monthly statistics
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyData = fetchedStepsData.filter(data => data.date >= firstDayOfMonth);
      
      if (monthlyData.length > 0) {
        const totalSteps = monthlyData.reduce((acc, data) => acc + data.steps, 0);
        const bestDay = Math.max(...monthlyData.map(data => data.steps));
        const goalsAchieved = monthlyData.filter(data => data.steps >= data.goal).length;
        
        setMonthlyStats({
          totalSteps,
          averageDaily: Math.round(totalSteps / monthlyData.length),
          bestDay,
          goalsAchieved,
          totalDays: monthlyData.length
        });
      }

      // Get the last 7 days of data
      const todayStart = startOfDay(new Date());
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(today, i));
        const existingData = fetchedStepsData.find(
          data => startOfDay(data.date).getTime() === date.getTime()
        );

        return existingData || {
          id: `temp-${date.getTime()}`,
          userId: user.uid,
          steps: 0,
          goal: 10000,
          date
        };
      }).reverse();

      // Set today's data
      const todayData = last7Days[last7Days.length - 1];
      setDailySteps(todayData.steps);
      setDailyGoal(todayData.goal);

      setWeeklyData(last7Days);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching steps data:', error);
      setError(isRTL ? 'حدث خطأ أثناء جلب البيانات' : 'Error fetching data');
      setLoading(false);
    }
  };

  const addManualSteps = async () => {
    if (!user) return;
    if (!manualSteps || Number(manualSteps) <= 0) return;

    try {
      const newSteps = Number(manualSteps);
      const today = new Date();
      const todayStart = startOfDay(today);
      
      // Check if we already have an entry for today
      const existingEntry = weeklyData.find(
        data => startOfDay(data.date).getTime() === todayStart.getTime()
      );

      if (existingEntry && existingEntry.id.startsWith('temp-')) {
        // Create new document for today
        const stepsDoc = {
          userId: user.uid,
          steps: newSteps,
          goal: dailyGoal,
          date: Timestamp.fromDate(today)
        };

        const docRef = await addDoc(collection(db, 'steps'), stepsDoc);
        console.log('Created new steps document:', docRef.id);
      } else if (existingEntry) {
        // Update existing document
        const updatedSteps = existingEntry.steps + newSteps;
        await updateDoc(doc(db, 'steps', existingEntry.id), {
          steps: updatedSteps
        });
        console.log('Updated existing steps document:', existingEntry.id);
      }

      // Refresh data
      await fetchStepsData();
      setManualSteps('');
      
      toast({
        title: isRTL ? 'تم إضافة الخطوات' : 'Steps Added',
        description: isRTL ? `تمت إضافة ${newSteps} خطوة` : `Added ${newSteps} steps`,
      });
    } catch (error) {
      console.error('Error adding steps:', error);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء إضافة الخطوات' : 'Error adding steps',
      });
    }
  };

  const handleResetSteps = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Starting to delete all steps data...');

      const stepsRef = collection(db, 'steps');
      const q = query(stepsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      console.log(`Found ${querySnapshot.size} records to delete`);

      const deletePromises = querySnapshot.docs.map(async (doc) => {
        console.log(`Deleting record ${doc.id}`);
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);
      console.log('All steps data deleted successfully');

      // Reset local state
      setDailySteps(0);
      setWeeklyData([]);
      setMonthlyStats({
        totalSteps: 0,
        averageDaily: 0,
        bestDay: 0,
        goalsAchieved: 0,
        totalDays: 0
      });
      
      toast({
        title: isRTL ? "تم إعادة التعيين" : "Reset Complete",
        description: isRTL ? "تم حذف جميع بيانات الخطوات" : "All steps data has been deleted",
      });

      // Refresh data
      await fetchStepsData();
    } catch (error) {
      console.error('Error resetting steps data:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "حدث خطأ أثناء إعادة التعيين" : "Error resetting steps data",
      });
    } finally {
      setLoading(false);
    }
  };

  const badges = [
    { id: 1, name: isRTL ? 'البداية' : 'First Steps', icon: '👟', unlocked: true },
    { id: 2, name: isRTL ? '5000 خطوة' : '5K Walker', icon: '🚶', unlocked: true },
    { id: 3, name: isRTL ? '10000 خطوة' : '10K Champion', icon: '🏆', unlocked: true },
    { id: 4, name: isRTL ? 'الماراثون' : 'Marathon Master', icon: '🏃', unlocked: false },
    { id: 5, name: isRTL ? 'الاستمرارية' : 'Consistency King', icon: '👑', unlocked: false },
    { id: 6, name: isRTL ? 'الأسطورة' : 'Legend', icon: '⭐', unlocked: false }
  ];

  const progress = (dailySteps / dailyGoal) * 100;
  const averageWeekly = weeklyData.reduce((acc, day) => acc + day.steps, 0) / weeklyData.length;

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
                <Activity className="w-8 h-8 text-green-500 animate-pulse" />
                <span>{isRTL ? 'تتبع الخطوات' : 'Steps Tracking'}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Daily Progress */}
            <div className="lg:col-span-1">
              <div className="glow-card text-center">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'خطوات اليوم' : "Today's Steps"}
                </h3>
                
                {/* Circular Progress */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#00b4de"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (progress / 100) * 251.2}
                      className="transition-all duration-1000 animate-glow-pulse"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-dark-blue">
                      {dailySteps.toLocaleString()}
                    </div>
                    <div className="text-gray-600">{isRTL ? 'خطوة' : 'steps'}</div>
                    <div className="text-accent-blue font-semibold">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-lg text-dark-blue">
                    {isRTL ? 'الهدف:' : 'Goal:'} {dailyGoal.toLocaleString()}
                  </div>
                  <div className="text-accent-blue font-semibold">
                    {dailyGoal - dailySteps > 0 
                      ? `${(dailyGoal - dailySteps).toLocaleString()} ${isRTL ? 'خطوة متبقية' : 'steps to go'}`
                      : `${isRTL ? 'تم تحقيق الهدف!' : 'Goal Achieved!'} 🎉`
                    }
                  </div>
                </div>

                {progress >= 100 && (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg animate-pulse-glow mb-4">
                    <div className="text-green-700 font-semibold">
                      🏆 {isRTL ? 'أحسنت! لقد حققت هدفك اليومي!' : 'Great! You achieved your daily goal!'}
                    </div>
                  </div>
                )}

                {/* Manual Entry */}
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={manualSteps}
                      onChange={(e) => setManualSteps(e.target.value)}
                      placeholder={isRTL ? 'إضافة خطوات يدوياً' : 'Add steps manually'}
                      className="flex-1 px-3 py-2 border border-accent-blue/30 rounded-lg glow-input text-sm"
                    />
                    <button
                      onClick={addManualSteps}
                      className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-primary-blue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weekly Trend */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>{isRTL ? 'الاتجاه الأسبوعي' : 'Weekly Trend'}</span>
                </h3>
                
                <div className="space-y-4 mb-6">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 text-sm font-medium text-dark-blue">{day.date.toLocaleDateString()}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{day.steps.toLocaleString()} {isRTL ? 'خطوة' : 'steps'}</span>
                          <span className={`font-semibold ${day.steps >= day.goal ? 'text-green-500' : 'text-orange-500'}`}>
                            {Math.round((day.steps / day.goal) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ${
                              day.steps >= day.goal 
                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                : 'bg-gradient-to-r from-orange-400 to-orange-600'
                            }`}
                            style={{ width: `${Math.min((day.steps / day.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-light-blue/30 to-container-blue/30 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-blue">
                      {Math.round(averageWeekly).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isRTL ? 'متوسط الخطوات الأسبوعية' : 'Weekly Average Steps'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Statistics */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Target className="w-6 h-6" />
                  <span>{isRTL ? 'إحصائيات الشهر' : 'Monthly Statistics'}</span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(monthlyStats.totalSteps / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'إجمالي الخطوات' : 'Total Steps'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {monthlyStats.averageDaily.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط يومي' : 'Daily Avg'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {monthlyStats.bestDay.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'أفضل يوم' : 'Best Day'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {monthlyStats.goalsAchieved}
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'أهداف محققة' : 'Goals Hit'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-accent-blue/20 to-primary-blue/20 rounded-lg">
                    <div className="text-2xl font-bold text-accent-blue">
                      {Math.round((monthlyStats.goalsAchieved / monthlyStats.totalDays) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'معدل النجاح' : 'Success Rate'}</div>
                  </div>
                </div>
              </div>

              {/* Badges & Achievements */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Award className="w-6 h-6" />
                  <span>{isRTL ? 'الإنجازات والأوسمة' : 'Badges & Achievements'}</span>
                </h3>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`text-center p-4 rounded-lg transition-all duration-300 ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 hover:shadow-glow-md hover:scale-105'
                          : 'bg-gray-100 opacity-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className={`text-sm font-semibold ${
                        badge.unlocked ? 'text-yellow-700' : 'text-gray-500'
                      }`}>
                        {badge.name}
                      </div>
                      {badge.unlocked && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {isRTL ? '✓ مفتوح' : '✓ Unlocked'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StepsTracking;
