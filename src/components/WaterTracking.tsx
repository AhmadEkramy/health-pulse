import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Droplets, Plus, Menu, Target, Calendar, TrendingUp } from 'lucide-react';
import QuickActionModals from './QuickActionModals';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import styles from './WaterTracking.module.css';

interface WaterTrackingProps {
  isRTL: boolean;
}

interface WaterIntake {
  amount: number;
  timestamp: string;
  userId: string;
}

interface DailyWaterData {
  date: string;
  totalIntake: number;
  entries: WaterIntake[];
}

const WaterTracking = ({ isRTL }: WaterTrackingProps) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2500);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayEntries, setTodayEntries] = useState<WaterIntake[]>([]);

  const glassOptions = [
    { label: isRTL ? "كوب صغير" : "Small Glass", amount: 250 },
    { label: isRTL ? "كوب متوسط" : "Medium Glass", amount: 500 },
    { label: isRTL ? "زجاجة" : "Bottle", amount: 1000 }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      fetchUserData(user.uid);
      fetchWeeklyData(user.uid);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.waterGoal) {
          setDailyGoal(userData.waterGoal);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const waterRef = collection(db, 'waterIntake');
      const todayQuery = query(
        waterRef,
        where('userId', '==', userId),
        where('date', '==', today)
      );

      const todaySnapshot = await getDocs(todayQuery);
      if (!todaySnapshot.empty) {
        const todayDoc = todaySnapshot.docs[0].data() as DailyWaterData;
        setCurrentIntake(todayDoc.totalIntake);
        setTodayEntries(todayDoc.entries || []);
      } else {
        // Initialize today's document if it doesn't exist
        const newDayRef = doc(collection(db, 'waterIntake'));
        await setDoc(newDayRef, {
          userId,
          date: today,
          totalIntake: 0,
          entries: []
        });
        setCurrentIntake(0);
        setTodayEntries([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في جلب البيانات" : "Error Fetching Data",
        description: isRTL ? "حدث خطأ أثناء جلب بياناتك" : "An error occurred while fetching your data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyData = async (userId: string) => {
    try {
      const waterRef = collection(db, 'waterIntake');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const weeklyQuery = query(
        waterRef,
        where('userId', '==', userId),
        where('date', '>=', sevenDaysAgo.toISOString().split('T')[0]),
        orderBy('date', 'desc'),
        limit(7)
      );

      const weeklySnapshot = await getDocs(weeklyQuery);
      const weeklyDataArray = weeklySnapshot.docs.map(doc => {
        const data = doc.data() as DailyWaterData;
        const date = new Date(data.date);
        const day = isRTL 
          ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][date.getDay()]
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        return {
          day,
          amount: data.totalIntake
        };
      });

      setWeeklyData(weeklyDataArray.reverse());
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    }
  };

  const handleWaterSubmit = async (amount: number) => {
    if (!auth.currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const waterRef = collection(db, 'waterIntake');
      const todayQuery = query(
        waterRef,
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );

      const todaySnapshot = await getDocs(todayQuery);
      const newEntry: WaterIntake = {
        amount,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      if (!todaySnapshot.empty) {
        const docRef = todaySnapshot.docs[0].ref;
        const currentData = todaySnapshot.docs[0].data() as DailyWaterData;
        
        await updateDoc(docRef, {
          totalIntake: currentData.totalIntake + amount,
          entries: [...(currentData.entries || []), newEntry]
        });

        setCurrentIntake(prev => prev + amount);
        setTodayEntries(prev => [...prev, newEntry]);
      } else {
        const newDayRef = doc(collection(db, 'waterIntake'));
        await setDoc(newDayRef, {
          userId: auth.currentUser.uid,
          date: today,
          totalIntake: amount,
          entries: [newEntry]
        });

        setCurrentIntake(amount);
        setTodayEntries([newEntry]);
      }

      // Refresh weekly data
      fetchWeeklyData(auth.currentUser.uid);

      toast({
        title: isRTL ? "تمت الإضافة بنجاح" : "Successfully Added",
        description: `${amount}ml ${isRTL ? "تمت إضافتها" : "has been added"}`,
      });
    } catch (error) {
      console.error('Error updating water intake:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في التحديث" : "Update Error",
        description: isRTL ? "حدث خطأ أثناء تحديث البيانات" : "An error occurred while updating the data",
      });
    }
  };

  const handleReset = async () => {
    if (!auth.currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const waterRef = collection(db, 'waterIntake');
      const todayQuery = query(
        waterRef,
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );

      const todaySnapshot = await getDocs(todayQuery);
      if (!todaySnapshot.empty) {
        const docRef = todaySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          totalIntake: 0,
          entries: []
        });

        setCurrentIntake(0);
        setTodayEntries([]);
        
        toast({
          title: isRTL ? "تم إعادة التعيين" : "Reset Complete",
          description: isRTL ? "تم إعادة تعيين بيانات اليوم" : "Today's data has been reset",
        });
      }
    } catch (error) {
      console.error('Error resetting water intake:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في إعادة التعيين" : "Reset Error",
        description: isRTL ? "حدث خطأ أثناء إعادة التعيين" : "An error occurred while resetting the data",
      });
    }
  };

  const handleRemoveLastEntry = async () => {
    if (!auth.currentUser || todayEntries.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const waterRef = collection(db, 'waterIntake');
      const todayQuery = query(
        waterRef,
        where('userId', '==', auth.currentUser.uid),
        where('date', '==', today)
      );

      const todaySnapshot = await getDocs(todayQuery);
      if (!todaySnapshot.empty) {
        const docRef = todaySnapshot.docs[0].ref;
        const lastEntry = todayEntries[todayEntries.length - 1];
        const newEntries = todayEntries.slice(0, -1);
        const newTotal = currentIntake - lastEntry.amount;

        await updateDoc(docRef, {
          totalIntake: newTotal,
          entries: newEntries
        });

        setCurrentIntake(newTotal);
        setTodayEntries(newEntries);

        toast({
          title: isRTL ? "تم الحذف" : "Entry Removed",
          description: `${lastEntry.amount}ml ${isRTL ? "تم حذفها" : "has been removed"}`,
        });
      }
    } catch (error) {
      console.error('Error removing last entry:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في الحذف" : "Remove Error",
        description: isRTL ? "حدث خطأ أثناء حذف آخر إدخال" : "An error occurred while removing the last entry",
      });
    }
  };

  const progress = (currentIntake / dailyGoal) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <div className="text-accent-blue">
          <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isRTL={isRTL} />

      <QuickActionModals
        isOpen={{
          meal: false,
          water: isWaterModalOpen,
          workout: false,
          sleep: false
        }}
        onClose={() => setIsWaterModalOpen(false)}
        isRTL={isRTL}
        onWaterSubmit={handleWaterSubmit}
      />

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
                <Droplets className="w-8 h-8 text-blue-500 animate-pulse" />
                <span>{isRTL ? "تتبع الماء" : "Water Tracking"}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Water Bottle Visualization */}
            <div className="lg:col-span-1">
              <div className="glow-card text-center">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? "مستوى الماء اليوم" : "Today's Water Level"}
                </h3>
                
                {/* Animated Water Bottle */}
                <div className="relative w-32 h-64 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-accent-blue rounded-b-full rounded-t-lg bg-gradient-to-t from-blue-100 to-transparent">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-200 rounded-b-full transition-all duration-1000"
                      style={{ height: `${Math.min(progress, 100)}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Bottle Cap */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-accent-blue rounded-t-lg"></div>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-dark-blue">
                    {currentIntake}ml
                  </div>
                  <div className="text-gray-600">
                    {isRTL ? "من" : "of"} {dailyGoal}ml
                  </div>
                  <div className="text-accent-blue font-semibold">
                    {Math.round(progress)}% {isRTL ? "مكتمل" : "Complete"}
                  </div>
                </div>

                {progress >= 100 && (
                  <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg animate-pulse-glow">
                    <div className="text-green-700 font-semibold">
                      🎉 {isRTL ? "تم تحقيق الهدف!" : "Goal Achieved!"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls and Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Add Water */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Plus className="w-6 h-6" />
                  <span>{isRTL ? "إضافة ماء" : "Add Water"}</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {glassOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleWaterSubmit(option.amount)}
                      className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg hover:from-blue-200 hover:to-blue-300 hover:shadow-glow-hover transition-all duration-300 hover:scale-105"
                    >
                      <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="font-semibold text-dark-blue">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.amount}ml</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsWaterModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-blue-100 text-blue-500 hover:bg-blue-200 transition-colors"
                    title={isRTL ? "إضافة كمية مخصصة" : "Add custom amount"}
                  >
                    {isRTL ? "إضافة" : "Add"}
                  </button>
                  <button
                    onClick={handleRemoveLastEntry}
                    disabled={todayEntries.length === 0}
                    className="px-4 py-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={isRTL ? "حذف آخر إضافة" : "Remove last entry"}
                  >
                    {isRTL ? "حذف" : "Remove"}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={currentIntake === 0}
                    className="px-4 py-2 rounded-lg bg-orange-100 text-orange-500 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={isRTL ? "إعادة تعيين الكل" : "Reset all"}
                  >
                    {isRTL ? "إعادة تعيين" : "Reset"}
                  </button>
                </div>
              </div>

              {/* Daily Progress */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Target className="w-6 h-6" />
                  <span>{isRTL ? "التقدم اليومي" : "Daily Progress"}</span>
                </h3>
                
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 animate-glow-pulse"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{currentIntake}ml</div>
                    <div className="text-sm text-gray-600">{isRTL ? "مستهلك" : "Consumed"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent-blue">{dailyGoal - currentIntake > 0 ? dailyGoal - currentIntake : 0}ml</div>
                    <div className="text-sm text-gray-600">{isRTL ? "متبقي" : "Remaining"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{Math.round(progress)}%</div>
                    <div className="text-sm text-gray-600">{isRTL ? "مكتمل" : "Complete"}</div>
                  </div>
                </div>
              </div>

              {/* Weekly Record Section */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>{isRTL ? "السجل الأسبوعي" : "Weekly Record"}</span>
                </h3>
                
                <div className="grid grid-cols-7 gap-4">
                  {weeklyData.map((data, index) => (
                    <div key={index} className="text-center">
                      {/* Animated Water Bottle */}
                      <div className="relative h-40 w-12 mx-auto mb-2">
                        {/* Bottle Container */}
                        <div className="absolute inset-0 border-2 border-accent-blue rounded-b-full rounded-t-lg">
                          {/* Water Fill Animation */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-200 rounded-b-full transition-all duration-1000"
                            style={{ 
                              height: `${Math.min((data.amount / dailyGoal) * 100, 100)}%`,
                              opacity: 0.8
                            }}
                          >
                            {/* Water Surface Effect */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 animate-pulse"></div>
                            {/* Water Bubbles */}
                            <div className="absolute inset-0 overflow-hidden">
                              <div className={styles['bubble-sm']}></div>
                              <div className={styles['bubble-md']}></div>
                              <div className={styles['bubble-lg']}></div>
                            </div>
                          </div>
                          {/* Bottle Neck */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-accent-blue rounded-t-lg"></div>
                          {/* Bottle Shine Effect */}
                          <div className="absolute top-0 left-1/2 w-1/4 h-full bg-white/10 transform -translate-x-1/2 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Day Label */}
                      <div className="text-sm font-medium text-gray-600">
                        {data.day}
                      </div>
                      
                      {/* Amount */}
                      <div className="text-xs">
                        <span className={`font-medium ${data.amount >= dailyGoal ? 'text-green-500' : 'text-blue-500'}`}>
                          {data.amount}ml
                        </span>
                        <div className="text-xs text-gray-400">
                          {Math.round((data.amount / dailyGoal) * 100)}%
                        </div>
                      </div>
                      
                      {/* Goal Achievement Indicator */}
                      {data.amount >= dailyGoal && (
                        <div className="mt-1">
                          <span className="inline-block text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                            ✓
                          </span>
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

export default WaterTracking;
