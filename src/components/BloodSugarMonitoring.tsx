import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Monitor, Plus, Menu, AlertTriangle, TrendingUp, Clock, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface BloodSugarMonitoringProps {
  isRTL: boolean;
}

interface BloodSugarReading {
  id: string;
  userId: string;
  value: number;
  type: 'fasting' | 'postMeal' | 'bedtime' | 'random';
  time: string;
  date: Date;
  notes?: string;
  timestamp: Date;
}

const BloodSugarMonitoring = ({ isRTL }: BloodSugarMonitoringProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [newReading, setNewReading] = useState({
    value: '',
    type: 'fasting' as 'fasting' | 'postMeal' | 'bedtime' | 'random',
    time: '',
    notes: ''
  });

  const [readingTypes] = useState([
    { id: 'fasting', name: isRTL ? 'صائم' : 'Fasting', normalRange: '70-100 mg/dL' },
    { id: 'postMeal', name: isRTL ? 'بعد الوجبة' : 'Post-Meal', normalRange: '< 140 mg/dL' },
    { id: 'bedtime', name: isRTL ? 'قبل النوم' : 'Bedtime', normalRange: '100-140 mg/dL' },
    { id: 'random', name: isRTL ? 'عشوائي' : 'Random', normalRange: '< 200 mg/dL' }
  ]);

  const getBloodSugarStatus = (value: number, type: string) => {
    switch (type) {
      case 'fasting':
        if (value < 70) return { status: 'low', color: 'text-blue-500', bg: 'bg-blue-100', message: isRTL ? 'منخفض' : 'Low' };
        if (value <= 100) return { status: 'normal', color: 'text-green-500', bg: 'bg-green-100', message: isRTL ? 'طبيعي' : 'Normal' };
        if (value <= 125) return { status: 'prediabetic', color: 'text-yellow-500', bg: 'bg-yellow-100', message: isRTL ? 'مقدمات السكري' : 'Pre-diabetic' };
        return { status: 'diabetic', color: 'text-red-500', bg: 'bg-red-100', message: isRTL ? 'مرتفع' : 'High' };
      
      case 'postMeal':
        if (value < 70) return { status: 'low', color: 'text-blue-500', bg: 'bg-blue-100', message: isRTL ? 'منخفض' : 'Low' };
        if (value <= 140) return { status: 'normal', color: 'text-green-500', bg: 'bg-green-100', message: isRTL ? 'طبيعي' : 'Normal' };
        if (value <= 180) return { status: 'elevated', color: 'text-yellow-500', bg: 'bg-yellow-100', message: isRTL ? 'مرتفع قليلاً' : 'Slightly High' };
        return { status: 'high', color: 'text-red-500', bg: 'bg-red-100', message: isRTL ? 'مرتفع' : 'High' };
      
      default:
        if (value < 70) return { status: 'low', color: 'text-blue-500', bg: 'bg-blue-100', message: isRTL ? 'منخفض' : 'Low' };
        if (value <= 140) return { status: 'normal', color: 'text-green-500', bg: 'bg-green-100', message: isRTL ? 'طبيعي' : 'Normal' };
        return { status: 'high', color: 'text-red-500', bg: 'bg-red-100', message: isRTL ? 'مرتفع' : 'High' };
    }
  };

  const addReading = () => {
    if (!user) return;
    if (newReading.value && newReading.time) {
      const now = new Date();
      const readingData = {
        userId: user.uid,
        value: Number(newReading.value),
        type: newReading.type,
        time: newReading.time,
        date: Timestamp.fromDate(now),
        notes: newReading.notes,
        timestamp: Timestamp.fromDate(now)
      };

      addDoc(collection(db, 'bloodSugarReadings'), readingData)
        .then((docRef) => {
          const reading: BloodSugarReading = {
            id: docRef.id,
            ...readingData,
            date: now,
            timestamp: now
          };
          setReadings([reading, ...readings]);
          setNewReading({
            value: '',
            type: 'fasting',
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
      await deleteDoc(doc(db, 'bloodSugarReadings', readingId));
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

  const getAverage = (type?: string) => {
    const filteredReadings = type ? readings.filter(r => r.type === type) : readings;
    if (filteredReadings.length === 0) return 0;
    return filteredReadings.reduce((acc, reading) => acc + reading.value, 0) / filteredReadings.length;
  };

  const getTrendData = () => {
    const last7Days = readings.slice(0, 7).reverse();
    return last7Days.map(reading => ({
      date: format(reading.date, 'yyyy-MM-dd'),
      value: reading.value,
      type: reading.type
    }));
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
          collection(db, 'bloodSugarReadings'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const readingsData: BloodSugarReading[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          readingsData.push({
            id: doc.id,
            userId: data.userId,
            value: data.value,
            type: data.type,
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
  const latestStatus = latestReading ? getBloodSugarStatus(latestReading.value, latestReading.type) : null;

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
                <Monitor className="w-8 h-8 text-purple-500 animate-pulse" />
                <span>{isRTL ? 'مراقبة سكر الدم' : 'Blood Sugar Monitoring'}</span>
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
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {latestReading ? latestReading.value : '--'}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'آخر قراءة' : 'Latest Reading'}
                  </div>
                  <div className="text-sm text-gray-600">mg/dL</div>
                  {latestStatus && (
                    <div className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${latestStatus.bg} ${latestStatus.color}`}>
                      {latestStatus.message}
                    </div>
                  )}
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {Math.round(getAverage('fasting'))}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'متوسط الصائم' : 'Avg Fasting'}
                  </div>
                  <div className="text-sm text-gray-600">mg/dL</div>
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {Math.round(getAverage('postMeal'))}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'متوسط بعد الوجبة' : 'Avg Post-Meal'}
                  </div>
                  <div className="text-sm text-gray-600">mg/dL</div>
                </div>
                
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-accent-blue mb-2">
                    {readings.filter(r => getBloodSugarStatus(r.value, r.type).status === 'normal').length}
                  </div>
                  <div className="text-dark-blue font-semibold">
                    {isRTL ? 'قراءات طبيعية' : 'Normal Readings'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isRTL ? 'من إجمالي' : 'of'} {readings.length}
                  </div>
                </div>
              </div>

              {/* Reference Ranges */}
              <div className="glow-card">
                <h3 className="text-xl font-bold text-dark-blue mb-6">
                  {isRTL ? 'المعدلات المرجعية' : 'Reference Ranges'}
                </h3>
                
                <div className="space-y-4">
                  {readingTypes.map((type) => (
                    <div key={type.id} className="p-4 bg-gradient-to-r from-light-blue/30 to-container-blue/30 rounded-lg">
                      <div className="font-semibold text-dark-blue mb-1">{type.name}</div>
                      <div className="text-sm text-gray-600">{type.normalRange}</div>
                      <div className="text-sm text-accent-blue font-semibold">
                        {isRTL ? 'عدد القراءات:' : 'Readings:'} {readings.filter(r => r.type === type.id).length}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                <div className="mt-6">
                  <h4 className="font-bold text-dark-blue mb-4">{isRTL ? 'تنبيهات' : 'Alerts'}</h4>
                  {readings.some(r => getBloodSugarStatus(r.value, r.type).status === 'high') && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-3">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {isRTL ? 'لديك قراءات مرتفعة' : 'You have high readings'}
                        </span>
                      </div>
                    </div>
                  )}
                  {readings.some(r => getBloodSugarStatus(r.value, r.type).status === 'low') && (
                    <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {isRTL ? 'لديك قراءات منخفضة' : 'You have low readings'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Readings List */}
              <div className="glow-card mt-6">
                <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                  <Clock className="w-6 h-6" />
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
                            <div>{format(reading.date, 'yyyy-MM-dd')}</div>
                            <div>{reading.time}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-dark-blue">
                              {reading.value} mg/dL
                            </div>
                            <div className="text-sm text-gray-600">
                              {readingTypes.find(t => t.id === reading.type)?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            getBloodSugarStatus(reading.value, reading.type).bg
                          } ${getBloodSugarStatus(reading.value, reading.type).color}`}>
                            {getBloodSugarStatus(reading.value, reading.type).message}
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
                  {isRTL ? 'القيمة' : 'Value'} (mg/dL)
                </label>
                <input
                  type="number"
                  value={newReading.value}
                  onChange={(e) => setNewReading({ ...newReading, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'النوع' : 'Type'}
                </label>
                <select
                  value={newReading.type}
                  onChange={(e) => setNewReading({ ...newReading, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {readingTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
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

export default BloodSugarMonitoring;
