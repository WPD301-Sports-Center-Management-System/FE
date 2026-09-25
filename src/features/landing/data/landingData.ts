export interface MuscleGroup {
  id: string;
  name: string;
  enName: string;
  icon: string;
  color: string;
  description: string;
}

export interface ExerciseSample {
  name: string;
  setsReps: string;
  target: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  muscleGroupId: string;
  muscleGroupName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  caloriesBurn: string;
  coachesCount: number;
  description: string;
  exercises: ExerciseSample[];
  highlight: string;
  image: string;
}

export interface CoachSlot {
  id: string;
  time: string;
  date: string;
  status: 'OPEN' | 'BOOKED';
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  completedSessions: number;
  certifications: string[];
  specializations: string[];
  bio: string;
  availableSlots: CoachSlot[];
  quote: string;
}

export interface PtPackage {
  id: string;
  title: string;
  credits: number;
  price: string;
  originalPrice?: string;
  pricePerSession: string;
  validityDays: number;
  popular?: boolean;
  description: string;
  features: string[];
  badge?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  price: string;
  originalPrice?: string;
  popular?: boolean;
  features: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  coachName: string;
  package: string;
  rating: number;
  quote: string;
  achievement: {
    weightChange: string;
    bodyFatChange: string;
    duration: string;
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'booking' | 'payment' | 'coaching' | 'policy';
}

// ------------------- DATA EXPORTS -------------------

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'all', name: 'Tất Cả Khóa Tập', enName: 'All Courses', icon: 'Sparkles', color: 'orange', description: 'Toàn bộ danh mục khóa tập cá nhân hóa' },
  { id: 'chest', name: 'Ngực & Tay Sau', enName: 'Chest & Triceps', icon: 'Shield', color: 'red', description: 'Phát triển cơ ngực dày, săn chắc và tay sau khỏe khoắn' },
  { id: 'back', name: 'Lưng & Tay Trước', enName: 'Back & Biceps', icon: 'Activity', color: 'blue', description: 'Tạo hình chữ V-Taper quyến rũ, lưng xô dày và cánh tay săn chắc' },
  { id: 'legs', name: 'Chân & Mông Đùi', enName: 'Legs & Glutes', icon: 'Zap', color: 'emerald', description: 'Gia tăng sức mạnh thân dưới, định hình vòng 3 và cơ đùi khỏe khoắn' },
  { id: 'core', name: 'Cơ Bụng & Core', enName: 'Abs & Core Stability', icon: 'Flame', color: 'amber', description: 'Tăng cường sức mạnh trục cơ thể, rãnh bụng 6 múi săn chắc' },
  { id: 'fatloss', name: 'Đốt Mỡ Toàn Thân', enName: 'Full Body HIIT & Conditioning', icon: 'TrendingUp', color: 'purple', description: 'Tiêu hao calo tối đa, tăng sức bền tim mạch và trao đổi chất' }
];

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'course-1',
    title: 'Hypertrophy: Kiến Tạo Cơ Ngực & Tay Sau Cắt Nét',
    muscleGroupId: 'chest',
    muscleGroupName: 'Ngực & Tay Sau',
    level: 'Intermediate',
    duration: '60 phút / buổi',
    caloriesBurn: '~450-550 kcal',
    coachesCount: 8,
    description: 'Chương trình chuyên biệt kích thích sợi cơ ngực từ mọi góc độ kết hợp bài cô lập tay sau để tối ưu hóa thể tích cơ bắp.',
    highlight: 'Kỹ thuật Progressive Overload & Time-under-Tension',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { name: 'Incline Barbell Bench Press', setsReps: '4 sets x 8-10 reps', target: 'Ngực trên' },
      { name: 'Flat Dumbbell Press', setsReps: '4 sets x 10-12 reps', target: 'Ngực giữa' },
      { name: 'Cable Chest Flyes', setsReps: '3 sets x 15 reps', target: 'Cắt khe ngực' },
      { name: 'Triceps Rope Pushdown', setsReps: '4 sets x 12 reps', target: 'Tay sau' }
    ]
  },
  {
    id: 'course-2',
    title: 'V-Taper Master: Lưng Xô Vát Chữ V & Bắp Tay Khỏe',
    muscleGroupId: 'back',
    muscleGroupName: 'Lưng & Tay Trước',
    level: 'Intermediate',
    duration: '60 phút / buổi',
    caloriesBurn: '~500-600 kcal',
    coachesCount: 7,
    description: 'Mở rộng độ rộng lưng xô, làm dày cơ lưng giữa và phát triển đỉnh bắp tay trước với sự hướng dẫn form chuẩn xác từng milimet.',
    highlight: 'Bảo vệ cột sống & Kích hoạt tối đa nhóm cơ Latissimus',
    image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { name: 'Deadlift (Kỹ thuật chuẩn an toàn)', setsReps: '4 sets x 6 reps', target: 'Lưng dưới & Toàn thân' },
      { name: 'Lat Pulldown Wide Grip', setsReps: '4 sets x 10-12 reps', target: 'Độ rộng xô' },
      { name: 'Barbell Bent Over Row', setsReps: '4 sets x 8-10 reps', target: 'Độ dày cơ lưng' },
      { name: 'Incline Dumbbell Bicep Curl', setsReps: '3 sets x 12 reps', target: 'Bắp tay trước' }
    ]
  },
  {
    id: 'course-3',
    title: 'Lower Body Strength & Glutes: Nâng Vòng 3 & Săn Đùi',
    muscleGroupId: 'legs',
    muscleGroupName: 'Chân & Mông Đùi',
    level: 'Advanced',
    duration: '60 phút / buổi',
    caloriesBurn: '~600-750 kcal',
    coachesCount: 10,
    description: 'Giáo án chuyên sâu dành cho mục tiêu xây dựng vòng 3 cao đầy đặn và săn chắc toàn bộ cơ đùi trước, đùi sau mà không sợ to thô.',
    highlight: 'Kích hoạt cơ mông tối đa, cải thiện khớp gối & hông',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { name: 'Barbell Back Squat', setsReps: '4 sets x 8 reps', target: 'Toàn bộ thân dưới' },
      { name: 'Barbell Hip Thrust', setsReps: '4 sets x 10-12 reps', target: 'Cơ mông trên/dưới' },
      { name: 'Bulgarian Split Squat', setsReps: '3 sets x 10 reps/bên', target: 'Cô lập đùi & mông' },
      { name: 'Romanian Deadlift (RDL)', setsReps: '4 sets x 10 reps', target: 'Đùi sau & Mông' }
    ]
  },
  {
    id: 'course-4',
    title: 'Core Fusion & Shred: Siết Cơ Bụng & Cột Sống Khỏe',
    muscleGroupId: 'core',
    muscleGroupName: 'Cơ Bụng & Core',
    level: 'Beginner',
    duration: '45 phút / buổi',
    caloriesBurn: '~350-450 kcal',
    coachesCount: 6,
    description: 'Tập trung siết cơ bụng ngang (Transverse Abdominis), tạo rãnh bụng số 11 và bảo vệ cột sống thắt lưng chống đau mỏi do ngồi văn phòng.',
    highlight: 'Hít thở Brace Core & Giải tỏa áp lực cột sống',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { name: 'Hanging Knee/Leg Raise', setsReps: '4 sets x 12-15 reps', target: 'Bụng dưới' },
      { name: 'Cable Woodchopper', setsReps: '3 sets x 12 reps/bên', target: 'Cơ liên sườn' },
      { name: 'Ab Wheel Rollout', setsReps: '3 sets x 10 reps', target: 'Toàn bộ khối Core' },
      { name: 'Weighted Plank', setsReps: '3 sets x 45-60s', target: 'Độ bền cơ lõi' }
    ]
  },
  {
    id: 'course-5',
    title: 'Metabolic Ignite: Siết Mỡ Chuyên Sâu & Tăng Sức Bền',
    muscleGroupId: 'fatloss',
    muscleGroupName: 'Đốt Mỡ Toàn Thân',
    level: 'Intermediate',
    duration: '55 phút / buổi',
    caloriesBurn: '~650-800 kcal',
    coachesCount: 9,
    description: 'Kết hợp tạ liên hoàn và bài tập chức năng kích hoạt hiệu ứng EPOC (đốt mỡ kéo dài 24h sau tập) cùng kiểm soát nhịp tim tối ưu.',
    highlight: 'Hiệu ứng đốt mỡ thụ động sau tập & Sức bền tim mạch',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { name: 'Kettlebell Swings Complex', setsReps: '4 sets x 20 reps', target: 'Chuỗi cơ sau & Tim mạch' },
      { name: 'Dumbbell Thrusters', setsReps: '4 sets x 12 reps', target: 'Toàn thân' },
      { name: 'Battle Rope Waves & Slams', setsReps: '4 rounds x 30s', target: 'Đốt mỡ tốc độ cao' },
      { name: 'Rowing Machine Sprint', setsReps: '5 intervals x 200m', target: 'Cardio hiệu suất cao' }
    ]
  }
];

