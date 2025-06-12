import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Clock, Moon, Sun, Menu, TrendingUp, Target, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface SleepTrackingProps {
  isRTL: boolean;
}

interface SleepSession {
  id: string;
  userId: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  duration: number;
  deepSleep: number;
  date: Date;
}

const SleepTracking = ({ isRTL }: SleepTrackingProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [sleepData, setSleepData] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }

    fetchSleepData();
  }, [user, authLoading, navigate]);

  const fetchSleepData = async () => {
    if (!user) return;
    
    try {
      setError(null);
      setLoading(true);

      const sleepRef = collection(db, 'sleep');
      const q = query(
        sleepRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedSleepData: SleepSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSleepData.push({
          id: doc.id,
          userId: data.userId,
          bedtime: data.bedtime,
          wakeTime: data.wakeTime,
          quality: data.quality,
          duration: data.duration,
          deepSleep: data.deepSleep,
          date: data.date.toDate()
        });
      });

      setSleepData(fetchedSleepData);
    } catch (error: any) {
      console.error('Error fetching sleep data:', error);
      setError(isRTL ? 'حدث خطأ أثناء جلب البيانات' : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSleepDuration = (bedTime: string, wakeTime: string) => {
    const bed = new Date(`2024-01-01 ${bedTime}`);
    const wake = new Date(`2024-01-02 ${wakeTime}`);
    const duration = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    return duration.toFixed(1);
  };

  const handleSaveSleep = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    try {
      setError(null);
      const duration = parseFloat(calculateSleepDuration(bedtime, wakeTime));
      const deepSleep = Math.round(duration * 0.25 * 10) / 10; // Approximately 25% of total sleep

      const sleepSession = {
        userId: user.uid,
        bedtime,
        wakeTime,
        quality: sleepQuality,
        duration,
        deepSleep,
        date: Timestamp.now()
      };

      await addDoc(collection(db, 'sleep'), sleepSession);
      await fetchSleepData();

      // Reset form
      setBedtime('22:30');
      setWakeTime('07:00');
      setSleepQuality(4);
    } catch (error) {
      console.error('Error saving sleep session:', error);
      setError(isRTL ? 'حدث خطأ أثناء حفظ البيانات' : 'Error saving data');
    }
  };

  const averageSleep = sleepData.length > 0
    ? sleepData.reduce((acc, day) => acc + day.duration, 0) / sleepData.length
    : 0;

  const averageQuality = sleepData.length > 0
    ? sleepData.reduce((acc, day) => acc + day.quality, 0) / sleepData.length
    : 0;

  const averageDeepSleep = sleepData.length > 0
    ? sleepData.reduce((acc, day) => acc + day.deepSleep, 0) / sleepData.length
    : 0;

  const goalAchievement = sleepData.length > 0
    ? (sleepData.filter(day => day.duration >= 7).length / sleepData.length) * 100
    : 0;

  const calculateImprovement = () => {
    if (sleepData.length < 2) return 0;
    
    const recentAvg = sleepData.slice(-3).reduce((acc, day) => acc + day.duration, 0) / 3;
    const previousAvg = sleepData.slice(0, 3).reduce((acc, day) => acc + day.duration, 0) / 3;
    
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  };

  const handleResetSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Starting to delete all sleep sessions...');

      const sleepRef = collection(db, 'sleep');
      const q = query(sleepRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      console.log(`Found ${querySnapshot.size} sessions to delete`);

      const deletePromises = querySnapshot.docs.map(async (doc) => {
        console.log(`Deleting session ${doc.id}`);
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);
      console.log('All sessions deleted successfully');

      // Clear local state
      setSleepData([]);
      
      toast({
        title: isRTL ? "تم إعادة التعيين" : "Reset Complete",
        description: isRTL ? "تم حذف جميع جلسات النوم" : "All sleep sessions have been deleted",
      });
    } catch (error) {
      console.error('Error resetting sessions:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "حدث خطأ أثناء إعادة التعيين" : "Error resetting sleep sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <div className="text-xl text-dark-blue">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <div className="text-xl text-red-500">
          {error}
        </div>
      </div>
    );
  }

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
                <Moon className="w-8 h-8 text-purple-500 animate-pulse" />
                <span>{isRTL ? 'مراقبة النوم' : 'Sleep Tracking'}</span>
              </h1>
            </div>

            <button
              onClick={handleResetSessions}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isRTL ? 'إعادة تعيين' : 'Reset All'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sleep Input */}
            <div className="lg:col-span-1 space-y-6">
              {/* Log Sleep Session */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'تسجيل جلسة النوم' : 'Log Sleep Session'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      <Moon className="w-4 h-4 inline-block mr-1" />
                      {isRTL ? 'وقت النوم' : 'Bedtime'}
                    </label>
                    <input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      <Sun className="w-4 h-4 inline-block mr-1" />
                      {isRTL ? 'وقت الاستيقاظ' : 'Wake Time'}
                    </label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      {isRTL ? 'جودة النوم' : 'Sleep Quality'} ({sleepQuality}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{isRTL ? 'سيء' : 'Poor'}</span>
                      <span>{isRTL ? 'ممتاز' : 'Excellent'}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full glow-button"
                    onClick={handleSaveSleep}
                  >
                    {isRTL ? 'حفظ جلسة النوم' : 'Save Sleep Session'}
                  </button>
                </div>
              </div>

              {/* Sleep Duration Calculator */}
              <div className="glow-card text-center">
                <h3 className="text-xl font-bold text-dark-blue mb-4">
                  {isRTL ? 'مدة النوم المحسوبة' : 'Calculated Sleep Duration'}
                </h3>
                <div className="text-4xl font-bold text-accent-blue mb-2">
                  {calculateSleepDuration(bedtime, wakeTime)}h
                </div>
                <div className="text-gray-600">
                  {isRTL ? 'مدة النوم المتوقعة' : 'Expected Sleep Duration'}
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2 animate-pulse" />
                  <div className="text-sm text-gray-700">
                    {isRTL ? 'الهدف الموصى به: 7-9 ساعات' : 'Recommended Target: 7-9 hours'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sleep Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sleep Summary */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'ملخص النوم' : 'Sleep Summary'}
                </h3>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">{averageSleep.toFixed(1)}h</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط النوم' : 'Avg Sleep'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">{averageQuality.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط الجودة' : 'Avg Quality'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{averageDeepSleep.toFixed(1)}h</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'النوم العميق' : 'Deep Sleep'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-500">{goalAchievement.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'كفاءة النوم' : 'Sleep Efficiency'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600 mb-2" />
                    <div className="font-semibold text-dark-blue">{isRTL ? 'تحقيق الهدف' : 'Goal Achievement'}</div>
                    <div className="text-2xl font-bold text-purple-600">{goalAchievement.toFixed(0)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                    <div className="font-semibold text-dark-blue">{isRTL ? 'تحسن هذا الأسبوع' : 'This Week Improvement'}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {calculateImprovement() >= 0 ? '+' : ''}{calculateImprovement().toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Sleep Pattern Chart */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'أنماط النوم الأسبوعية' : 'Weekly Sleep Patterns'}
                </h3>
                
                <div className="space-y-4">
                  {sleepData.map((day, index) => (
                    <div key={day.id} className="flex items-center space-x-4">
                      <div className="w-16 text-sm font-medium text-dark-blue">
                        {format(day.date, isRTL ? 'MM/dd' : 'dd/MM')}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'المدة' : 'Duration'}</span>
                            <span className="text-purple-500 font-semibold">{day.duration.toFixed(1)}h</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((day.duration / 12) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'الجودة' : 'Quality'}</span>
                            <span className="text-blue-500 font-semibold">{day.quality}/5</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(day.quality / 5) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'النوم العميق' : 'Deep'}</span>
                            <span className="text-green-500 font-semibold">{day.deepSleep.toFixed(1)}h</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((day.deepSleep / 4) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sleep Tips */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-4">
                  {isRTL ? 'نصائح لنوم أفضل' : 'Sleep Tips & Recommendations'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'حافظ على جدول نوم منتظم' : 'Maintain a consistent sleep schedule'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'تجنب الكافيين قبل النوم بـ 6 ساعات' : 'Avoid caffeine 6 hours before bedtime'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'اجعل غرفة النوم باردة ومظلمة' : 'Keep bedroom cool and dark'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'تجنب الشاشات قبل النوم بساعة' : 'Avoid screens 1 hour before bed'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'جرب تقنيات الاسترخاء' : 'Try relaxation techniques'}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                      <p className="text-gray-700">{isRTL ? 'مارس الرياضة بانتظام' : 'Exercise regularly'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SleepTracking;
