import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Monitor, Menu, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface ReportsProps {
  isRTL: boolean;
}

interface DetailedData {
  date: Date;
  steps: number;
  water: number;  // in ml
  sleep: number;  // in hours
  heartRate: number | null;  // can be null when no data
  bloodPressure: {
    systolic: number | null;
    diastolic: number | null;
  };
  calories: number;
  status: string;
}

interface HealthData {
  steps: number;
  waterIntake: number;  // in ml
  heartRate: number | null;
  sleepHours: number;
  calories: number;
  bloodPressure: {
    systolic: number | null;
    diastolic: number | null;
  };
  timestamp: Date;
}

const Reports = ({ isRTL }: ReportsProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData[]>([]);
  const [overallStats, setOverallStats] = useState({
    improvement: 0,
    goalsAchieved: 0,
    totalGoals: 0,
    consistencyRate: 0,
    healthScore: 'N/A'
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        if (timeRange === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Fetch data from different collections
        const fetchCollectionData = async (collectionName: string) => {
          const q = query(
            collection(db, collectionName),
            where('userId', '==', user.uid),
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(now)),
            orderBy('date', 'desc')
          );
          return getDocs(q);
        };

        // Fetch all required data
        const [
          stepsSnapshot,
          sleepSnapshot,
          waterSnapshot,
          bloodPressureSnapshot,
          heartRateSnapshot,
          activitiesSnapshot
        ] = await Promise.all([
          fetchCollectionData('steps'),
          fetchCollectionData('sleep'),
          fetchCollectionData('waterIntake'),
          fetchCollectionData('bloodPressureReadings'),
          fetchCollectionData('heartRateReadings'),
          fetchCollectionData('activities')
        ]);

        // Create a map to store data by date
        const dataByDate = new Map<string, HealthData>();

        // Process steps data
        stepsSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          entry.steps = data.steps || 0;
        });

        // Process sleep data
        sleepSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          entry.sleepHours = data.duration || 0;
        });

        // Process water data
        waterSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          
          // Get total water intake for the day
          let totalWater = 0;
          if (data.entries && Array.isArray(data.entries)) {
            totalWater = data.entries.reduce((total: number, entry: any) => {
              return total + (entry.amount || 0);
            }, 0);
          }
          // Convert to milliliters
          entry.waterIntake = Math.round(totalWater * 1000);
        });

        // Process blood pressure data
        bloodPressureSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          entry.bloodPressure.systolic = data.systolic || null;
          entry.bloodPressure.diastolic = data.diastolic || null;
        });

        // Process heart rate data
        heartRateSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          entry.heartRate = data.value || null;
        });

        // Process activities data for calories
        activitiesSnapshot.forEach(doc => {
          const data = doc.data();
          const date = format(data.date.toDate(), 'yyyy-MM-dd');
          if (!dataByDate.has(date)) {
            dataByDate.set(date, createEmptyHealthData(data.date.toDate()));
          }
          const entry = dataByDate.get(date)!;
          entry.calories += data.calories || 0;
        });

        // Convert map to array and sort by date
        const healthData = Array.from(dataByDate.values())
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Calculate health status for each day
        const newDetailedData: DetailedData[] = healthData.map(data => ({
          date: data.timestamp,
          steps: data.steps,
          water: data.waterIntake,
          sleep: data.sleepHours,
          heartRate: data.heartRate,
          bloodPressure: data.bloodPressure,
          calories: data.calories,
          status: calculateHealthStatus(data)
        }));

        setDetailedData(newDetailedData);
        setOverallStats({
          improvement: 0,
          goalsAchieved: 0,
          totalGoals: 0,
          consistencyRate: calculateConsistencyRate(healthData),
          healthScore: calculateHealthScore(healthData)
        });

      } catch (error) {
        console.error('Error fetching report data:', error);
        setError(isRTL ? 'حدث خطأ أثناء جلب البيانات' : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    // Helper function to create empty health data object
    const createEmptyHealthData = (timestamp: Date): HealthData => ({
      steps: 0,
      waterIntake: 0,
      heartRate: null,
      sleepHours: 0,
      calories: 0,
      bloodPressure: {
        systolic: null,
        diastolic: null
      },
      timestamp
    });

    fetchData();
  }, [user, timeRange, isRTL, navigate, authLoading]);

  const calculateHealthStatus = (data: HealthData): string => {
    let score = 0;
    let metrics = 0;

    // Check steps (recommended 10,000 steps per day)
    if (data.steps > 0) {
      score += (data.steps / 10000) * 100;
      metrics++;
    }

    // Check water intake (recommended 2.5L per day)
    if (data.waterIntake > 0) {
      score += (data.waterIntake / 2500) * 100;
      metrics++;
    }

    // Check sleep (recommended 7-9 hours)
    if (data.sleepHours > 0) {
      const sleepScore = data.sleepHours >= 7 && data.sleepHours <= 9 ? 100 : 
        data.sleepHours < 7 ? (data.sleepHours / 7) * 100 :
        (9 / data.sleepHours) * 100;
      score += sleepScore;
      metrics++;
    }

    // Check heart rate (normal resting 60-100 bpm)
    if (data.heartRate) {
      const heartScore = data.heartRate >= 60 && data.heartRate <= 100 ? 100 :
        data.heartRate < 60 ? (data.heartRate / 60) * 100 :
        (100 / data.heartRate) * 100;
      score += heartScore;
      metrics++;
    }

    // Check blood pressure (normal systolic 90-120, diastolic 60-80)
    if (data.bloodPressure.systolic && data.bloodPressure.diastolic) {
      const systolicScore = data.bloodPressure.systolic >= 90 && data.bloodPressure.systolic <= 120 ? 100 :
        data.bloodPressure.systolic < 90 ? (data.bloodPressure.systolic / 90) * 100 :
        (120 / data.bloodPressure.systolic) * 100;
      
      const diastolicScore = data.bloodPressure.diastolic >= 60 && data.bloodPressure.diastolic <= 80 ? 100 :
        data.bloodPressure.diastolic < 60 ? (data.bloodPressure.diastolic / 60) * 100 :
        (80 / data.bloodPressure.diastolic) * 100;
      
      score += (systolicScore + diastolicScore) / 2;
      metrics++;
    }

    // Calculate average score
    const averageScore = metrics > 0 ? score / metrics : 0;

    // Return status based on average score
    if (averageScore >= 90) return isRTL ? 'ممتاز' : 'Excellent';
    if (averageScore >= 80) return isRTL ? 'جيد جداً' : 'Very Good';
    if (averageScore >= 70) return isRTL ? 'جيد' : 'Good';
    if (averageScore >= 60) return isRTL ? 'مقبول' : 'Fair';
    return isRTL ? 'يحتاج تحسين' : 'Needs Improvement';
  };

  const calculateConsistencyRate = (data: HealthData[]): number => {
    if (data.length < 2) return 0;
    
    let consistentDays = 0;
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const isConsistent = 
        Math.abs(current.steps - previous.steps) < 2000 &&
        Math.abs(current.waterIntake - previous.waterIntake) < 0.5 &&
        Math.abs(current.sleepHours - previous.sleepHours) < 1;
      
      if (isConsistent) consistentDays++;
    }

    return (consistentDays / (data.length - 1)) * 100;
  };

  const calculateHealthScore = (data: HealthData[]): string => {
    if (data.length === 0) return 'N/A';

    const averageGoalCompletion = 100; // Assuming a default goal completion percentage
    const consistencyRate = calculateConsistencyRate(data);
    const totalScore = (averageGoalCompletion + consistencyRate) / 2;

    if (totalScore >= 90) return 'A+';
    if (totalScore >= 80) return 'A';
    if (totalScore >= 70) return 'B+';
    if (totalScore >= 60) return 'B';
    if (totalScore >= 50) return 'C+';
    return 'C';
  };

  const getStatusColor = (status: string) => {
    return status === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.text(isRTL ? 'تقرير الصحة' : 'Health Report', pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(12);
    yPosition += 10;
    doc.text(new Date().toLocaleDateString(), pageWidth / 2, yPosition, { align: 'center' });

    // Add Detailed Data
    doc.setFontSize(16);
    doc.text(isRTL ? 'البيانات التفصيلية' : 'Detailed Data', 14, yPosition);

    const detailedTableData = detailedData.map(item => [
      format(item.date, 'yyyy-MM-dd'),
      item.steps.toLocaleString(),
      `${item.water > 0 ? item.water.toLocaleString() : '0'} ml`,
      `${item.sleep > 0 ? item.sleep.toFixed(1) : '0.0'} hours`,
      item.calories.toLocaleString(),
      item.heartRate ? `${item.heartRate} bpm` : '-',
      item.bloodPressure.systolic && item.bloodPressure.diastolic ? `${item.bloodPressure.systolic}/${item.bloodPressure.diastolic}` : '-',
      item.status
    ]);

    yPosition += 5;
    autoTable(doc, {
      head: [[
        isRTL ? 'التاريخ' : 'Date',
        isRTL ? 'الخطوات' : 'Steps',
        isRTL ? 'الماء (مل)' : 'Water (ml)',
        isRTL ? 'النوم (ساعة)' : 'Sleep (hrs)',
        isRTL ? 'السعرات' : 'Calories',
        isRTL ? 'معدل القلب' : 'Heart Rate',
        isRTL ? 'ضغط الدم' : 'Blood Pressure',
        isRTL ? 'الحالة' : 'Status'
      ]],
      body: detailedTableData,
      startY: yPosition,
      theme: 'grid'
    });

    // Save the PDF
    doc.save('health-report.pdf');
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
                <Monitor className="w-8 h-8 text-purple-500" />
                <span>{isRTL ? 'التقارير' : 'Reports'}</span>
              </h1>
            </div>
          </div>
        </header>
            
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-accent-blue"
              >
                  <option value="week">{isRTL ? 'آخر أسبوع' : 'Last Week'}</option>
                  <option value="month">{isRTL ? 'آخر شهر' : 'Last Month'}</option>
                  <option value="year">{isRTL ? 'آخر سنة' : 'Last Year'}</option>
              </select>
              </div>
              <button 
                onClick={handleExport} 
                className="flex items-center space-x-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isRTL ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>
            </div>

            {/* Updated Detailed Data Table */}
            <div className="glow-card overflow-hidden">
              <h3 className="text-xl font-bold text-dark-blue mb-6">
                {isRTL ? 'البيانات التفصيلية' : 'Detailed Data'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'الخطوات' : 'Steps'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'الماء (مل)' : 'Water (ml)'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'النوم (ساعة)' : 'Sleep (hrs)'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'معدل القلب' : 'Heart Rate'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'ضغط الدم' : 'Blood Pressure'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'السعرات' : 'Calories'}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        {isRTL ? 'الحالة' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailedData.map((data, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {format(data.date, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.steps.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.water > 0 ? data.water : '0'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.sleep > 0 ? data.sleep.toFixed(1) : '0.0'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.heartRate || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.bloodPressure.systolic && data.bloodPressure.diastolic ? 
                            `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}` : 
                            '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {data.calories > 0 ? data.calories : '0'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`text-sm ${
                            data.status === 'Needs Improvement' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {data.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
