import { useState } from 'react';
import { X, Plus, Minus, RotateCcw, Trash2 } from 'lucide-react';

interface QuickActionModalsProps {
  isOpen: {
    meal: boolean;
    water: boolean;
    workout: boolean;
    sleep: boolean;
  };
  onClose: (modal: string) => void;
  isRTL: boolean;
  onWaterSubmit?: (amount: number) => void;
}

const QuickActionModals = ({ 
  isOpen, 
  onClose, 
  isRTL,
  onWaterSubmit
}: QuickActionModalsProps) => {
  // State for water intake
  const [waterAmount, setWaterAmount] = useState(250);
  
  // State for meal logging
  const [mealData, setMealData] = useState({
    name: '',
    calories: '',
    type: 'breakfast'
  });

  // State for workout logging
  const [workoutData, setWorkoutData] = useState({
    type: '',
    duration: '',
    calories: ''
  });

  // State for sleep logging
  const [sleepData, setSleeData] = useState({
    hours: '',
    quality: 'good'
  });

  const handleSubmit = (type: string) => {
    // Here you would typically send the data to your backend
    console.log(`Submitting ${type} data`);
    onClose(type);
  };

  return (
    <>
      {/* Meal Modal */}
      {isOpen.meal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-dark-blue">
                {isRTL ? "تسجيل وجبة" : "Log Meal"}
              </h3>
              <button onClick={() => onClose('meal')} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('meal'); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "نوع الوجبة" : "Meal Type"}
                </label>
                <select 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={mealData.type}
                  onChange={(e) => setMealData({ ...mealData, type: e.target.value })}
                >
                  <option value="breakfast">{isRTL ? "فطور" : "Breakfast"}</option>
                  <option value="lunch">{isRTL ? "غداء" : "Lunch"}</option>
                  <option value="dinner">{isRTL ? "عشاء" : "Dinner"}</option>
                  <option value="snack">{isRTL ? "وجبة خفيفة" : "Snack"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "اسم الوجبة" : "Meal Name"}
                </label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={mealData.name}
                  onChange={(e) => setMealData({ ...mealData, name: e.target.value })}
                  placeholder={isRTL ? "مثال: سلطة دجاج" : "e.g., Chicken Salad"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "السعرات الحرارية" : "Calories"}
                </label>
                <input 
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={mealData.calories}
                  onChange={(e) => setMealData({ ...mealData, calories: e.target.value })}
                  placeholder={isRTL ? "مثال: 500" : "e.g., 500"}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isRTL ? "حفظ" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Water Modal */}
      {isOpen.water && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-dark-blue">
                {isRTL ? "إضافة ماء" : "Add Water"}
              </h3>
              <button onClick={() => onClose('water')} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              onWaterSubmit?.(waterAmount);
              onClose('water');
            }} className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <button 
                  type="button"
                  onClick={() => setWaterAmount(Math.max(0, waterAmount - 50))}
                  className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">{waterAmount}</div>
                  <div className="text-gray-500">ml</div>
                </div>
                <button 
                  type="button"
                  onClick={() => setWaterAmount(waterAmount + 50)}
                  className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="flex justify-center gap-2">
                {[250, 500, 750].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setWaterAmount(amount)}
                    className="px-4 py-2 rounded-lg bg-blue-100 text-blue-500 hover:bg-blue-200"
                  >
                    {amount}ml
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isRTL ? "حفظ" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Workout Modal */}
      {isOpen.workout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-dark-blue">
                {isRTL ? "تسجيل تمرين" : "Log Workout"}
              </h3>
              <button onClick={() => onClose('workout')} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('workout'); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "نوع التمرين" : "Workout Type"}
                </label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={workoutData.type}
                  onChange={(e) => setWorkoutData({ ...workoutData, type: e.target.value })}
                  placeholder={isRTL ? "مثال: جري" : "e.g., Running"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "المدة (بالدقائق)" : "Duration (minutes)"}
                </label>
                <input 
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={workoutData.duration}
                  onChange={(e) => setWorkoutData({ ...workoutData, duration: e.target.value })}
                  placeholder={isRTL ? "مثال: 30" : "e.g., 30"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "السعرات المحروقة" : "Calories Burned"}
                </label>
                <input 
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={workoutData.calories}
                  onChange={(e) => setWorkoutData({ ...workoutData, calories: e.target.value })}
                  placeholder={isRTL ? "مثال: 300" : "e.g., 300"}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {isRTL ? "حفظ" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sleep Modal */}
      {isOpen.sleep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-dark-blue">
                {isRTL ? "تسجيل النوم" : "Log Sleep"}
              </h3>
              <button onClick={() => onClose('sleep')} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('sleep'); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "ساعات النوم" : "Hours of Sleep"}
                </label>
                <input 
                  type="number"
                  step="0.5"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={sleepData.hours}
                  onChange={(e) => setSleeData({ ...sleepData, hours: e.target.value })}
                  placeholder={isRTL ? "مثال: 8" : "e.g., 8"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? "جودة النوم" : "Sleep Quality"}
                </label>
                <select 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={sleepData.quality}
                  onChange={(e) => setSleeData({ ...sleepData, quality: e.target.value })}
                >
                  <option value="excellent">{isRTL ? "ممتاز" : "Excellent"}</option>
                  <option value="good">{isRTL ? "جيد" : "Good"}</option>
                  <option value="fair">{isRTL ? "متوسط" : "Fair"}</option>
                  <option value="poor">{isRTL ? "سيء" : "Poor"}</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                {isRTL ? "حفظ" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActionModals; 