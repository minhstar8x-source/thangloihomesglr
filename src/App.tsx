import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  Auth,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { MapPin, Construction, ChevronRight, Smartphone, AlertCircle } from 'lucide-react';

// Định nghĩa các biến toàn cục để tránh lỗi "Cannot find name" khi build trên Vercel
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// ==========================================
// 1. ĐIỀN CẤU HÌNH FIREBASE CỦA BẠN TẠI ĐÂY
// ==========================================
const myFirebaseConfig = {
  apiKey: "AIzaSyBe_LmvyTLaicrXpY1-VVoyyz2J9MexMws",
  authDomain: "thangloihomesgallerycheckin.firebaseapp.com",
  projectId: "thangloihomesgallerycheckin",
  storageBucket: "thangloihomesgallerycheckin.firebasestorage.app",
  messagingSenderId: "379103774620",
  appId: "1:379103774620:web:c3647bde9faa6385806a59"
};

// Biến toàn cục có kiểu dữ liệu rõ ràng
let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let globalInitError: string | null = null;

const safeInitFirebase = () => {
  try {
    // Kiểm tra biến môi trường Canvas hoặc dùng config mặc định
    const configStr = typeof window !== 'undefined' ? window.__firebase_config : undefined;
    const config = configStr ? JSON.parse(configStr) : myFirebaseConfig;

    if (!config || !config.apiKey || config.apiKey === "YOUR_API_KEY") {
      return { error: "Vui lòng cấu hình Firebase trong App.tsx" };
    }

    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    return { error: null };
  } catch (err) {
    console.error("Firebase Init Error:", err);
    return { error: "Lỗi kết nối hệ thống lưu trữ." };
  }
};

const initResult = safeInitFirebase();
globalInitError = initResult.error;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [error] = useState<string | null>(globalInitError);

  // Lấy App ID an toàn
  const finalAppId = (typeof window !== 'undefined' && window.__app_id) 
    ? window.__app_id 
    : 'thang-loi-homes-gallery';

  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;
        if (token) {
          await signInWithCustomToken(auth!, token);
        } else {
          await signInAnonymously(auth!);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth!, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleServiceClick = async (id: string, serviceName: string, externalUrl: string) => {
    if (!db || !user) {
      window.open(externalUrl, '_blank');
      return;
    }
    
    setLoading(true);
    setActiveTab(id);

    try {
      await addDoc(collection(db!, 'artifacts', finalAppId, 'public', 'data', 'visitor_logs'), {
        userId: user.uid,
        service: serviceName,
        timestamp: serverTimestamp(),
        platform: 'web_mobile'
      });

      setTimeout(() => {
        window.open(externalUrl, '_blank');
        setLoading(false);
        setActiveTab(null);
      }, 600);
    } catch (err) {
      console.error("Firestore error:", err);
      window.open(externalUrl, '_blank');
      setLoading(false);
      setActiveTab(null);
    }
  };

  const services = [
    {
      id: 'checkin',
      title: 'CHECK-IN',
      subtitle: 'Thắng Lợi Homes Gallery',
      icon: <MapPin className="w-8 h-8 md:w-10 h-10 text-white" />,
      url: 'https://twccheckin.vercel.app/',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      id: 'visit',
      title: 'ĐĂNG KÝ',
      subtitle: 'Tham quan Công trường',
      icon: <Construction className="w-8 h-8 md:w-10 h-10 text-white" />,
      url: 'https://thamquanthewincity.vercel.app/',
      gradient: 'from-slate-700 to-slate-900'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col items-center">
      <div className="relative w-full h-[45vh] md:h-[50vh] overflow-hidden flex flex-col justify-end">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80&w=1200')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="relative w-full p-8 md:pl-12 pb-14 text-center md:text-left max-w-lg mx-auto md:mx-0">
          <div className="inline-block bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20 shadow-lg tracking-widest uppercase">
            Welcome to
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
            Thắng Lợi <br className="md:hidden" />
            <span className="text-orange-500">Homes Gallery</span>
          </h1>
        </div>
      </div>

      <div className="w-full max-w-md px-6 -mt-8 z-10 flex-grow">
        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id, `${service.title} ${service.subtitle}`, service.url)}
              disabled={loading}
              className={`
                group relative w-full flex items-stretch rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300
                ${loading && activeTab === service.id ? 'scale-95 brightness-90' : 'hover:scale-[1.02] active:scale-95'}
              `}
            >
              <div className={`flex w-full items-center p-5 bg-gradient-to-br ${service.gradient} text-white`}>
                <div className="flex-shrink-0 p-3 bg-white/20 backdrop-blur-md rounded-2xl mr-4 shadow-inner">
                  {service.icon}
                </div>
                
                <div className="flex-grow text-left flex flex-col justify-center overflow-hidden">
                  <h2 className="text-2xl font-black tracking-tighter leading-tight uppercase truncate text-white">
                    {service.title}
                  </h2>
                  <p className="text-white/90 font-bold text-[13px] md:text-sm mt-0.5 uppercase tracking-wide line-clamp-1">
                    {service.subtitle}
                  </p>
                </div>
                
                <div className="flex-shrink-0 ml-2 bg-white/15 p-1.5 rounded-full border border-white/25">
                  <ChevronRight className={`w-5 h-5 text-white transition-transform ${loading && activeTab === service.id ? 'animate-ping' : 'group-hover:translate-x-1'}`} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3 text-orange-700 text-[11px] leading-relaxed font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="inline-flex items-center text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
            <Smartphone className="w-3.5 h-3.5 mr-2 text-orange-500" />
            Chạm để đăng ký dịch vụ
          </p>
        </div>
      </div>

      <footer className="w-full py-8 text-center bg-slate-50 border-t border-slate-100 mt-8">
        <p className="text-slate-900 font-black tracking-[0.25em] text-[10px] uppercase mb-1">Thắng Lợi Group</p>
        <p className="text-slate-400 text-[9px] font-medium tracking-widest uppercase italic">Kiến tạo cộng đồng - Vun đắp ngày mai</p>
      </footer>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-white text-xs font-black tracking-[0.3em] animate-pulse uppercase">Vui lòng đợi</p>
          </div>
        </div>
      )}
    </div>
  );
}