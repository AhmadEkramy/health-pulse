import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Bell, Plus, Menu, Clock, Droplets, Activity, Trash2, Edit } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

interface RemindersProps {
  isRTL: boolean;
}

interface Reminder {
  id: string;
  title: string;
  type: 'hydration' | 'exercise' | 'mental' | 'medication' | 'meal';
  frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
  time: string;
  isActive: boolean;
  completedToday: number;
  targetPerDay: number;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

const Reminders = ({ isRTL }: RemindersProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState({
    title: '',
    type: 'hydration' as 'hydration' | 'exercise' | 'mental' | 'medication' | 'meal',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'custom',
    time: '',
    targetPerDay: 1
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newReminders: Reminder[] = [];
        snapshot.forEach((doc) => {
          newReminders.push({ id: doc.id, ...doc.data() } as Reminder);
        });
        setReminders(newReminders);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching reminders:', err);
        setError(isRTL ? 'حدث خطأ أثناء جلب التذكيرات' : 'Error fetching reminders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isRTL]);

  const reminderTypes = [
    { id: 'hydration', name: isRTL ? 'ترطيب' : 'Hydration', icon: <Droplets className="w-5 h-5" />, color: 'text-blue-500' },
    { id: 'exercise', name: isRTL ? 'تمرين' : 'Exercise', icon: <Activity className="w-5 h-5" />, color: 'text-green-500' },
    { id: 'mental', name: isRTL ? 'عقلي' : 'Mental', icon: <Bell className="w-5 h-5" />, color: 'text-purple-500' },
    { id: 'medication', name: isRTL ? 'دواء' : 'Medication', icon: <Clock className="w-5 h-5" />, color: 'text-red-500' },
    { id: 'meal', name: isRTL ? 'وجبة' : 'Meal', icon: <Activity className="w-5 h-5" />, color: 'text-orange-500' }
  ];

  const frequencies = [
    { id: 'hourly', name: isRTL ? 'كل ساعة' : 'Hourly' },
    { id: 'daily', name: isRTL ? 'يومياً' : 'Daily' },
    { id: 'weekly', name: isRTL ? 'أسبوعياً' : 'Weekly' },
    { id: 'custom', name: isRTL ? 'مخصص' : 'Custom' }
  ];

  const getTypeInfo = (type: string) => {
    return reminderTypes.find(t => t.id === type);
  };

  const toggleReminder = async (id: string) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;

      const reminderRef = doc(db, 'reminders', id);
      await updateDoc(reminderRef, {
        isActive: !reminder.isActive,
        updatedAt: serverTimestamp()
      });

      toast({
        title: isRTL ? 'تم تحديث التذكير' : 'Reminder Updated',
        description: isRTL ? 'تم تحديث حالة التذكير بنجاح' : 'Reminder status updated successfully',
      });
    } catch (err) {
      console.error('Error toggling reminder:', err);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحديث التذكير' : 'Error updating reminder',
      });
    }
  };

  const markCompleted = async (id: string) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;

      const newCount = Math.min(reminder.completedToday + 1, reminder.targetPerDay);
      const reminderRef = doc(db, 'reminders', id);
      await updateDoc(reminderRef, {
        completedToday: newCount,
        updatedAt: serverTimestamp()
      });

