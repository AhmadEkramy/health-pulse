import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Heart, Menu, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { auth } from '../lib/firebase';

interface HeartRateMonitoringProps {
  isRTL: boolean;
}

interface HeartRateReading {
  bpm: number;
  timestamp: Timestamp;
  activity: string;
  userId: string;
}

const HeartRateMonitoring = ({ isRTL }: HeartRateMonitoringProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState(72);
  const [manualBpm, setManualBpm] = useState('');
  const [activity, setActivity] = useState('resting');
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentReadings, setRecentReadings] = useState<HeartRateReading[]>([]);

  useEffect(() => {
    fetchHeartRateData();
  }, []);

  const fetchHeartRateData = async () => {
    try {
      if (!auth.currentUser) return;

      const readingsRef = collection(db, 'heartRateReadings');
      
      // Get readings for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const q = query(
        readingsRef,
        where('userId', '==', auth.currentUser.uid),
        where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const readings: HeartRateReading[] = [];
      querySnapshot.forEach((doc) => {
        readings.push(doc.data() as HeartRateReading);
      });

      setRecentReadings(readings.slice(0, 5)); // Only show 5 most recent readings
      if (readings.length > 0) {
        setCurrentHeartRate(readings[0].bpm);
      }

      // Process all readings for weekly data
      const weekData = processWeeklyData(readings);
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
    }
  };

  const processWeeklyData = (readings: HeartRateReading[]) => {
    const days = isRTL 
      ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
      : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    // Create a map to store readings by day
    const readingsByDay = new Map<string, HeartRateReading[]>();
    
    // Initialize the map with empty arrays for each day
    days.forEach(day => readingsByDay.set(day, []));
    
    // Group readings by day
    readings.forEach(reading => {
      const date = reading.timestamp.toDate();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const arabicDayName = date.toLocaleDateString('ar-SA', { weekday: 'short' });
      const dayKey = isRTL ? arabicDayName : dayName;
      
      const dayReadings = readingsByDay.get(dayKey) || [];
      dayReadings.push(reading);
      readingsByDay.set(dayKey, dayReadings);
    });

    // Process readings for each day
    return days.map(day => {
      const dayReadings = readingsByDay.get(day) || [];
      
      if (dayReadings.length === 0) {
        return { day, resting: 0, max: 0, avg: 0 };
      }

      // Calculate statistics
      const restingReadings = dayReadings.filter(r => r.activity === 'resting');
      const allBpms = dayReadings.map(r => r.bpm);
      
      const resting = restingReadings.length > 0
        ? Math.round(restingReadings.reduce((acc, r) => acc + r.bpm, 0) / restingReadings.length)
        : 0;
        
      const max = Math.max(...allBpms);
      
      const avg = Math.round(allBpms.reduce((acc, bpm) => acc + bpm, 0) / allBpms.length);

      return {
        day,
        resting,
        max,
        avg
      };
    });
  };

  const logHeartRate = async () => {
    try {
      if (!auth.currentUser) {
        alert(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
        return;
      }

      setIsLoading(true);
      const bpm = parseInt(manualBpm);
      
      if (isNaN(bpm) || bpm < 30 || bpm > 220) {
        alert(isRTL ? 'يرجى إدخال معدل نبض صالح (30-220)' : 'Please enter a valid heart rate (30-220)');
        return;
      }

      const reading: HeartRateReading = {
        bpm,
        timestamp: Timestamp.now(),
        activity,
        userId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'heartRateReadings'), reading);
      setManualBpm('');
      setCurrentHeartRate(bpm);
      await fetchHeartRateData();
    } catch (error) {
      console.error('Error logging heart rate:', error);
      alert(isRTL ? 'حدث خطأ أثناء حفظ البيانات' : 'Error saving data');
    } finally {
      setIsLoading(false);
    }
  };

  const heartRateZones = [
    { name: isRTL ? 'الراحة' : 'Resting', min: 60, max: 100, color: 'bg-blue-500', current: currentHeartRate >= 60 && currentHeartRate <= 100 },
    { name: isRTL ? 'خفيف' : 'Light', min: 101, max: 120, color: 'bg-green-500', current: currentHeartRate >= 101 && currentHeartRate <= 120 },
    { name: isRTL ? 'متوسط' : 'Moderate', min: 121, max: 140, color: 'bg-yellow-500', current: currentHeartRate >= 121 && currentHeartRate <= 140 },
    { name: isRTL ? 'عالي' : 'High', min: 141, max: 160, color: 'bg-orange-500', current: currentHeartRate >= 141 && currentHeartRate <= 160 },
    { name: isRTL ? 'أقصى' : 'Maximum', min: 161, max: 200, color: 'bg-red-500', current: currentHeartRate >= 161 }
  ];

  const avgResting = weeklyData.length > 0 
    ? Math.round(weeklyData.reduce((acc, day) => acc + (day.resting || 0), 0) / weeklyData.length) 
    : 0;

  const avgMax = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((acc, day) => acc + (day.max || 0), 0) / weeklyData.length)
    : 0;

  const getHeartRateStatus = (bpm: number) => {
    if (bpm < 60) return { status: 'low', color: 'text-blue-500', message: isRTL ? 'منخفض' : 'Low' };
    if (bpm <= 100) return { status: 'normal', color: 'text-green-500', message: isRTL ? 'طبيعي' : 'Normal' };
    if (bpm <= 120) return { status: 'elevated', color: 'text-yellow-500', message: isRTL ? 'مرتفع قليلاً' : 'Slightly Elevated' };
    return { status: 'high', color: 'text-red-500', message: isRTL ? 'مرتفع' : 'High' };
  };

  const currentStatus = getHeartRateStatus(currentHeartRate);

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
                <Heart className="w-8 h-8 text-red-500 animate-pulse" />
                <span>{isRTL ? 'مراقبة معدل ضربات القلب' : 'Heart Rate Monitoring'}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Live Heart Rate */}
            <div className="lg:col-span-1">
              <div className="glow-card text-center">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'معدل ضربات القلب الحالي' : 'Current Heart Rate'}
                </h3>
                
                {/* Heart Rate Display */}
                <div className="relative mb-8">
                  <div className="w-48 h-48 mx-auto border-8 border-red-200 rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                    <div className="text-center">
                      <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <div className="text-4xl font-bold text-red-600 mb-1">
                        {currentHeartRate}
                      </div>
                      <div className="text-lg text-gray-600">BPM</div>
                    </div>
                  </div>
                </div>

                {/* Manual Heart Rate Logging Form */}
                <div className="space-y-4">
                  <div>
                    <input
                      type="number"
                      value={manualBpm}
                      onChange={(e) => setManualBpm(e.target.value)}
                      placeholder={isRTL ? 'أدخل معدل ضربات القلب' : 'Enter heart rate'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
                      min="30"
                      max="220"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
                    >
                      <option value="resting">{isRTL ? 'راحة' : 'Resting'}</option>
                      <option value="exercise">{isRTL ? 'تمرين' : 'Exercise'}</option>
                      <option value="walking">{isRTL ? 'مشي' : 'Walking'}</option>
                      <option value="sleeping">{isRTL ? 'نوم' : 'Sleeping'}</option>
                    </select>
                  </div>

                  <button
                    onClick={logHeartRate}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'glow-button hover:scale-105'
                    }`}
                  >
                    {isLoading 
                      ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                      : (isRTL ? 'تسجيل القراءة' : 'Log Reading')
                    }
                  </button>
                </div>

                {/* Status message */}
                {currentHeartRate > 100 && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {isRTL ? 'نبضك مرتفع قليلاً' : 'Your heart rate is slightly elevated'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Heart Rate Zones & Trends */}
            <div className="lg:col-span-2 space-y-6">
              {/* Heart Rate Zones */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'مناطق معدل ضربات القلب' : 'Heart Rate Zones'}
                </h3>
                
                <div className="space-y-4">
                  {heartRateZones.map((zone, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      zone.current 
                        ? 'border-accent-blue bg-accent-blue/10 shadow-glow' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${zone.color} ${zone.current ? 'animate-pulse' : ''}`}></div>
                          <span className="font-semibold text-dark-blue">{zone.name}</span>
                          {zone.current && (
                            <span className="text-accent-blue font-bold">
                              {isRTL ? '← أنت هنا' : '← You are here'}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-600">
                          {zone.min}-{zone.max} BPM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Trends */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>{isRTL ? 'الاتجاهات الأسبوعية' : 'Weekly Trends'}</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{avgResting || 0}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط الراحة' : 'Avg Resting'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{avgMax || 0}</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'متوسط الأقصى' : 'Avg Maximum'}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-gray-600">{isRTL ? 'معدل صحي' : 'Healthy Rate'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 text-sm font-medium text-dark-blue">{day.day}</div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'راحة' : 'Resting'}</span>
                            <span className="text-blue-500 font-semibold">{day.resting || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                              style={{ width: `${((day.resting || 0) / 100) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'متوسط' : 'Average'}</span>
                            <span className="text-green-500 font-semibold">{day.avg || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{ width: `${((day.avg || 0) / 120) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isRTL ? 'أقصى' : 'Maximum'}</span>
                            <span className="text-red-500 font-semibold">{day.max || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-red-400 to-red-600"
                              style={{ width: `${((day.max || 0) / 180) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Readings */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Activity className="w-6 h-6" />
                  <span>{isRTL ? 'القراءات الأخيرة' : 'Recent Readings'}</span>
                </h3>
                
                <div className="space-y-4">
                  {recentReadings.map((reading, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${reading.bpm > 100 ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="font-medium">{formatTime(reading.timestamp)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{reading.bpm} BPM</div>
                        <div className="text-sm text-gray-600">{reading.activity}</div>
                      </div>
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

export default HeartRateMonitoring;
