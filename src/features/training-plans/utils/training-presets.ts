import type { Exercise } from '@/shared/types/api'

export type MemberLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type WorkoutSplit = 'PULL' | 'PUSH' | 'LEGS' | 'FULL_BODY'

export type ExercisePhase =
  | 'ACTIVATION'
  | 'HEAVY_COMPOUND'
  | 'HYPERTROPHY'
  | 'UNILATERAL'
  | 'ACCESSORY'
  | 'COOL_DOWN'

export interface LevelConfig {
  sets: number
  reps: number
  rpe: string
  weight: string
  restSeconds: number
  instructions: string
}

export interface PresetExerciseItem {
  candidateNames: string[]
  roleName: string
  phase: ExercisePhase
  targetMuscle: string
  byLevel: Record<MemberLevel, LevelConfig>
}

export interface WorkoutPreset {
  id: string
  name: string
  split: WorkoutSplit
  targetMuscleGroup: string
  badgeColor: string
  description: string
  defaultTitle: string
  defaultGoal: string
  recoveryDays: number
  exercises: PresetExerciseItem[]
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'pull_day_hypertrophy',
    name: 'Giáo án Lưng & Tay trước (Pull Day)',
    split: 'PULL',
    targetMuscleGroup: 'Cơ Lưng, Xô & Tay trước',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Tối ưu độ dày và độ rộng lưng xô theo chu kỳ tuần, giãn cách phục hồi 48h-72h',
    defaultTitle: 'Giáo án Lưng & Tay trước (Pull Day Chuyên Sâu)',
    defaultGoal: 'Tối ưu hóa phom tạ Barbell/Cable, tạo độ dày xô và kiểm soát nhịp hạ Eccentric',
    recoveryDays: 3,
    exercises: [
      {
        candidateNames: ['Straight-Arm Cable Pulldown', 'Lat Pulldown', 'Pull Up'],
        roleName: '01. Khởi động kích hoạt (Activation)',
        phase: 'ACTIVATION',
        targetMuscle: 'Cơ xô (Lats)',
        byLevel: {
          BEGINNER: {
            sets: 2,
            reps: 12,
            rpe: 'RPE 6 (Khá nhẹ)',
            weight: '15.00',
            restSeconds: 45,
            instructions: 'Khởi động lưu thông máu khớp vai, tuyệt đối không dùng tạ nặng làm mỏi cơ sớm.',
          },
          INTERMEDIATE: {
            sets: 2,
            reps: 15,
            rpe: 'RPE 6 (Khá nhẹ)',
            weight: '25.00',
            restSeconds: 45,
            instructions: 'Khởi động lưu thông máu khớp vai, tuyệt đối không dùng tạ nặng làm mỏi cơ sớm.',
          },
          ADVANCED: {
            sets: 2,
            reps: 15,
            rpe: 'RPE 6-7 (Làm nóng chuẩn)',
            weight: '35.00',
            restSeconds: 45,
            instructions: 'Khởi động lưu thông máu khớp vai, cảm nhận độ căng giãn màng cơ xô trước bài chính.',
          },
        },
      },
      {
        candidateNames: ['Chest-Supported T-Bar Row', 'Seated Row', 'Deadlift'],
        roleName: '02. Heavy Compound tạo độ dày',
        phase: 'HEAVY_COMPOUND',
        targetMuscle: 'Lưng giữa, Trám & Xô',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Còn 3 rep)',
            weight: '25.00',
            restSeconds: 90,
            instructions: 'Ngực tựa đệm giúp giảm tải cho cột sống thắt lưng, tập trung tối đa lực kéo vào bả vai.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8 (Chừa 2 rep)',
            weight: '45.00',
            restSeconds: 105,
            instructions: 'Ngực tựa đệm giúp giảm tải cho cột sống thắt lưng, tập trung tối đa lực kéo vào bả vai.',
          },
          ADVANCED: {
            sets: 4,
            reps: 8,
            rpe: 'RPE 8.5 (Chừa 1-2 rep)',
            weight: '65.00',
            restSeconds: 120,
            instructions: 'Tạ nặng tối ưu sức mạnh, ngực tựa đệm giữ cố định thân, gồng core siết bả vai tối đa.',
          },
        },
      },
      {
        candidateNames: ['Wide-Grip Lat Pulldown', 'Lat Pulldown', 'Pull Up'],
        roleName: '03. Kéo dọc tạo độ rộng (Width)',
        phase: 'HYPERTROPHY',
        targetMuscle: 'Lưng xô ngoài',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Vừa sức)',
            weight: '30.00',
            restSeconds: 75,
            instructions: 'Nhịp hạ 2 giây (Eccentric), siết cơ xô 1 giây ở đáy chuyển động.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 11,
            rpe: 'RPE 8 – 8.5',
            weight: '45.00',
            restSeconds: 85,
            instructions: 'Nhịp hạ 2 giây (Eccentric), siết cơ xô 1 giây ở đáy chuyển động.',
          },
          ADVANCED: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8.5 (Siết sâu)',
            weight: '60.00',
            restSeconds: 90,
            instructions: 'Kiểm soát nhịp hạ chậm 3s, căng giãn hết biên độ cơ xô ở vị trí cao nhất.',
          },
        },
      },
      {
        candidateNames: ['Single-Arm Cable Row', 'Seated Row', 'Bicep Curl'],
        roleName: '04. Kéo ngang cô lập (Unilateral)',
        phase: 'UNILATERAL',
        targetMuscle: 'Lưng xô dưới',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Đều 2 bên)',
            weight: '15.00',
            restSeconds: 60,
            instructions: 'Giúp cân bằng cơ hai bên mạn sườn, kéo khuỷu tay sát thân người về phía hông.',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 11,
            rpe: 'RPE 8 (Đều lực)',
            weight: '25.00',
            restSeconds: 60,
            instructions: 'Giúp cân bằng cơ hai bên mạn sườn, kéo khuỷu tay sát thân người về phía hông.',
          },
          ADVANCED: {
            sets: 4,
            reps: 12,
            rpe: 'RPE 8.5 (Căng xô)',
            weight: '35.00',
            restSeconds: 60,
            instructions: 'Cô lập từng bên, xoay nhẹ thân người ở đỉnh để siết sâu vào cơ xô dưới.',
          },
        },
      },
      {
        candidateNames: ['Face Pull với dây thừng', 'Shoulder Press', 'Chest Fly'],
        roleName: '05. Cô lập lưng trên & Vai sau',
        phase: 'ACCESSORY',
        targetMuscle: 'Vai sau & Cơ thang giữa',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 12,
            rpe: 'RPE 7 (An toàn)',
            weight: '15.00',
            restSeconds: 60,
            instructions: 'Cải thiện độ mở xương bả vai, ngăn ngừa gù vai; không tập tới ngưỡng thất bại (Failure).',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 13,
            rpe: 'RPE 7 – 8',
            weight: '25.00',
            restSeconds: 60,
            instructions: 'Cải thiện độ mở xương bả vai, ngăn ngừa gù vai; không tập tới ngưỡng thất bại (Failure).',
          },
          ADVANCED: {
            sets: 4,
            reps: 15,
            rpe: 'RPE 8 (Mở bả vai)',
            weight: '35.00',
            restSeconds: 60,
            instructions: 'Siết giữ 2s ở vị trí bả vai mở rộng, khắc phục triệt để võng vai khi tập nặng.',
          },
        },
      },
      {
        candidateNames: ['Passive Lat Hang & Foam Roll', 'Plank', 'Pull Up'],
        roleName: '06. Hạ nhiệt & Kéo giãn (Cool-down)',
        phase: 'COOL_DOWN',
        targetMuscle: 'Toàn bộ mảng cơ lưng',
        byLevel: {
          BEGINNER: {
            sets: 1,
            reps: 3,
            rpe: 'RPE 1 – 2 (Thả lỏng)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Treo người trên xà thả lỏng cột sống, lăn bọt mạc cơ (foam rolling) hỗ trợ xả cơ ngay tại phòng.',
          },
          INTERMEDIATE: {
            sets: 1,
            reps: 4,
            rpe: 'RPE 1 – 2 (Thả lỏng)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Treo người trên xà thả lỏng cột sống, lăn bọt mạc cơ (foam rolling) hỗ trợ xả cơ ngay tại phòng.',
          },
          ADVANCED: {
            sets: 1,
            reps: 5,
            rpe: 'RPE 1 – 2 (Thả lỏng)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Treo người thả lỏng áp lực đĩa đệm, giải phóng màng cơ lưng sau buổi tập tạ nặng.',
          },
        },
      },
    ],
  },
  {
    id: 'push_day_strength',
    name: 'Giáo án Ngực, Vai & Tay sau (Push Day)',
    split: 'PUSH',
    targetMuscleGroup: 'Cơ Ngực, Vai trước/giữa & Tay sau',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Phát triển sức mạnh đẩy, form chuẩn Barbell/Dumbbell và độ dày ngực toàn diện',
    defaultTitle: 'Giáo án Ngực, Vai & Tay sau (Push Day Chuyên Sâu)',
    defaultGoal: 'Tối ưu phom đẩy Barbell, kích hoạt ngực trên và siết cơ tay sau có kiểm soát',
    recoveryDays: 3,
    exercises: [
      {
        candidateNames: ['Push Up', 'Chest Fly', 'Incline Press'],
        roleName: '01. Khởi động kích hoạt (Activation)',
        phase: 'ACTIVATION',
        targetMuscle: 'Ngực & Khớp vai',
        byLevel: {
          BEGINNER: {
            sets: 2,
            reps: 10,
            rpe: 'RPE 6 (Làm nóng)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Chống đẩy hít đất chậm, kích hoạt lưu thông máu khớp vai và ngực trước khi vào tạ.',
          },
          INTERMEDIATE: {
            sets: 2,
            reps: 15,
            rpe: 'RPE 6 (Làm nóng)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Chống đẩy có kiểm soát, gồng chắc cơ bụng và siết ngực ở đỉnh.',
          },
          ADVANCED: {
            sets: 2,
            reps: 20,
            rpe: 'RPE 6.5',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Kích hoạt khớp vai và đai vai, chuẩn bị cho các mức tạ nặng.',
          },
        },
      },
      {
        candidateNames: ['Bench Press', 'Incline Press', 'Push Up'],
        roleName: '02. Heavy Compound tạo độ dày ngực',
        phase: 'HEAVY_COMPOUND',
        targetMuscle: 'Ngực giữa & Toàn bộ ngực',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Còn 3 rep)',
            weight: '30.00',
            restSeconds: 90,
            instructions: 'Hạ thanh đòn chạm nhẹ giữa ngực, mở bả vai tựa sát ghế phẳng, không ưỡn thắt lưng quá mức.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 8,
            rpe: 'RPE 8 (Chừa 2 rep)',
            weight: '55.00',
            restSeconds: 105,
            instructions: 'Hạ đòn chậm 2 giây, đẩy dứt khoát và siết ngực, giữ khuỷu tay góc 45-60 độ so với thân.',
          },
          ADVANCED: {
            sets: 4,
            reps: 6,
            rpe: 'RPE 8.5-9 (Tạ nặng)',
            weight: '75.00',
            restSeconds: 120,
            instructions: 'Tạ nặng phát triển sức mạnh tối đa, gồng chắc chân và đai xô, tập trung lực đẩy từ ngực.',
          },
        },
      },
      {
        candidateNames: ['Incline Press', 'Bench Press', 'Push Up'],
        roleName: '03. Phát triển ngực trên (Upper Chest)',
        phase: 'HYPERTROPHY',
        targetMuscle: 'Ngực trên',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7',
            weight: '20.00',
            restSeconds: 75,
            instructions: 'Ghế dốc 30-45 độ, hạ tạ chạm phần trên ngực, cảm nhận lực căng cơ ngực trên.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8',
            weight: '40.00',
            restSeconds: 90,
            instructions: 'Kiểm soát nhịp hạ tạ, tránh dùng lực vai trước quá nhiều.',
          },
          ADVANCED: {
            sets: 4,
            reps: 8,
            rpe: 'RPE 8.5',
            weight: '55.00',
            restSeconds: 90,
            instructions: 'Tạ nặng có kiểm soát, đẩy dứt khoát và siết chặt ngực trên ở đỉnh.',
          },
        },
      },
      {
        candidateNames: ['Chest Fly', 'Push Up', 'Bench Press'],
        roleName: '04. Ép ngực cô lập (Chest Isolation)',
        phase: 'UNILATERAL',
        targetMuscle: 'Rãnh ngực & Viền ngoài',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 12,
            rpe: 'RPE 7',
            weight: '15.00',
            restSeconds: 60,
            instructions: 'Khuỷu tay hơi cong nhẹ cố định, mở rộng ngực tối đa và siết lại như ôm cây.',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 12,
            rpe: 'RPE 8',
            weight: '25.00',
            restSeconds: 60,
            instructions: 'Siết giữ 1 giây tại điểm giao nhau của tạ/cáp để kích thích rãnh ngực.',
          },
          ADVANCED: {
            sets: 4,
            reps: 12,
            rpe: 'RPE 8.5',
            weight: '35.00',
            restSeconds: 60,
            instructions: 'Kéo căng biên độ tối đa ở cuối chuyển động, siết cơ đỉnh điểm trong 1.5 giây.',
          },
        },
      },
      {
        candidateNames: ['Shoulder Press', 'Chest Fly', 'Push Up'],
        roleName: '05. Sức mạnh vai & Tay sau',
        phase: 'ACCESSORY',
        targetMuscle: 'Vai trước/giữa & Tay sau',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7',
            weight: '15.00',
            restSeconds: 60,
            instructions: 'Đẩy tạ thẳng đứng có kiểm soát, không khóa cứng khớp khuỷu tay.',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 8',
            weight: '25.00',
            restSeconds: 75,
            instructions: 'Gồng bụng chắc chắn, giữ cột sống thẳng, đẩy tạ đều hai bên.',
          },
          ADVANCED: {
            sets: 4,
            reps: 8,
            rpe: 'RPE 8.5',
            weight: '40.00',
            restSeconds: 90,
            instructions: 'Đẩy tạ nặng dứt khoát, giữ thăng bằng tối ưu bằng gồng core.',
          },
        },
      },
      {
        candidateNames: ['Plank', 'Push Up', 'Passive Lat Hang & Foam Roll'],
        roleName: '06. Khóa Core & Kéo giãn phục hồi',
        phase: 'COOL_DOWN',
        targetMuscle: 'Cơ bụng & Giãn ngực vai',
        byLevel: {
          BEGINNER: {
            sets: 2,
            reps: 30,
            rpe: 'RPE 6 (Giữ 30s)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Plank gồng cơ bụng 30-45 giây, sau đó ép giãn cơ ngực trên khung cửa hoặc cột xà.',
          },
          INTERMEDIATE: {
            sets: 2,
            reps: 45,
            rpe: 'RPE 7 (Giữ 45s)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Plank giữ 45-60s, sau đó dùng con lăn foam roller giãn cơ lưng và ngực.',
          },
          ADVANCED: {
            sets: 2,
            reps: 60,
            rpe: 'RPE 8 (Giữ 60s)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Plank siết core 60 giây, giải phóng áp lực khớp vai bằng ép cơ ngực sâu.',
          },
        },
      },
    ],
  },
  {
    id: 'leg_day_power',
    name: 'Giáo án Chân, Đùi & Mông (Leg Day)',
    split: 'LEGS',
    targetMuscleGroup: 'Cơ Đùi trước, Đùi sau, Mông & Bắp chân',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Xây dựng nền tảng thân dưới vững chắc, kích thích testosterone và đốt mỡ cao',
    defaultTitle: 'Giáo án Thân Dưới Chân - Mông (Leg Day Sức Mạnh)',
    defaultGoal: 'Phát triển sức mạnh Squat/Leg Press, an toàn khớp gối và cân bằng cơ đùi',
    recoveryDays: 3,
    exercises: [
      {
        candidateNames: ['Squat', 'Lunge', 'Leg Press'],
        roleName: '01. Khởi động kích hoạt (Activation)',
        phase: 'ACTIVATION',
        targetMuscle: 'Khớp háng, gối & Cơ mông',
        byLevel: {
          BEGINNER: {
            sets: 2,
            reps: 12,
            rpe: 'RPE 6 (Bodyweight)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Squat tay không chậm rãi, làm nóng khớp háng và gối trước khi gánh tạ.',
          },
          INTERMEDIATE: {
            sets: 2,
            reps: 15,
            rpe: 'RPE 6 (Làm nóng)',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Squat bodyweight kết hợp ép giãn cơ đùi sau và khớp cổ chân.',
          },
          ADVANCED: {
            sets: 2,
            reps: 20,
            rpe: 'RPE 6.5',
            weight: '0.00',
            restSeconds: 45,
            instructions: 'Khởi động xoay khớp háng sâu, mở khớp gối chuẩn hướng mũi chân.',
          },
        },
      },
      {
        candidateNames: ['Squat', 'Leg Press', 'Hip Thrust'],
        roleName: '02. Heavy Compound thân dưới',
        phase: 'HEAVY_COMPOUND',
        targetMuscle: 'Đùi trước, Mông & Toàn thân dưới',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Phom chuẩn)',
            weight: '30.00',
            restSeconds: 90,
            instructions: 'Hạ đùi song song mặt sàn, giữ lưng thẳng, đầu gối mở theo hướng mũi chân.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 8,
            rpe: 'RPE 8 (Chừa 2 rep)',
            weight: '60.00',
            restSeconds: 120,
            instructions: 'Gồng chặt cơ core (Bracing), nhịp hạ 2 giây vững vàng, đạp gót chân đẩy tạ lên.',
          },
          ADVANCED: {
            sets: 4,
            reps: 6,
            rpe: 'RPE 8.5-9 (Tạ nặng)',
            weight: '90.00',
            restSeconds: 150,
            instructions: 'Tạ nặng phát triển sức mạnh tối đa, thở sâu nén bụng gồng đai lưng vững chắc.',
          },
        },
      },
      {
        candidateNames: ['Leg Press', 'Squat', 'Lunge'],
        roleName: '03. Đạp đùi phát triển cơ bắp',
        phase: 'HYPERTROPHY',
        targetMuscle: 'Cơ tứ đầu đùi (Quads)',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 12,
            rpe: 'RPE 7',
            weight: '50.00',
            restSeconds: 75,
            instructions: 'Đặt chân giữa bàn đạp, không khóa khớp gối ở vị trí cao nhất.',
          },
          INTERMEDIATE: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8',
            weight: '90.00',
            restSeconds: 90,
            instructions: 'Hạ sâu có kiểm soát, đạp dứt khoát không để mông nhấc khỏi đệm tựa.',
          },
          ADVANCED: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8.5',
            weight: '140.00',
            restSeconds: 105,
            instructions: 'Căng cơ tối đa, kiểm soát nhịp hạ 3s đốt cháy toàn bộ sợi cơ đùi.',
          },
        },
      },
      {
        candidateNames: ['Lunge', 'Squat', 'Leg Press'],
        roleName: '04. Đơn phương & Cân bằng hai chân (Unilateral)',
        phase: 'UNILATERAL',
        targetMuscle: 'Cơ đùi & Mông từng bên',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 7 (Đều 2 chân)',
            weight: '10.00',
            restSeconds: 60,
            instructions: 'Bước dài vừa đủ, hạ đùi trước vuông góc, giữ thăng bằng thân người.',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 8 (Đều chân)',
            weight: '20.00',
            restSeconds: 60,
            instructions: 'Cầm tạ đơn hai bên, bước vững chắc giúp khắc phục lệch cơ 2 chân.',
          },
          ADVANCED: {
            sets: 4,
            reps: 12,
            rpe: 'RPE 8.5',
            weight: '30.00',
            restSeconds: 60,
            instructions: 'Tăng tải tạ đơn, hạ gối sau gần chạm sàn kiểm soát hoàn toàn thăng bằng.',
          },
        },
      },
      {
        candidateNames: ['Hip Thrust', 'Deadlift', 'Squat'],
        roleName: '05. Kích hoạt cơ mông & Đùi sau',
        phase: 'ACCESSORY',
        targetMuscle: 'Cơ mông lớn & Đùi sau',
        byLevel: {
          BEGINNER: {
            sets: 3,
            reps: 12,
            rpe: 'RPE 7',
            weight: '25.00',
            restSeconds: 60,
            instructions: 'Lưng trên tựa ghế, siết cơ mông ở đỉnh trong 1-2 giây.',
          },
          INTERMEDIATE: {
            sets: 3,
            reps: 10,
            rpe: 'RPE 8',
            weight: '50.00',
            restSeconds: 75,
            instructions: 'Đẩy hông cao ngang thân, siết chặt cơ mông, không dùng thắt lưng nâng tạ.',
          },
          ADVANCED: {
            sets: 4,
            reps: 10,
            rpe: 'RPE 8.5',
            weight: '80.00',
            restSeconds: 90,
            instructions: 'Tạ nặng phát triển khối cơ mông, giữ đỉnh 2 giây cảm nhận co bóp tối đa.',
          },
        },
      },
      {
        candidateNames: ['Plank', 'Passive Lat Hang & Foam Roll', 'Squat'],
        roleName: '06. Giãn cơ & Hạ nhiệt thân dưới',
        phase: 'COOL_DOWN',
        targetMuscle: 'Đùi, Hông & Thắt lưng',
        byLevel: {
          BEGINNER: {
            sets: 1,
            reps: 3,
            rpe: 'RPE 1 – 2 (Xả cơ)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Kéo giãn cơ đùi trước, cơ đùi sau và lăn foam roller giảm nhức mỏi DOMS.',
          },
          INTERMEDIATE: {
            sets: 1,
            reps: 4,
            rpe: 'RPE 1 – 2 (Xả cơ)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Lăn bọt mạc cơ (foam rolling) toàn bộ đùi và mông để cơ nhanh hồi phục.',
          },
          ADVANCED: {
            sets: 1,
            reps: 5,
            rpe: 'RPE 1 – 2 (Xả cơ)',
            weight: '0.00',
            restSeconds: 0,
            instructions: 'Kéo giãn sâu cơ gấp hông (hip flexors) và giải phóng màng cơ sau buổi tạ nặng.',
          },
        },
      },
    ],
  },
]

/**
 * Tìm bài tập trong cơ sở dữ liệu khớp tốt nhất với danh sách tên gợi ý của mẫu.
 */
export function findMatchingExercise(
  candidateNames: string[],
  availableExercises: Exercise[]
): Exercise | undefined {
  for (const name of candidateNames) {
    const exact = availableExercises.find(
      (e) => e.name.toLowerCase().trim() === name.toLowerCase().trim()
    )
    if (exact) return exact
  }
  for (const name of candidateNames) {
    const partial = availableExercises.find(
      (e) =>
        e.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(e.name.toLowerCase())
    )
    if (partial) return partial
  }
  return undefined
}
