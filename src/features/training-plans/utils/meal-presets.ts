import type { BodyAssessment, FitnessGoal } from '@/shared/types/api'

export interface MealPresetItem {
  mealType: string
  foodName: string
  quantity?: string
  estimatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  note?: string
  sortOrder: number
}

export interface MealPreset {
  id: string
  name: string
  tag: string
  badgeColor: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  description: string
  suitableFor: string
  defaultNotes: string
  meals: MealPresetItem[]
}

export const MEAL_PRESETS: MealPreset[] = [
  {
    id: 'high_protein_bulk',
    name: 'Thực Đơn Tăng Cơ Nạc (High Protein Lean Bulk)',
    tag: 'Tăng cơ nạc',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    targetCalories: 2200,
    targetProtein: 165,
    targetCarbs: 240,
    targetFat: 62,
    description: 'Tối ưu tổng hợp protein cơ bắp, hỗ trợ phục hồi sau các buổi tập kháng lực nặng.',
    suitableFor: 'Học viên có mục tiêu tăng cơ bắp, cải thiện sức mạnh hoặc thể trạng gầy/cân đối.',
    defaultNotes: 'Uống đủ 2.5 - 3 lít nước mỗi ngày. Bữa phụ dùng cách giờ tập 60 - 90 phút để có năng lượng tốt nhất.',
    meals: [
      {
        mealType: 'Bữa sáng (07:00 - 08:30)',
        foodName: 'Yến mạch nấu sữa tươi không đường + 3 lòng trắng trứng + 1 quả chuối sứ',
        quantity: '1 tô (350g)',
        estimatedCalories: 480,
        proteinGrams: 32,
        carbsGrams: 65,
        fatGrams: 10,
        note: 'Có thể rắc thêm 1 thìa hạt chia hoặc quế.',
        sortOrder: 1,
      },
      {
        mealType: 'Bữa trưa (11:30 - 13:00)',
        foodName: '200g Ức gà áp chảo + 1 chén cơm gạo lứt + 150g Bông cải xanh luộc',
        quantity: '1 đĩa tiêu chuẩn (450g)',
        estimatedCalories: 620,
        proteinGrams: 52,
        carbsGrams: 60,
        fatGrams: 12,
        note: 'Ướp ức gà với dầu oliu và tiêu đen, không nêm quá nhiều muối.',
        sortOrder: 2,
      },
      {
        mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
        foodName: '1 Muỗng Whey Protein Isolate + 2 lát Bánh mì hoa cúc/nguyên cám + 1 quả táo',
        quantity: '1 phần',
        estimatedCalories: 350,
        proteinGrams: 30,
        carbsGrams: 45,
        fatGrams: 5,
        note: 'Dùng trước giờ tập 60 phút để nạp Glycogen dự trữ.',
        sortOrder: 3,
      },
      {
        mealType: 'Bữa tối (19:00 - 20:30)',
        foodName: '200g Cá hồi hoặc phi lê cá Basa áp chảo + 1 củ khoai lang nướng + Salad rau rocket sốt giấm táo',
        quantity: '1 khẩu phần (400g)',
        estimatedCalories: 580,
        proteinGrams: 42,
        carbsGrams: 45,
        fatGrams: 20,
        note: 'Nguồn chất béo Omega-3 dồi dào hỗ trợ giảm viêm khớp.',
        sortOrder: 4,
      },
      {
        mealType: 'Bữa phụ tối (21:30)',
        foodName: '1 hộp Sữa chua Hy Lạp không đường + 10 hạt Hạnh nhân',
        quantity: '150g',
        estimatedCalories: 170,
        proteinGrams: 15,
        carbsGrams: 10,
        fatGrams: 8,
        note: 'Casein tự nhiên giúp nuôi cơ suốt đêm khi ngủ.',
        sortOrder: 5,
      },
    ],
  },
  {
    id: 'eat_clean_fat_loss',
    name: 'Thực Đơn Eat Clean Giảm Mỡ (Fat Loss Deficit)',
    tag: 'Giảm mỡ & Siết',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    targetCalories: 1750,
    targetProtein: 145,
    targetCarbs: 160,
    targetFat: 46,
    description: 'Tạo mức thâm hụt calo lành mạnh 350 - 500 kcal, giàu chất xơ và đạm để duy trì cơ bắp.',
    suitableFor: 'Học viên có tỷ lệ mỡ cơ thể cao, cần siết mỡ bụng và săn chắc toàn thân.',
    defaultNotes: 'Tuyệt đối tránh nước ngọt, trà sữa và đồ chiên rán nhiều dầu mỡ. Tăng cường ăn rau xanh trước bữa ăn chính.',
    meals: [
      {
        mealType: 'Bữa sáng (07:00 - 08:30)',
        foodName: '2 quả trứng ốp la (1 lòng đỏ) + 1 lát bánh mì lúa mạch đen + 1 quả dưa leo',
        quantity: '1 khẩu phần',
        estimatedCalories: 360,
        proteinGrams: 24,
        carbsGrams: 30,
        fatGrams: 12,
        note: 'Ăn kèm chút muối tiêu chanh, uống 1 ly nước lọc ấm.',
        sortOrder: 1,
      },
      {
        mealType: 'Bữa trưa (11:30 - 13:00)',
        foodName: '180g Thịt thăn bò áp chảo + 1/2 chén cơm gạo lứt + 200g Măng tây & Cà rốt hấp',
        quantity: '1 khẩu phần (400g)',
        estimatedCalories: 540,
        proteinGrams: 46,
        carbsGrams: 45,
        fatGrams: 14,
        note: 'Thịt bò cung cấp sắt và kẽm giúp duy trì thể lực khi ăn kiêng.',
        sortOrder: 2,
      },
      {
        mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
        foodName: '1 cốc Sữa đậu nành không đường + 1 quả chuối tiêu hoặc 1 muỗng Whey Isolate',
        quantity: '1 phần',
        estimatedCalories: 230,
        proteinGrams: 26,
        carbsGrams: 28,
        fatGrams: 3,
        note: 'Nạp năng lượng nhẹ nhàng tránh nặng bụng khi tập.',
        sortOrder: 3,
      },
      {
        mealType: 'Bữa tối (19:00 - 20:30)',
        foodName: '180g Tôm sú hấp sả + Canh rong biển đậu hũ non + 100g Bắp cải luộc',
        quantity: '1 khẩu phần (380g)',
        estimatedCalories: 460,
        proteinGrams: 44,
        carbsGrams: 35,
        fatGrams: 8,
        note: 'Hạn chế tinh bột nhanh vào bữa tối để hạn chế tích mỡ.',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'balanced_fitness',
    name: 'Thực Đơn Thể Thao Cân Bằng (Balanced Fitness & Energy)',
    tag: 'Duy trì cân bằng',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    targetCalories: 2000,
    targetProtein: 135,
    targetCarbs: 220,
    targetFat: 58,
    description: 'Cung cấp năng lượng bền bỉ, cân bằng 3 nhóm dưỡng chất chính cho sức bền và thể lực toàn diện.',
    suitableFor: 'Học viên tập luyện thể hình duy trì vóc dáng, rèn luyện tim mạch và nâng cao sức đề kháng.',
    defaultNotes: 'Duy trì ăn uống điều độ đúng giờ. Kết hợp bổ sung vitamin tổng hợp và khoáng chất theo hướng dẫn.',
    meals: [
      {
        mealType: 'Bữa sáng (07:00 - 08:30)',
        foodName: 'Bún gạo lứt thịt nạc heo xào nấm + Rau sống các loại',
        quantity: '1 tô vừa (350g)',
        estimatedCalories: 450,
        proteinGrams: 28,
        carbsGrams: 55,
        fatGrams: 11,
        note: 'Chọn thịt nạc thăn ít mỡ, nước lèo trong thanh đạm.',
        sortOrder: 1,
      },
      {
        mealType: 'Bữa trưa (11:30 - 13:00)',
        foodName: '200g Cá thu kho dứa nhạt + 1 chén cơm trắng/gạo lứt + Canh rau ngót nấu tôm',
        quantity: '1 khẩu phần (450g)',
        estimatedCalories: 610,
        proteinGrams: 45,
        carbsGrams: 65,
        fatGrams: 15,
        note: 'Ăn chậm nhai kỹ giúp tiêu hóa tốt hơn.',
        sortOrder: 2,
      },
      {
        mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
        foodName: '1 hũ sữa chua men sống + 1 thanh ngũ cốc yến mạch hạt điều',
        quantity: '1 phần',
        estimatedCalories: 240,
        proteinGrams: 12,
        carbsGrams: 35,
        fatGrams: 6,
        note: 'Tốt cho hệ vi sinh đường ruột và nạp năng lượng nhanh.',
        sortOrder: 3,
      },
      {
        mealType: 'Bữa tối (19:00 - 20:30)',
        foodName: '180g Ức gà luộc xé phay trộn gỏi bắp cải tím + 1 củ khoai tây hấp + Nước mắm chua ngọt nhẹ',
        quantity: '1 dĩa (400g)',
        estimatedCalories: 520,
        proteinGrams: 42,
        carbsGrams: 48,
        fatGrams: 13,
        note: 'Bắp cải tím chứa nhiều chất chống oxy hóa anthocyanin.',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'low_carb_shred',
    name: 'Thực Đơn Low Carb Cắt Nét (Keto / Low Carb Shred)',
    tag: 'Low Carb / Siết khô',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    targetCalories: 1650,
    targetProtein: 140,
    targetCarbs: 55,
    targetFat: 85,
    description: 'Giảm tối đa tinh bột, tăng chất béo tốt và đạm để kích thích cơ thể dùng mỡ thừa làm năng lượng.',
    suitableFor: 'Học viên muốn siết nét giai đoạn nước rút hoặc người có cơ địa nhạy cảm với tinh bột.',
    defaultNotes: 'Bổ sung thêm khoáng chất (Muối hồng, Kali, Magie) trong 3 ngày đầu để tránh hiện tượng uể oải.',
    meals: [
      {
        mealType: 'Bữa sáng (07:00 - 08:30)',
        foodName: '3 quả trứng chiên bơ tỏi + 1/2 quả bơ sáp cắt lát + Xà lách xốt mè rang',
        quantity: '1 đĩa (300g)',
        estimatedCalories: 450,
        proteinGrams: 22,
        carbsGrams: 10,
        fatGrams: 35,
        note: 'Bơ sáp là nguồn chất béo không bão hòa đơn lành mạnh.',
        sortOrder: 1,
      },
      {
        mealType: 'Bữa trưa (11:30 - 13:00)',
        foodName: '200g Thịt ba chỉ heo quay giòn bì kèm dưa leo + Rau muống xào tỏi dầu dừa',
        quantity: '1 khẩu phần (380g)',
        estimatedCalories: 580,
        proteinGrams: 42,
        carbsGrams: 12,
        fatGrams: 38,
        note: 'Không dùng cơm hay bánh mì trong bữa trưa.',
        sortOrder: 2,
      },
      {
        mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
        foodName: '1 Muỗng Whey Isolate pha nước lọc + 20g Hạt óc chó / Hạt Mắc ca',
        quantity: '1 phần',
        estimatedCalories: 220,
        proteinGrams: 28,
        carbsGrams: 5,
        fatGrams: 10,
        note: 'Cung cấp năng lượng sạch cho buổi tập mà không làm tăng đường huyết.',
        sortOrder: 3,
      },
      {
        mealType: 'Bữa tối (19:00 - 20:30)',
        foodName: '200g Cá tuyết hoặc cá Basa nướng bơ chanh + 150g Bông cải trắng xào',
        quantity: '1 khẩu phần (350g)',
        estimatedCalories: 400,
        proteinGrams: 38,
        carbsGrams: 12,
        fatGrams: 22,
        note: 'Bông cải trắng xào nghiền thay thế cơm rất ngon miệng.',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'plant_based_power',
    name: 'Thực Đơn Dinh Dưỡng Thuần Chay (Plant-Based Power)',
    tag: 'Thuần chay năng lượng',
    badgeColor: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20',
    targetCalories: 1950,
    targetProtein: 115,
    targetCarbs: 245,
    targetFat: 52,
    description: 'Kết hợp đa dạng các nguồn đạm thực vật từ đậu nành, hạt điều, đậu lăng và rau củ tươi.',
    suitableFor: 'Học viên ăn chay trường hoặc ăn chay bán phần muốn phát triển thể lực và bảo vệ tim mạch.',
    defaultNotes: 'Nên kết hợp nhiều loại đậu hạt trong bữa ăn để đảm bảo đủ 9 axit amin thiết yếu (Complete Protein).',
    meals: [
      {
        mealType: 'Bữa sáng (07:00 - 08:30)',
        foodName: 'Sinh tố protein thực vật (Bột đậu hữu cơ + Chuối + Bơ đậu phộng + Sữa hạt)',
        quantity: '1 ly lớn (450ml)',
        estimatedCalories: 460,
        proteinGrams: 28,
        carbsGrams: 58,
        fatGrams: 14,
        note: 'Bổ sung thêm 1 thìa men dinh dưỡng (Nutritional Yeast) giàu vitamin B12.',
        sortOrder: 1,
      },
      {
        mealType: 'Bữa trưa (11:30 - 13:00)',
        foodName: '200g Đậu hũ nướng tương Tamari + 1 chén cơm gạo lứt hạt sen + Cải thìa xào nấm đông cô',
        quantity: '1 đĩa (450g)',
        estimatedCalories: 580,
        proteinGrams: 36,
        carbsGrams: 68,
        fatGrams: 16,
        note: 'Đậu hũ non ép ráo nước trước khi nướng sẽ giòn và thơm ngon hơn.',
        sortOrder: 2,
      },
      {
        mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
        foodName: 'Bánh mì ngũ cốc phết sốt Hummus đậu gà + Nước dừa tươi',
        quantity: '1 phần',
        estimatedCalories: 270,
        proteinGrams: 12,
        carbsGrams: 42,
        fatGrams: 6,
        note: 'Nước dừa tươi giàu chất điện giải tự nhiên giúp ngừa chuột rút.',
        sortOrder: 3,
      },
      {
        mealType: 'Bữa tối (19:00 - 20:30)',
        foodName: 'Salad đậu lăng đỏ hầm cà chua & nấm đùi gà + 1 bắp ngô ngọt luộc + Dầu oliu nguyên chất',
        quantity: '1 tô lớn (420g)',
        estimatedCalories: 510,
        proteinGrams: 32,
        carbsGrams: 65,
        fatGrams: 13,
        note: 'Đậu lăng đỏ giàu chất xơ hòa tan giúp giảm cholesterol máu.',
        sortOrder: 4,
      },
    ],
  },
]

export interface BiometricNutritionAnalysis {
  weightKg: number
  heightCm: number
  bodyFatPercent?: number
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  suggestedCalories: number
  primaryGoal: string
  suggestedProtein: number
  suggestedCarbs: number
  suggestedFat: number
  rationale: string
}

/**
 * Tính toán TDEE và Calo khuyến nghị dựa trên chỉ số InBody gần nhất và Mục tiêu của hội viên
 */
export function calculateBiometricNutrition(
  assessment?: BodyAssessment | null,
  goals?: FitnessGoal[] | null
): BiometricNutritionAnalysis | null {
  if (!assessment) return null

  const weight = Number(assessment.weightKg) || 0
  const height = Number(assessment.heightCm) || 0
  const bodyFat = assessment.bodyFatPercent ? Number(assessment.bodyFatPercent) : undefined

  if (weight <= 0) return null

  // BMI
  const heightM = height > 0 ? height / 100 : 1.7
  const bmi = Number((weight / (heightM * heightM)).toFixed(1))
  let bmiCategory = 'Cân đối (Bình thường)'
  if (bmi < 18.5) bmiCategory = 'Thiếu cân (Gầy)'
  else if (bmi >= 23 && bmi < 25) bmiCategory = 'Thừa cân nhẹ (Tiền béo phì)'
  else if (bmi >= 25) bmiCategory = 'Béo phì (Cần giảm mỡ)'

  // BMR Calculation:
  // Use Katch-McArdle if body fat is known, else Mifflin-St Jeor
  let bmr = 0
  if (bodyFat && bodyFat > 5 && bodyFat < 60) {
    const lbm = weight * (1 - bodyFat / 100)
    bmr = Math.round(370 + 21.6 * lbm)
  } else if (height > 100) {
    // Mifflin-St Jeor average (age ~ 27)
    bmr = Math.round(10 * weight + 6.25 * height - 5 * 27 + 5)
  } else {
    bmr = Math.round(weight * 24)
  }

  // TDEE (Activity factor for PT clients training 3-5 times/week: 1.45)
  const tdee = Math.round(bmr * 1.45)

  // Determine Goal based on active FitnessGoal or BMI
  const activeGoal = goals && goals.length > 0 ? goals[0] : null
  const goalTitle = (activeGoal?.title || activeGoal?.metricName || '').toLowerCase()

  let primaryGoal = 'Cải thiện thể lực & Duy trì vóc dáng'
  let suggestedCalories = tdee
  let rationale = `BMR ước tính ${bmr} kcal. TDEE hoạt động thể thao ~${tdee} kcal/ngày.`

  const isFatLoss =
    goalTitle.includes('mỡ') ||
    goalTitle.includes('giảm') ||
    goalTitle.includes('siết') ||
    goalTitle.includes('weight loss') ||
    goalTitle.includes('cut') ||
    (bmi >= 25 && !goalTitle.includes('tăng'))

  const isMuscleGain =
    goalTitle.includes('cơ') ||
    goalTitle.includes('tăng') ||
    goalTitle.includes('bulk') ||
    goalTitle.includes('hypertrophy') ||
    bmi < 19

  if (isFatLoss) {
    primaryGoal = 'Giảm mỡ & Săn chắc cơ bắp (Fat Loss Deficit)'
    const deficit = Math.min(500, Math.round(tdee * 0.2))
    suggestedCalories = Math.max(1400, Math.round((tdee - deficit) / 50) * 50)
    rationale = `Áp dụng thâm hụt calo an toàn (-${tdee - suggestedCalories} kcal) so với TDEE ${tdee} kcal để thúc đẩy đốt mỡ.`
  } else if (isMuscleGain) {
    primaryGoal = 'Tăng cơ nạc & Khối lượng (Lean Bulking)'
    const surplus = 300
    suggestedCalories = Math.round((tdee + surplus) / 50) * 50
    rationale = `Áp dụng thặng dư calo nhẹ (+${suggestedCalories - tdee} kcal) so với TDEE ${tdee} kcal để tối ưu phát triển cơ nạc.`
  } else {
    suggestedCalories = Math.round(tdee / 50) * 50
    rationale = `Duy trì mức cân bằng năng lượng theo TDEE ~${suggestedCalories} kcal cho mục tiêu giữ phom và nâng cao sức bền.`
  }

  // Macronutrient breakdown:
  // Protein: 2.0g/kg bodyweight
  const suggestedProtein = Math.round(weight * 2.0)
  // Fat: 25% of total calories
  const suggestedFat = Math.round((suggestedCalories * 0.25) / 9)
  // Carbs: Remaining calories
  const proteinKcal = suggestedProtein * 4
  const fatKcal = suggestedFat * 9
  const remainingKcal = Math.max(200, suggestedCalories - proteinKcal - fatKcal)
  const suggestedCarbs = Math.round(remainingKcal / 4)

  return {
    weightKg: weight,
    heightCm: height,
    bodyFatPercent: bodyFat,
    bmi,
    bmiCategory,
    bmr,
    tdee,
    suggestedCalories,
    primaryGoal,
    suggestedProtein,
    suggestedCarbs,
    suggestedFat,
    rationale,
  }
}
