import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';

interface AuthPageProps {
  isRTL: boolean;
  setIsRTL: (value: boolean) => void;
}

const AuthPage = ({ isRTL, setIsRTL }: AuthPageProps) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    height: '',
    weight: '',
    age: '',
    gender: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile in Firestore if it doesn't exist
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          email: result.user.email,
          fullName: result.user.displayName,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      toast({
        title: isRTL ? "تم تسجيل الدخول بنجاح" : "Successfully signed in",
        description: isRTL ? "مرحباً بك في نبضة الصحة" : "Welcome to Health Pulse",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في تسجيل الدخول" : "Authentication Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isLogin) {
        // Sign Up
        if (formData.password !== formData.confirmPassword) {
          toast({
            variant: "destructive",
            title: isRTL ? "خطأ في كلمة المرور" : "Password Error",
            description: isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match",
          });
          return;
        }

        const { user } = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          fullName: formData.fullName,
          email: formData.email,
          height: formData.height,
          weight: formData.weight,
          age: formData.age,
          gender: formData.gender,
          createdAt: new Date().toISOString(),
        });

        toast({
          title: isRTL ? "تم إنشاء الحساب بنجاح" : "Account created successfully",
          description: isRTL ? "مرحباً بك في نبضة الصحة" : "Welcome to Health Pulse",
        });
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        toast({
          title: isRTL ? "تم تسجيل الدخول بنجاح" : "Successfully signed in",
          description: isRTL ? "مرحباً بك مجدداً" : "Welcome back",
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ في المصادقة" : "Authentication Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue to-container-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-dark-blue hover:text-accent-blue transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {isRTL ? "العودة إلى الرئيسية" : "Back to Landing"}
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="w-10 h-10 text-accent-blue pulse-heart" />
            <h1 className="text-3xl font-bold text-dark-blue">
              {isRTL ? "نبضة الصحة" : "Health Pulse"}
            </h1>
          </div>
          
          <button
            onClick={() => setIsRTL(!isRTL)}
            className="px-4 py-2 bg-accent-blue text-white rounded-md hover:bg-primary-blue transition-colors"
          >
            {isRTL ? "EN" : "AR"}
          </button>
        </div>

        {/* Auth Card */}
        <div className="glow-card">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-light-blue rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-dark-blue shadow-glow'
                  : 'text-dark-blue hover:bg-white/50'
              }`}
              disabled={isLoading}
            >
              {isRTL ? "تسجيل الدخول" : "Login"}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-dark-blue shadow-glow'
                  : 'text-dark-blue hover:bg-white/50'
              }`}
              disabled={isLoading}
            >
              {isRTL ? "إنشاء حساب" : "Sign Up"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sign Up Only Fields */}
            {!isLogin && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-medium text-dark-blue mb-2">
                  {isRTL ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">
                {isRTL ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">
                {isRTL ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300 pr-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-accent-blue transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {!isLogin && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-medium text-dark-blue mb-2">
                  {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300 pr-12"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-accent-blue transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Additional Sign Up Fields */}
            {!isLogin && (
              <div className="animate-fade-in-up space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      {isRTL ? "الطول (سم)" : "Height (cm)"}
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      {isRTL ? "الوزن (كج)" : "Weight (kg)"}
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      {isRTL ? "العمر" : "Age"}
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-blue mb-2">
                      {isRTL ? "الجنس" : "Gender"}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-accent-blue/30 rounded-lg glow-input focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300"
                      required={!isLogin}
                      disabled={isLoading}
                    >
                      <option value="">{isRTL ? "اختر" : "Select"}</option>
                      <option value="male">{isRTL ? "ذكر" : "Male"}</option>
                      <option value="female">{isRTL ? "أنثى" : "Female"}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-accent-blue text-white rounded-lg hover:bg-primary-blue transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isRTL ? "جاري المعالجة..." : "Processing..."}
                </span>
              ) : isLogin ? (
                isRTL ? "تسجيل الدخول" : "Sign In"
              ) : (
                isRTL ? "إنشاء حساب" : "Sign Up"
              )}
            </button>

            {/* Google Sign In Button */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-accent-blue/30"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-dark-blue">
                  {isRTL ? "أو" : "OR"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white border border-accent-blue/30 text-dark-blue rounded-lg hover:bg-light-blue transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{isRTL ? "المتابعة مع جوجل" : "Continue with Google"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