export const COACHES: Coach[] = [
  {
    id: 'coach-1',
    name: 'Nguyễn Hoàng Long',
    title: 'Senior Master PT & Hypertrophy Specialist',
    avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80',
    rating: 4.98,
    reviewCount: 142,
    experienceYears: 7,
    completedSessions: 1850,
    certifications: ['NASM-CPT', 'CSCS Certified', 'Precision Nutrition L1'],
    specializations: ['Tăng cơ tối đa', 'Chỉnh sửa tư thế & Khớp', 'Kỹ thuật Powerlifting'],
    bio: '7 năm kinh nghiệm huấn luyện chuyên sâu 1:1, từng giúp hơn 300 học viên đạt vóc dáng săn chắc với giáo án chuẩn hóa khoa học và an toàn tuyệt đối.',
    quote: 'Mỗi buổi tập là một bước tiến có thể đo lường được.',
    availableSlots: [
      { id: 's1', date: 'Hôm nay', time: '14:00 - 15:00', status: 'OPEN' },
      { id: 's2', date: 'Hôm nay', time: '17:30 - 18:30', status: 'OPEN' },
      { id: 's3', date: 'Ngày mai', time: '09:00 - 10:00', status: 'OPEN' },
      { id: 's4', date: 'Ngày mai', time: '19:00 - 20:00', status: 'OPEN' }
    ]
  },
  {
    id: 'coach-2',
    name: 'Trần Thị Mai Anh',
    title: 'Head Coach Female Fitness & Transformation',
    avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=80',
    rating: 4.96,
    reviewCount: 118,
    experienceYears: 5,
    completedSessions: 1420,
    certifications: ['ACE-CPT', 'Glute Lab Specialist', 'ISSA Nutritionist'],
    specializations: ['Định hình Vòng 3', 'Giảm mỡ sau sinh', 'Dinh dưỡng Meal Plan'],
    bio: 'Chuyên gia huấn luyện thân dưới và siết eo cho phái nữ. Cam kết không dùng thực đơn khắt khe, xây dựng thói quen ăn uống lành mạnh dài hạn.',
    quote: 'Cơ thể đẹp nhất là cơ thể khỏe mạnh và tự tin từ bên trong.',
    availableSlots: [
      { id: 's5', date: 'Hôm nay', time: '10:00 - 11:00', status: 'OPEN' },
      { id: 's6', date: 'Hôm nay', time: '15:30 - 16:30', status: 'OPEN' },
      { id: 's7', date: 'Ngày mai', time: '16:00 - 17:00', status: 'OPEN' },
      { id: 's8', date: 'Ngày mai', time: '18:30 - 19:30', status: 'OPEN' }
    ]
  },
  {
    id: 'coach-3',
    name: 'Đặng Minh Quân',
    title: 'Strength & Conditioning Coach',
    avatar: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80',
    rating: 4.94,
    reviewCount: 96,
    experienceYears: 6,
    completedSessions: 1290,
    certifications: ['ISSA Master Trainer', 'EXOS Performance Specialist'],
    specializations: ['Sức mạnh & Thể lực', 'Cải thiện đau mỏi cổ vai gáy', 'Tăng phản xạ'],
    bio: 'Tập trung tối ưu hóa hiệu suất vận động của cơ thể, giải quyết dứt điểm các cơn đau cơ bắp do lối sống tĩnh tại hoặc sai tư thế tập luyện.',
    quote: 'Chất lượng của từng set tập quan trọng hơn số lượng bài tập.',
    availableSlots: [
      { id: 's9', date: 'Hôm nay', time: '08:00 - 09:00', status: 'OPEN' },
      { id: 's10', date: 'Hôm nay', time: '18:00 - 19:00', status: 'OPEN' },
      { id: 's11', date: 'Ngày mai', time: '14:00 - 15:00', status: 'OPEN' },
      { id: 's12', date: 'Ngày mai', time: '20:00 - 21:00', status: 'OPEN' }
    ]
  },
  {
    id: 'coach-4',
    name: 'Lê Quốc Bảo',
    title: 'Fat Loss & HIIT Conditioning Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    rating: 4.97,
    reviewCount: 135,
    experienceYears: 8,
    completedSessions: 2100,
    certifications: ['ACE-CPT', 'TRX Suspension Master', 'VN Sports Med Cert'],
    specializations: ['Giảm mỡ cấp tốc an toàn', 'Tập luyện chức năng', 'Core & Linh hoạt'],
    bio: 'Chuyên gia thiết kế lộ trình siết mỡ khoa học kết hợp AI hỗ trợ phân tích năng lượng nạp/tiêu hao, giúp học viên duy trì cân nặng lý tưởng bền vững.',
    quote: 'Kiên trì kết hợp cùng phương pháp đúng sẽ tạo ra kỳ tích.',
    availableSlots: [
      { id: 's13', date: 'Hôm nay', time: '11:00 - 12:00', status: 'OPEN' },
      { id: 's14', date: 'Ngày mai', time: '10:30 - 11:30', status: 'OPEN' },
      { id: 's15', date: 'Ngày mai', time: '17:00 - 18:00', status: 'OPEN' }
    ]
  }
];

