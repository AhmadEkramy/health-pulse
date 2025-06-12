import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Target, Plus, Menu, Edit, Trash2, Calendar } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface GoalsProps {
  isRTL: boolean;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  createdAt: Date;
  updatedAt: Date;
}

const Goals = ({ isRTL }: GoalsProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'fitness',
    target: 0,
    unit: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newProgress, setNewProgress] = useState(0);

  const categories = [
    { id: 'fitness', name: isRTL ? 'اللياقة' : 'Fitness', color: 'bg-green-500' },
    { id: 'hydration', name: isRTL ? 'الترطيب' : 'Hydration', color: 'bg-blue-500' },
    { id: 'sleep', name: isRTL ? 'النوم' : 'Sleep', color: 'bg-purple-500' },
    { id: 'nutrition', name: isRTL ? 'التغذية' : 'Nutrition', color: 'bg-orange-500' }
  ];

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }

    // Subscribe to goals collection
    const unsubscribe = onSnapshot(
      query(collection(db, 'goals'), where('userId', '==', user.uid)),
      (snapshot) => {
        const newGoals: Goal[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          newGoals.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            category: data.category,
            target: data.target,
            current: data.current || 0,
            unit: data.unit,
            priority: data.priority,
            deadline: data.deadline,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        setGoals(newGoals);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching goals:', err);
        setError(isRTL ? 'حدث خطأ أثناء جلب الأهداف' : 'Error fetching goals');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, navigate, isRTL]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-500';
  };

  const handleAddGoal = async () => {
    if (!user) return;

    try {
      if (newGoal.title && newGoal.target > 0) {
        const goalData = {
          userId: user.uid,
          title: newGoal.title,
          category: newGoal.category,
          target: newGoal.target,
          current: 0,
          unit: newGoal.unit,
          priority: newGoal.priority,
          deadline: newGoal.deadline,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'goals'), goalData);

        setNewGoal({
          title: '',
          category: 'fitness',
          target: 0,
          unit: '',
          priority: 'medium',
          deadline: ''
        });
        setShowAddModal(false);

        toast({
          title: isRTL ? 'تم إضافة الهدف بنجاح' : 'Goal added successfully',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Error adding goal:', err);
      toast({
        title: isRTL ? 'حدث خطأ أثناء إضافة الهدف' : 'Error adding goal',
        variant: 'destructive'
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'goals', id));
      toast({
        title: isRTL ? 'تم حذف الهدف بنجاح' : 'Goal deleted successfully',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast({
        title: isRTL ? 'حدث خطأ أثناء حذف الهدف' : 'Error deleting goal',
        variant: 'destructive'
      });
    }
  };

  const updateGoalProgress = async (id: string, current: number) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'goals', id), {
        current,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Error updating goal progress:', err);
      toast({
        title: isRTL ? 'حدث خطأ أثناء تحديث التقدم' : 'Error updating progress',
        variant: 'destructive'
      });
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const handleEditProgress = (goal: Goal) => {
    setEditingGoal(goal);
    setNewProgress(goal.current);
    setShowEditModal(true);
  };

  const handleUpdateProgress = async () => {
    if (!user || !editingGoal) return;

    try {
      await updateDoc(doc(db, 'goals', editingGoal.id), {
        current: newProgress,
        updatedAt: Timestamp.now()
      });

      setShowEditModal(false);
      setEditingGoal(null);
      
      toast({
        title: isRTL ? 'تم تحديث التقدم بنجاح' : 'Progress updated successfully',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error updating progress:', err);
      toast({
        title: isRTL ? 'حدث خطأ أثناء تحديث التقدم' : 'Error updating progress',
        variant: 'destructive'
      });
    }
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
                <Target className="w-8 h-8 text-green-500 animate-pulse" />
                <span>{isRTL ? 'الأهداف' : 'Goals'}</span>
              </h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="glow-button flex items-center space-x-2"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'هدف جديد' : 'New Goal'}</span>
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
              {/* Stats Overview */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">{goals.length}</div>
                  <div className="text-dark-blue font-semibold">{isRTL ? 'إجمالي الأهداف' : 'Total Goals'}</div>
                </div>
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-accent-blue mb-2">
                    {goals.filter(g => getProgress(g) >= 100).length}
                  </div>
                  <div className="text-dark-blue font-semibold">{isRTL ? 'أهداف محققة' : 'Completed'}</div>
                </div>
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {goals.filter(g => g.priority === 'high').length}
                  </div>
                  <div className="text-dark-blue font-semibold">{isRTL ? 'أولوية عالية' : 'High Priority'}</div>
                </div>
                <div className="glow-card text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {goals.length > 0 ? Math.round(goals.reduce((acc, goal) => acc + getProgress(goal), 0) / goals.length) : 0}%
                  </div>
                  <div className="text-dark-blue font-semibold">{isRTL ? 'متوسط التقدم' : 'Avg Progress'}</div>
                </div>
              </div>

              {/* Goals List */}
              <div className="grid lg:grid-cols-2 gap-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="glow-card hover:scale-105 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${getCategoryColor(goal.category)}`}></div>
                        <h3 className="text-lg font-bold text-dark-blue">{goal.title}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditProgress(goal)}
                          className="text-gray-500 hover:text-accent-blue transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-dark-blue font-semibold">
                          {goal.current} / {goal.target} {goal.unit}
                        </span>
                        <span className="text-accent-blue font-bold">
                          {Math.round(getProgress(goal))}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-accent-blue to-primary-blue transition-all duration-1000 animate-glow-pulse"
                          style={{ width: `${getProgress(goal)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(goal.priority)}`}>
                        {isRTL ? 
                          (goal.priority === 'high' ? 'عالية' : goal.priority === 'medium' ? 'متوسطة' : 'منخفضة') :
                          goal.priority}
                      </span>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{goal.deadline}</span>
                      </div>
                    </div>

                    {getProgress(goal) >= 100 && (
                      <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg animate-pulse-glow">
                        <div className="text-green-700 font-semibold text-center">
                          🎉 {isRTL ? 'تم تحقيق الهدف!' : 'Goal Achieved!'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-dark-blue mb-4">
              {isRTL ? 'إضافة هدف جديد' : 'Add New Goal'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'عنوان الهدف' : 'Goal Title'}
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  placeholder={isRTL ? 'أدخل عنوان الهدف' : 'Enter goal title'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الفئة' : 'Category'}
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'القيمة المستهدفة' : 'Target Value'}
                  </label>
                  <input
                    type="number"
                    value={newGoal.target || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'الوحدة' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    placeholder={isRTL ? 'مثل: كجم، خطوة' : 'e.g., kg, steps'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الأولوية' : 'Priority'}
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                >
                  <option value="high">{isRTL ? 'عالية' : 'High'}</option>
                  <option value="medium">{isRTL ? 'متوسطة' : 'Medium'}</option>
                  <option value="low">{isRTL ? 'منخفضة' : 'Low'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الموعد النهائي' : 'Deadline'}
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddGoal}
                className="glow-button"
                disabled={!newGoal.title || newGoal.target <= 0}
              >
                {isRTL ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Progress Modal */}
      {showEditModal && editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-dark-blue mb-4">
              {isRTL ? 'تحديث التقدم' : 'Update Progress'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الهدف' : 'Goal'}
                </label>
                <div className="text-dark-blue font-semibold">
                  {editingGoal.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'التقدم الحالي' : 'Current Progress'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    min="0"
                    max={editingGoal.target}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  />
                  <span className="text-gray-600">{editingGoal.unit}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {isRTL ? 'الهدف:' : 'Target:'} {editingGoal.target} {editingGoal.unit}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-accent-blue to-primary-blue transition-all duration-300"
                  style={{ width: `${Math.min((newProgress / editingGoal.target) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {Math.round((newProgress / editingGoal.target) * 100)}%
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGoal(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleUpdateProgress}
                className="glow-button"
                disabled={newProgress < 0 || newProgress > editingGoal.target}
              >
                {isRTL ? 'تحديث' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
