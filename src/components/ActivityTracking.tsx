import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Activity, Play, Pause, Square, Menu, Timer, Flame, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';

interface ActivityTrackingProps {
  isRTL: boolean;
}

interface ActivitySession {
  id: string;
  activityType: string;
  duration: number;
  calories: number;
  distance?: number;
  avgBpm?: number;
  timestamp: Date;
}

interface WorkoutSession {
  id: string;
  activityType: string;
  duration: number;
  calories: number;
  distance: number;
  avgBpm: number;
  timestamp: Timestamp;
}

const ActivityTracking = ({ isRTL }: ActivityTrackingProps) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('running');
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0);
  const [avgBpm, setAvgBpm] = useState(0);
  const [todayStats, setTodayStats] = useState({
    totalDuration: 0,
    totalCalories: 0,
    totalDistance: 0,
    avgBpm: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);

  const activities = [
    { id: 'running', name: isRTL ? 'الجري' : 'Running', caloriesPerMin: 12, icon: '🏃' },
    { id: 'cycling', name: isRTL ? 'ركوب الدراجة' : 'Cycling', caloriesPerMin: 8, icon: '🚴' },
    { id: 'swimming', name: isRTL ? 'السباحة' : 'Swimming', caloriesPerMin: 15, icon: '🏊' },
    { id: 'walking', name: isRTL ? 'المشي' : 'Walking', caloriesPerMin: 5, icon: '🚶' },
    { id: 'yoga', name: isRTL ? 'اليوجا' : 'Yoga', caloriesPerMin: 3, icon: '🧘' },
    { id: 'strength', name: isRTL ? 'تدريب القوة' : 'Strength Training', caloriesPerMin: 10, icon: '💪' }
  ];

  useEffect(() => {
    if (user) {
      fetchTodayStats();
      fetchWeeklyData();
      fetchWorkoutHistory();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', user?.uid),
        where('timestamp', '>=', today)
      );

      const querySnapshot = await getDocs(q);
      let stats = {
        totalDuration: 0,
        totalCalories: 0,
        totalDistance: 0,
        avgBpm: 0,
      };
      let totalBpm = 0;
      let bpmCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalDuration += data.duration || 0;
        stats.totalCalories += data.calories || 0;
        stats.totalDistance += data.distance || 0;
        if (data.avgBpm) {
          totalBpm += data.avgBpm;
          bpmCount++;
        }
      });

      if (bpmCount > 0) {
        stats.avgBpm = Math.round(totalBpm / bpmCount);
      }

      setTodayStats(stats);
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', user?.uid),
        where('timestamp', '>=', sevenDaysAgo),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const dailyData: { [key: string]: { calories: number; duration: number } } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = format(data.timestamp.toDate(), 'EEE');
        if (!dailyData[date]) {
          dailyData[date] = { calories: 0, duration: 0 };
        }
        dailyData[date].calories += data.calories || 0;
        dailyData[date].duration += data.duration || 0;
      });

      const formattedData = Object.entries(dailyData).map(([day, stats]) => ({
        day: isRTL ? translateDayToArabic(day) : day,
        calories: stats.calories,
        duration: stats.duration,
      }));

      setWeeklyData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setLoading(false);
    }
  };

  const fetchWorkoutHistory = async () => {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', user?.uid),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const history: WorkoutSession[] = [];
      
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as WorkoutSession);
      });

      setWorkoutHistory(history);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      await deleteDoc(doc(db, 'activities', workoutId));
      await fetchWorkoutHistory();
      await fetchTodayStats();
      await fetchWeeklyData();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const translateDayToArabic = (day: string) => {
    const translations: { [key: string]: string } = {
      'Sun': 'الأحد',
      'Mon': 'الاثنين',
      'Tue': 'الثلاثاء',
      'Wed': 'الأربعاء',
      'Thu': 'الخميس',
      'Fri': 'الجمعة',
      'Sat': 'السبت'
    };
    return translations[day] || day;
  };

  const startActivity = () => {
    setIsActive(true);
    const intervalId = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        setDisplayMinutes(Math.floor(newDuration / 60));
        setDisplaySeconds(newDuration % 60);
        const currentActivity = activities.find(a => a.id === selectedActivity);
        if (currentActivity) {
          setCalories(Math.round((newDuration / 60) * currentActivity.caloriesPerMin));
        }
        return newDuration;
      });
    }, 1000);
    setTimer(intervalId);
  };

  const pauseActivity = () => {
    setIsActive(false);
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  const stopActivity = async () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setIsActive(false);

    if (duration > 0) {
      try {
        const activityData = {
          userId: user?.uid,
          activityType: selectedActivity,
          duration: Math.floor(duration / 60),
          calories,
          distance: Math.round((duration / 60) * 0.1),
          avgBpm: Math.round(120 + Math.random() * 30),
          timestamp: Timestamp.now()
        };

        await addDoc(collection(db, 'activities'), activityData);
        await fetchTodayStats();
        await fetchWeeklyData();
      } catch (error) {
        console.error('Error saving activity:', error);
      }
    }

    setDuration(0);
    setDisplayMinutes(0);
    setDisplaySeconds(0);
    setCalories(0);
    setDistance(0);
    setAvgBpm(0);
  };

  const currentActivity = activities.find(a => a.id === selectedActivity);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <div className="text-xl text-dark-blue">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
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
                <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                <span>{isRTL ? 'تتبع النشاط' : 'Activity Tracking'}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Activity Control */}
            <div className="lg:col-span-1 space-y-6">
              {/* Activity Selection */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'اختر النشاط' : 'Select Activity'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity.id)}
                      className={`p-4 rounded-lg transition-all duration-300 ${
                        selectedActivity === activity.id
                          ? 'bg-accent-blue text-white shadow-glow'
                          : 'bg-gray-100 hover:bg-gray-200 hover:shadow-glow-md'
                      }`}
                    >
                      <div className="text-2xl mb-2">{activity.icon}</div>
                      <div className="font-semibold text-sm">{activity.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Session */}
              <div className="glow-card text-center">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'الجلسة الحالية' : 'Current Session'}
                </h3>
                
                <div className="text-6xl mb-4">{currentActivity?.icon}</div>
                <div className="text-lg font-semibold text-dark-blue mb-6">
                  {currentActivity?.name}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg">
                    <Timer className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-dark-blue">
                      {displayMinutes}:{displaySeconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-600">{isRTL ? 'دقيقة' : 'Time'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg">
                    <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-dark-blue">{calories}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'سعرة' : 'calories'}</div>
                  </div>
                </div>

                <div className="flex space-x-2 justify-center">
                  {!isActive ? (
                    <button
                      onClick={startActivity}
                      className="glow-button flex items-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>{isRTL ? 'ابدأ' : 'Start'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseActivity}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 hover:shadow-glow-hover transition-all duration-300 flex items-center space-x-2"
                    >
                      <Pause className="w-5 h-5" />
                      <span>{isRTL ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </button>
                  )}
                  <button
                    onClick={stopActivity}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 hover:shadow-glow-hover transition-all duration-300 flex items-center space-x-2"
                  >
                    <Square className="w-5 h-5" />
                    <span>{isRTL ? 'إيقاف' : 'Stop'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats and Trends */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Summary */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'ملخص اليوم' : "Today's Summary"}
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent-blue">{todayStats.totalDuration}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'دقيقة' : 'Minutes'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-500">{todayStats.totalCalories}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'سعرة' : 'Calories'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{todayStats.totalDistance.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'كم' : 'km'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">{todayStats.avgBpm || 0}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط نبض' : 'Avg BPM'}</div>
                  </div>
                </div>
              </div>

              {/* Weekly Trends */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'الاتجاهات الأسبوعية' : 'Weekly Trends'}
                </h3>
                <div className="space-y-4">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 text-sm font-medium text-dark-blue">{day.day}</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'السعرات' : 'Calories'}</span>
                            <span className="text-orange-500 font-semibold">{day.calories}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((day.calories / 1000) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'الدقائق' : 'Minutes'}</span>
                            <span className="text-accent-blue font-semibold">{day.duration}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((day.duration / 120) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout History */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'سجل التمارين' : 'Workout History'}
                </h3>
                <div className="space-y-4">
                  {workoutHistory.map((workout) => {
                    const activityDetails = activities.find(a => a.id === workout.activityType);
                    return (
                      <div
                        key={workout.id}
                        className="bg-white rounded-lg shadow-glow p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{activityDetails?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-dark-blue">
                              {activityDetails?.name || workout.activityType}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {format(workout.timestamp.toDate(), 'PPp')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Timer className="w-4 h-4 text-blue-500" />
                              <span>{workout.duration} min</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span>{workout.calories} cal</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteWorkout(workout.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title={isRTL ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {workoutHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {isRTL ? 'لا يوجد سجل تمارين بعد' : 'No workout history yet'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityTracking;
