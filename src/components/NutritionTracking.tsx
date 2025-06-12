import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { UtensilsCrossed, Menu, Plus, Target, Calendar, TrendingUp, Search, Pencil, Trash2 } from 'lucide-react';
import AddMealModal from './AddMealModal';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';

interface NutritionTrackingProps {
  isRTL: boolean;
}

interface Meal {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: string;
  time: string;
  date: Date;
}

const NutritionTracking = ({ isRTL }: NutritionTrackingProps) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [calorieGoal] = useState(2000); // Daily calorie goal
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayMeals();
    }
  }, [user]);

  const fetchTodayMeals = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mealsRef = collection(db, 'meals');
      const q = query(
        mealsRef,
        where('userId', '==', user?.uid),
        where('date', '>=', today),
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedMeals: Meal[] = [];
      let totalCalories = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const meal: Meal = {
          id: doc.id,
          userId: data.userId,
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          type: data.type,
          time: data.time,
          date: data.date.toDate()
        };
        fetchedMeals.push(meal);
        totalCalories += data.calories;
      });

      setMeals(fetchedMeals);
      setDailyCalories(totalCalories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setLoading(false);
    }
  };

  const progress = (dailyCalories / calorieGoal) * 100;

  const macroTotals = meals.reduce((acc, meal) => ({
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { protein: 0, carbs: 0, fat: 0 });

  const handleAddMeal = async (mealData: { type: string; name: string; calories: string; time: string }) => {
    try {
      const calories = parseInt(mealData.calories);
      const protein = Math.round(calories * 0.3 / 4); // 30% of calories from protein
      const carbs = Math.round(calories * 0.4 / 4);   // 40% of calories from carbs
      const fat = Math.round(calories * 0.3 / 9);     // 30% of calories from fat

      if (mealToEdit) {
        // Update existing meal
        const mealRef = doc(db, 'meals', mealToEdit.id);
        const updatedMeal = {
          name: mealData.name,
          type: mealData.type,
          calories,
          protein,
          carbs,
          fat,
          time: mealData.time,
          // Don't update userId and date as they should remain the same
        };

        await updateDoc(mealRef, updatedMeal);
        await fetchTodayMeals(); // Refresh the meals list
      } else {
        // Add new meal
        const newMeal = {
          userId: user?.uid,
          name: mealData.name,
          type: mealData.type,
          calories,
          protein,
          carbs,
          fat,
          time: mealData.time,
          date: Timestamp.fromDate(new Date())
        };

        await addDoc(collection(db, 'meals'), newMeal);
        await fetchTodayMeals(); // Refresh the meals list
      }

      setMealToEdit(null);
      setIsAddMealModalOpen(false);
    } catch (error) {
      console.error('Error saving meal:', error);
    }
  };

  const handleCloseModal = () => {
    setMealToEdit(null);
    setIsAddMealModalOpen(false);
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const mealRef = doc(db, 'meals', mealId);
      await deleteDoc(mealRef);
      await fetchTodayMeals(); // Refresh the meals list
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setMealToEdit(meal);
    setIsAddMealModalOpen(true);
  };

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
                <UtensilsCrossed className="w-8 h-8 text-blue-500 animate-pulse" />
                <span>{isRTL ? "تتبع التغذية" : "Nutrition Tracking"}</span>
              </h1>
            </div>
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
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Daily Summary */}
              <div className="lg:col-span-1">
                <div className="glow-card text-center">
                  <h3 className="text-xl font-bold text-dark-blue mb-6">
                    {isRTL ? "ملخص اليوم" : "Today's Summary"}
                  </h3>
                  
                  {/* Calories Circle */}
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
                        stroke="#3B82F6"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (progress / 100) * 251.2}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold text-dark-blue">
                        {dailyCalories}
                      </div>
                      <div className="text-gray-600">{isRTL ? "سعرة" : "cal"}</div>
                      <div className="text-accent-blue font-semibold">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>

                  {/* Macros Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-lg font-bold text-blue-500">{macroTotals.protein}g</div>
                      <div className="text-sm text-gray-600">{isRTL ? "بروتين" : "Protein"}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-500">{macroTotals.carbs}g</div>
                      <div className="text-sm text-gray-600">{isRTL ? "كربوهيدرات" : "Carbs"}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-500">{macroTotals.fat}g</div>
                      <div className="text-sm text-gray-600">{isRTL ? "دهون" : "Fat"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meal List and Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Add Meal */}
                <div className="glow-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-dark-blue">
                      {isRTL ? "الوجبات" : "Meals"}
                    </h3>
                    <button
                      onClick={() => setIsAddMealModalOpen(true)}
                      className="glow-button flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{isRTL ? "إضافة وجبة" : "Add Meal"}</span>
                    </button>
                  </div>

                  {/* Meal List */}
                  <div className="space-y-4">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-dark-blue">{meal.name}</h4>
                            <div className="text-sm text-gray-600">
                              {meal.time} - {isRTL ? translateMealType(meal.type) : meal.type}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditMeal(meal)}
                              className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="font-semibold text-orange-500">{meal.calories}</div>
                            <div className="text-gray-600">{isRTL ? "سعرة" : "cal"}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-blue-500">{meal.protein}g</div>
                            <div className="text-gray-600">{isRTL ? "بروتين" : "protein"}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-green-500">{meal.carbs}g</div>
                            <div className="text-gray-600">{isRTL ? "كربوهيدرات" : "carbs"}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-yellow-500">{meal.fat}g</div>
                            <div className="text-gray-600">{isRTL ? "دهون" : "fat"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Progress */}
                <div className="glow-card">
                  <h3 className="text-xl font-bold text-dark-blue mb-6 flex items-center space-x-2">
                    <Target className="w-6 h-6" />
                    <span>{isRTL ? "التقدم اليومي" : "Daily Progress"}</span>
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Calories Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-dark-blue">{isRTL ? "السعرات الحرارية" : "Calories"}</span>
                        <span className="text-accent-blue">{dailyCalories} / {calorieGoal}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Macros Progress */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-dark-blue">{isRTL ? "بروتين" : "Protein"}</span>
                          <span className="text-blue-500">{macroTotals.protein}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${(macroTotals.protein / 150) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-dark-blue">{isRTL ? "كربوهيدرات" : "Carbs"}</span>
                          <span className="text-green-500">{macroTotals.carbs}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                            style={{ width: `${(macroTotals.carbs / 250) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-dark-blue">{isRTL ? "دهون" : "Fat"}</span>
                          <span className="text-yellow-500">{macroTotals.fat}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-yellow-500 transition-all duration-1000"
                            style={{ width: `${(macroTotals.fat / 65) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Tips */}
                <div className="glow-card">
                  <h3 className="text-xl font-bold text-dark-blue mb-4">
                    {isRTL ? "نصائح غذائية" : "Nutrition Tips"}
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent-blue rounded-full mt-2 animate-pulse"></div>
                      <p>{isRTL ? "تناول البروتين في كل وجبة" : "Include protein in every meal"}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent-blue rounded-full mt-2 animate-pulse"></div>
                      <p>{isRTL ? "تناول الخضروات الملونة" : "Eat colorful vegetables"}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent-blue rounded-full mt-2 animate-pulse"></div>
                      <p>{isRTL ? "اختر الدهون الصحية" : "Choose healthy fats"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AddMealModal
        isOpen={isAddMealModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddMeal}
        isRTL={isRTL}
        mealToEdit={mealToEdit}
      />
    </div>
  );
};

const translateMealType = (type: string): string => {
  const translations: { [key: string]: string } = {
    'breakfast': 'فطور',
    'lunch': 'غداء',
    'dinner': 'عشاء',
    'snack': 'وجبة خفيفة'
  };
  return translations[type] || type;
};

export default NutritionTracking; 