import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealData: {
    type: string;
    name: string;
    calories: string;
    time: string;
  }) => void;
  isRTL: boolean;
  mealToEdit: Meal | null;
}

const AddMealModal = ({ isOpen, onClose, onSave, isRTL, mealToEdit }: AddMealModalProps) => {
  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    foodItem: '',
    calories: '',
    time: ''
  });

  useEffect(() => {
    if (mealToEdit) {
      setFormData({
        mealType: mealToEdit.type,
        foodItem: mealToEdit.name,
        calories: mealToEdit.calories.toString(),
        time: mealToEdit.time
      });
    } else {
      setFormData({
        mealType: 'breakfast',
        foodItem: '',
        calories: '',
        time: ''
      });
    }
  }, [mealToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type: formData.mealType,
      name: formData.foodItem,
      calories: formData.calories,
      time: formData.time,
    });
    setFormData({
      mealType: 'breakfast',
      foodItem: '',
      calories: '',
      time: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark-blue">
            {mealToEdit 
              ? (isRTL ? "تعديل الوجبة" : "Edit Meal")
              : (isRTL ? "إضافة وجبة جديدة" : "Add New Meal")
            }
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-blue">
              {isRTL ? "نوع الوجبة" : "Meal Type"}
            </label>
            <select
              name="mealType"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
            >
              <option value="breakfast">{isRTL ? "فطور" : "Breakfast"}</option>
              <option value="lunch">{isRTL ? "غداء" : "Lunch"}</option>
              <option value="dinner">{isRTL ? "عشاء" : "Dinner"}</option>
              <option value="snack">{isRTL ? "وجبة خفيفة" : "Snack"}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-blue">
              {isRTL ? "الطعام" : "Food Item"}
            </label>
            <input
              type="text"
              name="foodItem"
              placeholder={isRTL ? "ادخل اسم الطعام" : "Enter food name"}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              value={formData.foodItem}
              onChange={(e) => setFormData({ ...formData, foodItem: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-blue">
              {isRTL ? "السعرات الحرارية" : "Calories"}
            </label>
            <input
              type="number"
              name="calories"
              placeholder={isRTL ? "ادخل السعرات الحرارية" : "Enter calories"}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-blue">
              {isRTL ? "الوقت" : "Time"}
            </label>
            <input
              type="time"
              name="time"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {mealToEdit 
                ? (isRTL ? "تحديث" : "Update")
                : (isRTL ? "حفظ" : "Save")
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMealModal; 