      toast({
        title: isRTL ? 'تم تحديث التقدم' : 'Progress Updated',
        description: isRTL ? 'تم تحديث تقدم التذكير بنجاح' : 'Reminder progress updated successfully',
      });
    } catch (err) {
      console.error('Error marking reminder as completed:', err);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحديث التقدم' : 'Error updating progress',
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
      
      toast({
        title: isRTL ? 'تم حذف التذكير' : 'Reminder Deleted',
        description: isRTL ? 'تم حذف التذكير بنجاح' : 'Reminder deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting reminder:', err);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء حذف التذكير' : 'Error deleting reminder',
      });
    }
  };

  const addReminder = async () => {
    if (!user) return;
    
    try {
      if (newReminder.title && newReminder.time) {
        const reminderData = {
          ...newReminder,
          userId: user.uid,
          isActive: true,
          completedToday: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'reminders'), reminderData);
        
        setNewReminder({
          title: '',
          type: 'hydration',
          frequency: 'daily',
          time: '',
          targetPerDay: 1
        });
        setShowAddModal(false);

        toast({
          title: isRTL ? 'تمت إضافة التذكير' : 'Reminder Added',
          description: isRTL ? 'تمت إضافة التذكير بنجاح' : 'Reminder added successfully',
        });
      }
    } catch (err) {
      console.error('Error adding reminder:', err);
      toast({
        variant: "destructive",
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء إضافة التذكير' : 'Error adding reminder',
      });
    }
  };

  const getCompletionRate = () => {
    const totalTargets = reminders.reduce((acc, reminder) => acc + reminder.targetPerDay, 0);
    const totalCompleted = reminders.reduce((acc, reminder) => acc + reminder.completedToday, 0);
    return totalTargets > 0 ? (totalCompleted / totalTargets) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-blue/20 to-white flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-accent-blue hover:underline"
          >
            {isRTL ? 'إعادة المحاولة' : 'Try Again'}
          </button>
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
                <Bell className="w-8 h-8 text-yellow-500 animate-pulse" />
                <span>{isRTL ? 'التذكيرات' : 'Reminders'}</span>
              </h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="glow-button flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'تذكير جديد' : 'New Reminder'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glow-card text-center">
              <div className="text-3xl font-bold text-accent-blue mb-2">{reminders.length}</div>
              <div className="text-dark-blue font-semibold">{isRTL ? 'إجمالي التذكيرات' : 'Total Reminders'}</div>
            </div>
            <div className="glow-card text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {reminders.filter(r => r.isActive).length}
              </div>
              <div className="text-dark-blue font-semibold">{isRTL ? 'نشط' : 'Active'}</div>
            </div>
            <div className="glow-card text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {reminders.reduce((acc, r) => acc + r.completedToday, 0)}
              </div>
              <div className="text-dark-blue font-semibold">{isRTL ? 'مكتمل اليوم' : 'Completed Today'}</div>
            </div>
            <div className="glow-card text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {Math.round(getCompletionRate())}%
              </div>
              <div className="text-dark-blue font-semibold">{isRTL ? 'معدل الإنجاز' : 'Completion Rate'}</div>
            </div>
          </div>

          {/* Reminders List */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {reminders.map((reminder) => {
              const typeInfo = getTypeInfo(reminder.type);
              const completionPercentage = (reminder.completedToday / reminder.targetPerDay) * 100;
              
              return (
                <div key={reminder.id} className="glow-card hover:scale-105 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`${typeInfo?.color} animate-pulse`}>
                        {typeInfo?.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-dark-blue">{reminder.title}</h3>
                        <p className="text-sm text-gray-600">
                          {isRTL ? 'نوع:' : 'Type:'} {typeInfo?.name} | 
                          {isRTL ? ' تكرار:' : ' Frequency:'} {frequencies.find(f => f.id === reminder.frequency)?.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleReminder(reminder.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          reminder.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          reminder.isActive ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </button>
                      <button className="text-gray-500 hover:text-accent-blue transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{isRTL ? 'التقدم اليومي' : 'Daily Progress'}</span>
                      <span>{reminder.completedToday}/{reminder.targetPerDay}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-accent-blue to-primary-blue transition-all duration-1000"
                        style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      reminder.isActive 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      {reminder.isActive 
                        ? (isRTL ? 'نشط' : 'Active')
                        : (isRTL ? 'غير نشط' : 'Inactive')
                      }
                    </span>
                    
                    <button
                      onClick={() => markCompleted(reminder.id)}
                      disabled={reminder.completedToday >= reminder.targetPerDay}
                      className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-primary-blue disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRTL ? 'تم' : 'Done'}
                    </button>
                  </div>

                  {completionPercentage >= 100 && (
                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg animate-pulse-glow">
                      <div className="text-green-700 font-semibold text-center">
                        ✅ {isRTL ? 'تم إنجاز المهام اليوم!' : 'All tasks completed today!'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion Stats */}
          <div className="glow-card">
            <h3 className="text-xl font-bold text-dark-blue mb-6">
              {isRTL ? 'إحصائيات الإنجاز' : 'Completion Statistics'}
            </h3>
            
            <div className="space-y-4">
              {reminderTypes.map((type) => {
                const typeReminders = reminders.filter(r => r.type === type.id);
                const totalCompleted = typeReminders.reduce((acc, r) => acc + r.completedToday, 0);
                const totalTarget = typeReminders.reduce((acc, r) => acc + r.targetPerDay, 0);
                const percentage = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

                return (
                  <div key={type.id} className="flex items-center space-x-4">
                    <div className={`${type.color}`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-dark-blue">{type.name}</span>
                        <span className="text-accent-blue font-semibold">
                          {totalCompleted}/{totalTarget} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-accent-blue to-primary-blue transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-glow-lg">
            <h3 className="text-xl font-bold text-dark-blue mb-6">
              {isRTL ? 'إضافة تذكير جديد' : 'Add New Reminder'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">
                  {isRTL ? 'عنوان التذكير' : 'Reminder Title'}
                </label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                  placeholder={isRTL ? 'أدخل عنوان التذكير' : 'Enter reminder title'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-blue mb-2">
                    {isRTL ? 'النوع' : 'Type'}
                  </label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as any })}
                    className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                  >
                    {reminderTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-blue mb-2">
                    {isRTL ? 'التكرار' : 'Frequency'}
                  </label>
                  <select
                    value={newReminder.frequency}
                    onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value as any })}
                    className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.id} value={freq.id}>{freq.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-blue mb-2">
                    {isRTL ? 'الوقت' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-blue mb-2">
                    {isRTL ? 'المرات يومياً' : 'Times per day'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newReminder.targetPerDay}
                    onChange={(e) => setNewReminder({ ...newReminder, targetPerDay: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={addReminder}
                className="flex-1 glow-button"
              >
                {isRTL ? 'إضافة تذكير' : 'Add Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;