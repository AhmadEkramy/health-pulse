import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Heart, Plus, Menu, AlertTriangle, TrendingUp, Activity, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface BloodPressureMonitoringProps {
  isRTL: boolean;
}

interface BloodPressureReading {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  time: string;
  date: Date;
  notes?: string;
  timestamp: Date;
}

const BloodPressureMonitoring = ({ isRTL }: BloodPressureMonitoringProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [newReading, setNewReading] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    time: '',
    notes: ''
  });

  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 90 || diastolic < 60) {
      return { 
        category: 'low', 
        color: 'text-blue-500', 
        bg: 'bg-blue-100', 
        message: isRTL ? 'منخفض' : 'Low',
        description: isRTL ? 'ضغط منخفض' : 'Hypotension'
      };
    }
    if (systolic < 120 && diastolic < 80) {
      return { 
        category: 'normal', 
        color: 'text-green-500', 
        bg: 'bg-green-100', 
        message: isRTL ? 'طبيعي' : 'Normal',
        description: isRTL ? 'ضغط طبيعي' : 'Normal Blood Pressure'
      };
    }
    if (systolic < 130 && diastolic < 80) {
      return { 
        category: 'elevated', 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-100', 
        message: isRTL ? 'مرتفع قليلاً' : 'Elevated',
        description: isRTL ? 'ضغط مرتفع قليلاً' : 'Elevated Blood Pressure'
      };
    }
    if (systolic < 140 || diastolic < 90) {
      return { 
        category: 'stage1', 
        color: 'text-orange-500', 
        bg: 'bg-orange-100', 
        message: isRTL ? 'مرحلة 1' : 'Stage 1',
        description: isRTL ? 'ارتفاع ضغط الدم - المرحلة 1' : 'High Blood Pressure Stage 1'
      };
    }
    if (systolic < 180 || diastolic < 120) {
      return { 
        category: 'stage2', 
        color: 'text-red-500', 
        bg: 'bg-red-100', 
        message: isRTL ? 'مرحلة 2' : 'Stage 2',
        description: isRTL ? 'ارتفاع ضغط الدم - المرحلة 2' : 'High Blood Pressure Stage 2'
      };
    }
    return { 
      category: 'crisis', 
      color: 'text-red-700', 
      bg: 'bg-red-200', 
      message: isRTL ? 'أزمة' : 'Crisis',
      description: isRTL ? 'أزمة ارتفاع ضغط الدم' : 'Hypertensive Crisis'
    };
  };

  const addReading = () => {
    if (!user) return;
    if (newReading.systolic && newReading.diastolic && newReading.time) {
      const now = new Date();
      const readingData = {
        userId: user.uid,
        systolic: Number(newReading.systolic),
        diastolic: Number(newReading.diastolic),
        pulse: Number(newReading.pulse) || 0,
        time: newReading.time,
        date: Timestamp.fromDate(now),
        notes: newReading.notes,
        timestamp: Timestamp.fromDate(now)
      };

      addDoc(collection(db, 'bloodPressureReadings'), readingData)
        .then((docRef) => {
          const reading: BloodPressureReading = {
            id: docRef.id,
            ...readingData,
            date: now,
            timestamp: now
          };
          setReadings([reading, ...readings]);
          setNewReading({
            systolic: '',
            diastolic: '',
            pulse: '',
            time: '',
            notes: ''
          });
          setShowAddModal(false);
          toast({
            title: isRTL ? 'تمت الإضافة' : 'Reading Added',
            description: isRTL ? 'تمت إضافة القراءة بنجاح' : 'Successfully added new reading',
          });
        })
        .catch((e) => {
          console.error('Error adding reading:', e);
          toast({
            variant: "destructive",
            title: isRTL ? 'خطأ' : 'Error',
            description: isRTL ? 'حدث خطأ أثناء إضافة القراءة' : 'Error adding reading',
          });
        });
    }
  };

  const deleteReading = async (readingId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'bloodPressureReadings', readingId));
      setReadings(readings.filter(r => r.id !== readingId));
      toast({
        title: isRTL ? 'تم الحذف' : 'Reading Deleted',
        description: isRTL ? 'تم حذف القراءة بنجاح' : 'Successfully deleted reading',
      });
    } catch (e) {
      console.error('Error deleting reading:', e);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء حذف القراءة' : 'Error deleting reading',
      });
    }
  };

  const getAverages = () => {
    if (readings.length === 0) return { systolic: 0, diastolic: 0, pulse: 0 };
    return {
      systolic: readings.reduce((acc, r) => acc + r.systolic, 0) / readings.length,
      diastolic: readings.reduce((acc, r) => acc + r.diastolic, 0) / readings.length,
      pulse: readings.reduce((acc, r) => acc + r.pulse, 0) / readings.length
    };
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchReadings = async () => {
      try {
        setError(null);
        const q = query(
          collection(db, 'bloodPressureReadings'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const readingsData: BloodPressureReading[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          readingsData.push({
            id: doc.id,
            userId: data.userId,
            systolic: data.systolic,
            diastolic: data.diastolic,
            pulse: data.pulse,
            time: data.time,
            date: data.date.toDate(),
            notes: data.notes,
            timestamp: data.timestamp.toDate()
          });
        });
        
        setReadings(readingsData);
      } catch (e) {
        console.error('Error fetching readings:', e);
        setError(isRTL ? 'حدث خطأ أثناء جلب البيانات' : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, [user, authLoading, navigate, isRTL]);

  const latestReading = readings[0];
  const latestCategory = latestReading ? getBloodPressureCategory(latestReading.systolic, latestReading.diastolic) : null;
  const averages = getAverages();

  const bpCategories = [
    { name: isRTL ? 'منخفض' : 'Low', range: '< 90/60', color: 'bg-blue-500' },
    { name: isRTL ? 'طبيعي' : 'Normal', range: '< 120/80', color: 'bg-green-500' },
    { name: isRTL ? 'مرتفع قليلاً' : 'Elevated', range: '120-129/<80', color: 'bg-yellow-500' },
    { name: isRTL ? 'مرحلة 1' : 'Stage 1', range: '130-139/80-89', color: 'bg-orange-500' },
    { name: isRTL ? 'مرحلة 2' : 'Stage 2', range: '140-179/90-119', color: 'bg-red-500' },
    { name: isRTL ? 'أزمة' : 'Crisis', range: '≥ 180/120', color: 'bg-red-700' }
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
                <Heart className="w-8 h-8 text-red-500 animate-pulse" />
                <span>{isRTL ? 'مراقبة ضغط الدم' : 'Blood Pressure Monitoring'}</span>
              </h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="glow-button flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'قراءة جديدة' : 'New Reading'}</span>
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
            <>
              {/* Current Status */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-red-500 mb-2">
                    {latestReading ? `${latestReading.systolic}/${latestReading.diastolic}` : '--/--'}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'آخر قراءة' : 'Latest Reading'}
                  </div>
                  <div className="text-sm text-gray-600">mmHg</div>
                  {latestCategory && (
                    <div className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${latestCategory.bg} ${latestCategory.color}`}>
                      {latestCategory.message}
                    </div>
                  )}
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-accent-blue mb-2">
                    {Math.round(averages.systolic)}/{Math.round(averages.diastolic)}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'المتوسط' : 'Average'}
                  </div>
                  <div className="text-sm text-gray-600">mmHg</div>
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {latestReading ? latestReading.pulse : '--'}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'النبض' : 'Pulse'}
                  </div>
                  <div className="text-sm text-gray-600">BPM</div>
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {readings.filter(r => getBloodPressureCategory(r.systolic, r.diastolic).category === 'normal').length}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'قراءات طبيعية' : 'Normal Readings'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isRTL ? 'من إجمالي' : 'of'} {readings.length}
                  </div>
                </div>
              </div>

              {/* Readings List */}
              <div className="glow-card mt-6">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Activity className="w-6 h-6" />
                  <span>{isRTL ? 'سجل القراءات' : 'Readings History'}</span>
                </h3>
                
                <div className="space-y-4">
                  {readings.map((reading) => (
                    <div
                      key={reading.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-gray-600 font-mono text-sm">
                                      <div>{reading.date instanceof Date ? format(reading.date, 'yyyy-MM-dd') : reading.date}</div>
          <div>{reading.time}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-dark-blue">
                              {reading.systolic}/{reading.diastolic} mmHg
                            </div>
                            <div className="text-sm text-gray-600">
                              {isRTL ? 'النبض:' : 'Pulse:'} {reading.pulse} BPM
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            getBloodPressureCategory(reading.systolic, reading.diastolic).bg
                          } ${getBloodPressureCategory(reading.systolic, reading.diastolic).color}`}>
                            {getBloodPressureCategory(reading.systolic, reading.diastolic).message}
                          </div>
                          <button
                            onClick={() => deleteReading(reading.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {reading.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          {reading.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Reading Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-dark-blue mb-4">
              {isRTL ? 'إضافة قراءة جديدة' : 'Add New Reading'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الضغط الانقباضي' : 'Systolic'} (mmHg)
                </label>
                <input
                  type="number"
                  value={newReading.systolic}
                  onChange={(e) => setNewReading({ ...newReading, systolic: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الضغط الانبساطي' : 'Diastolic'} (mmHg)
                </label>
                <input
                  type="number"
                  value={newReading.diastolic}
                  onChange={(e) => setNewReading({ ...newReading, diastolic: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'النبض' : 'Pulse'} (BPM)
                </label>
                <input
                  type="number"
                  value={newReading.pulse}
                  onChange={(e) => setNewReading({ ...newReading, pulse: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الوقت' : 'Time'}
                </label>
                <input
                  type="time"
                  value={newReading.time}
                  onChange={(e) => setNewReading({ ...newReading, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={newReading.notes}
                  onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={addReading}
                className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-primary-blue"
              >
                {isRTL ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodPressureMonitoring;