export const PT_PACKAGES: PtPackage[] = [
  {
    id: 'pt-5',
    title: 'Gói Khởi Động (Starter 5)',
    credits: 5,
    price: '2.500.000đ',
    pricePerSession: '500.000đ / buổi',
    validityDays: 30,
    description: 'Dành cho người mới bắt đầu muốn test thể lực, làm quen kỹ thuật chuẩn và chỉnh sửa form dáng an toàn.',
    features: [
      '5 Credit đặt lịch PT 1:1 linh hoạt',
      'Đánh giá InBody & Thể trạng buổi đầu',
      'Giáo án căn bản chỉnh sửa form chuẩn',
      'Hủy lịch trước 12 tiếng không mất credit',
      'Thời hạn sử dụng: 30 ngày',
      'Thanh toán VNPay / Tại quầy nhận ngay credit'
    ]
  },
  {
    id: 'pt-10',
    title: 'Gói Chuyển Hóa (Transformation 10)',
    credits: 10,
    price: '4.500.000đ',
    originalPrice: '5.000.000đ',
    pricePerSession: '450.000đ / buổi',
    validityDays: 60,
    popular: true,
    badge: 'GÓI ĐƯỢC CHỌN NHIỀU NHẤT',
    description: 'Lộ trình tối ưu để thấy rõ sự thay đổi hình thể, giảm mỡ tăng cơ rõ rệt cùng giáo án AI & thực đơn cá nhân hóa.',
    features: [
      '10 Credit đặt lịch PT 1:1 chuyên sâu',
      'Đánh giá chỉ số InBody & % mỡ mỗi 2 tuần',
      'Giáo án AI tùy chỉnh theo tiến độ cá nhân',
      'Tặng Thực đơn Dinh dưỡng (Meal Plan) mẫu',
      'Hủy lịch trước 12 tiếng không mất credit',
      'Thời hạn sử dụng: 60 ngày',
      'Hỗ trợ trả góp / VNPay QR tiện lợi'
    ]
  },
  {
    id: 'pt-20',
    title: 'Gói Toàn Diện (Mastery 20)',
    credits: 20,
    price: '8.000.000đ',
    originalPrice: '10.000.000đ',
    pricePerSession: '400.000đ / buổi',
    validityDays: 120,
    badge: 'TIẾT KIỆM 20% CHI PHÍ',
    description: 'Cam kết bứt phá hình thể toàn diện, xây dựng thói quen tập luyện tự chủ trọn đời cùng Huấn luyện viên hàng đầu.',
    features: [
      '20 Credit đặt lịch PT 1:1 toàn diện',
      'Đo lường & Biểu đồ tiến độ chi tiết trên App',
      'Lộ trình dinh dưỡng Macro chuyên sâu',
      'Ưu tiên giữ slot giờ vàng (17h - 20h)',
      'Hủy lịch trước 12 tiếng không mất credit',
      'Thời hạn sử dụng: 120 ngày (có bảo lưu)',
      'Thanh toán VNPay Sandbox & Xuất hóa đơn VAT'
    ]
  }
];

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'mem-1m',
    name: 'Gói Standard Tháng',
    duration: '1 Tháng',
    price: '650.000đ',
    features: [
      'Check-in không giới hạn số lần / ngày',
      'Sử dụng toàn bộ khu vực máy móc & tạ tự do',
      'Miễn phí tủ đồ thông minh, phòng tắm nóng lạnh',
      'Nước uống tinh khiết miễn phí',
      'App quản lý thẻ & lịch sử check-in'
    ]
  },
  {
    id: 'mem-3m',
    name: 'Gói Prime Quý',
    duration: '3 Tháng',
    price: '1.750.000đ',
    originalPrice: '1.950.000đ',
    popular: true,
    features: [
      'Toàn bộ quyền lợi gói Standard',
      'Tặng 01 buổi trải nghiệm PT 1:1 + InBody',
      'Tặng bình nước thể thao cao cấp ApexFit',
      'Bảo lưu tối đa 14 ngày khi có việc bận',
      'Ưu tiên check-in nhanh qua FaceID/Mã QR'
    ]
  },
  {
    id: 'mem-12m',
    name: 'Gói Diamond Năm',
    duration: '12 Tháng',
    price: '5.800.000đ',
    originalPrice: '7.800.000đ',
    features: [
      'Toàn bộ quyền lợi gói Prime',
      'Tặng 03 buổi PT 1:1 chuyên sâu kèm theo',
      'Tặng 01 áo tập thể thao cao cấp + Túi gym',
      'Bảo lưu tối đa 60 ngày linh hoạt',
      'Được dẫn 01 bạn bè đi tập cùng 1 lần/tháng'
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Minh Đức (29 tuổi, IT Developer)',
    role: 'Hội viên Gói Chuyển Hóa 10 Buổi',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    coachName: 'Coach Hoàng Long',
    package: 'Gói PT 10 Buổi • Ngực & Lưng V-Taper',
    rating: 5,
    quote: 'Trước đây mình tự tập hay bị đau khớp vai và không biết cách siết cơ. Với gói 1:1, Coach Long chỉnh từng chi tiết form bench press và deadlift. Ứng dụng theo dõi số kg tạ và % mỡ cực kỳ trực quan!',
    achievement: {
      weightChange: '+3.5 kg Cơ',
      bodyFatChange: '-6.2% Mỡ',
      duration: '8 tuần'
    }
  },
  {
    id: 'test-2',
    name: 'Thu Hương (26 tuổi, Marketing Lead)',
    role: 'Hội viên Gói Toàn Diện 20 Buổi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    coachName: 'Coach Mai Anh',
    package: 'Gói PT 20 Buổi • Mông Đùi & Eo Thon',
    rating: 5,
    quote: 'Mình rất thích việc tự chọn slot trống của Coach trên điện thoại mà không phải nhắn tin hỏi qua lại. Hủy trước 12 tiếng được hoàn credit ngay lập tức nên lịch trình bận rộn vẫn cực kỳ yên tâm.',
    achievement: {
      weightChange: '-5.8 kg Mỡ',
      bodyFatChange: 'Vòng eo -7cm',
      duration: '12 tuần'
    }
  },
  {
    id: 'test-3',
    name: 'Văn Hoàng (34 tuổi, Giám đốc Kinh doanh)',
    role: 'Hội viên Gói Toàn Diện 20 Buổi',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    coachName: 'Coach Quốc Bảo',
    package: 'Gói PT 20 Buổi • Giảm Mỡ & Thể Lực',
    rating: 5,
    quote: 'Hệ thống quản lý rất chuyên nghiệp, thanh toán VNPay chỉ mất 10 giây có ngay hóa đơn và credit trong tài khoản. Giáo án AI kết hợp Coach duyệt giúp bài tập biến đổi phong phú, không hề bị nhàm chán.',
    achievement: {
      weightChange: '-9.0 kg Cân nặng',
      bodyFatChange: 'Huyết áp ổn định',
      duration: '16 tuần'
    }
  }
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'booking',
    question: 'Tôi có được chọn cố định một Huấn luyện viên cho toàn bộ gói tập không?',
    answer: 'Có! Khi bạn chọn mua gói PT (5, 10 hoặc 20 buổi), gói này sẽ được gắn cố định với Huấn luyện viên mà bạn đã chọn (và đã được phê duyệt chuyên môn cho khóa học đó). Bạn sẽ dùng số credit trong gói để đặt các slot mở của đúng Huấn luyện viên này.'
  },
  {
    id: 'faq-2',
    category: 'policy',
    question: 'Quy định hủy lịch tập và hoàn lại Credit như thế nào?',
    answer: 'Hệ thống áp dụng chính sách hủy lịch tự động minh bạch: Nếu bạn hủy trước giờ tập từ 12 tiếng trở lên, 1 credit sẽ được hoàn trả 100% vào ví gói tập ngay lập tức. Nếu hủy dưới 12 tiếng hoặc vắng mặt (No-show), credit sẽ bị tiêu thụ theo quy định. Trường hợp Coach hoặc phòng Gym hủy lịch vì lý do bất khả kháng, bạn sẽ luôn được hoàn credit bất kể thời điểm.'
  },
  {
    id: 'faq-3',
    category: 'payment',
    question: 'Tôi có cần mua thẻ Membership Gym trước khi mua gói PT 1:1 không?',
    answer: 'Có. Để vào phòng tập và sử dụng toàn bộ cơ sở vật chất (máy móc, phòng tắm, tủ đồ), bạn cần có thẻ Membership Gym đang hoạt động (gói Tháng, Quý hoặc Năm). Bạn có thể mua đồng thời cả Membership và Gói PT qua cổng thanh toán VNPay hoặc tại quầy lễ tân.'
  },
  {
    id: 'faq-4',
    category: 'coaching',
    question: 'Tính năng AI Recommendation hoạt động ra sao và có an toàn không?',
    answer: 'Hệ thống AI phân tích các chỉ số thể trạng (InBody), mục tiêu cá nhân, lịch sử nâng tạ và bài tập trước đó để đề xuất bản nháp giáo án và gợi ý thực đơn (Meal Plan) tối ưu. Tuy nhiên, Huấn luyện viên phụ trách bắt buộc phải trực tiếp kiểm tra, điều chỉnh và bấm "Phê duyệt" trước khi chuyển giao cho học viên. Điều này đảm bảo tính an toàn và tính cá nhân hóa 100%.'
  },
  {
    id: 'faq-5',
    category: 'payment',
    question: 'Các hình thức thanh toán được hỗ trợ trên hệ thống?',
    answer: 'Hệ thống hỗ trợ thanh toán trực tuyến qua Cổng thanh toán quốc gia VNPay (quét mã VNPAY-QR từ mọi ứng dụng ngân hàng, thẻ ATM nội địa, Visa/Mastercard) hoặc thanh toán trực tiếp bằng tiền mặt / chuyển khoản tại quầy Lễ tân. Tất cả giao dịch đều tự động xuất hóa đơn điện tử minh bạch.'
  },
  {
    id: 'faq-6',
    category: 'coaching',
    question: 'Gợi ý dinh dưỡng (Meal Plan) trên ứng dụng có thay thế bác sĩ không?',
    answer: 'Thực đơn dinh dưỡng trên hệ thống được xây dựng nhằm mục đích hỗ trợ năng lượng và tỷ lệ dinh dưỡng đa lượng (Protein, Carbs, Fats) cho quá trình tập luyện thể thao. Thực đơn không mang tính chất thay thế chỉ định y tế hoặc tư vấn từ bác sĩ chuyên khoa dinh dưỡng.'
  }
];
