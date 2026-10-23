import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Menu, Play, Quote, Sparkles, X } from 'lucide-react';
import { AppDownloadModal } from '@/features/landing/components/AppDownloadModal';
import { CoachModal } from '@/features/landing/components/CoachModal';
import { TrialModal } from '@/features/landing/components/TrialModal';
import {
  COACHES,
  FAQS,
  MEMBERSHIP_PLANS,
  PT_PACKAGES,
  TESTIMONIALS,
  TRAINING_COURSES,
} from '@/features/landing/data/landingData';
import type { Coach, MembershipPlan, PtPackage, TrainingCourse } from '@/features/landing/data/landingData';

const photo = (id: string, width = 1200, height = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
const courseLabels = ['Ngực & tay sau', 'Lưng & tay trước', 'Chân & mông đùi', 'Core & đốt mỡ'];

export const LandingPage = () => {
  const [trialOpen, setTrialOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [packageChoice, setPackageChoice] = useState<PtPackage | null>(null);
  const [membership, setMembership] = useState<MembershipPlan | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pricingTab, setPricingTab] = useState<'pt' | 'membership'>('pt');
  const [pricingIndex, setPricingIndex] = useState(1);
  const [faqIndex, setFaqIndex] = useState(0);

  const openTrial = (selection?: { course?: TrainingCourse; pkg?: PtPackage; plan?: MembershipPlan }) => {
    setCourse(selection?.course ?? null);
    setPackageChoice(selection?.pkg ?? null);
    setMembership(selection?.plan ?? null);
    setTrialOpen(true);
  };

  const plans = pricingTab === 'pt' ? PT_PACKAGES : MEMBERSHIP_PLANS;
  const activePlan = plans[pricingIndex] ?? plans[0];

  return (
    <div className="apex-page">
      <header className="apex-nav">
        <a className="apex-mark" href="#top" aria-label="ApexFit trang chủ"><span className="apex-mark-ring" />ApexFit</a>
        <nav className={`apex-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#method" onClick={() => setMenuOpen(false)}>Phương pháp</a>
          <a href="#coaches" onClick={() => setMenuOpen(false)}>Huấn luyện viên</a>
          <a href="#plans" onClick={() => setMenuOpen(false)}>Gói tập</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>Giải đáp</a>
        </nav>
        <div className="apex-nav-actions">
          <a className="apex-login" href="/login">Cổng nội bộ</a>
          <button className="apex-button apex-button-small" onClick={() => openTrial()}>Bắt đầu</button>
          <button className="apex-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Mở menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      <main id="top">
        <section className="apex-hero">
          <div className="apex-hero-copy reveal">
            <h1>Tập đúng.<br /><span>Sống mạnh.</span></h1>
            <p className="apex-lead">Một lộ trình tập luyện được đo theo cơ thể, mục tiêu và nhịp sống của riêng bạn.</p>
            <div className="apex-actions">
              <button className="apex-button" onClick={() => openTrial()}>Đăng ký buổi thử <ArrowUpRight size={18} /></button>
              <a className="apex-text-link" href="#method"><Play size={14} fill="currentColor" /> Xem cách hoạt động</a>
            </div>
            <div className="apex-hero-proof"><span>4.9/5</span><span className="apex-stars">Đánh giá tốt</span><span>từ hội viên đã tập cùng ApexFit</span></div>
          </div>
          <div className="apex-hero-art reveal reveal-delay">
            <div className="apex-disc" />
            <img src={photo('photo-1581009146145-b5ef050c2e1e', 900, 1200)} alt="Hội viên đang tập luyện tại ApexFit" />
            <div className="apex-hero-note"><strong>+ 3.5 kg</strong><span>khối lượng cơ sau 8 tuần</span></div>
          </div>
        </section>

        <section className="apex-proof-strip">
          <div><strong>1:1</strong><span>Huấn luyện theo mục tiêu</span></div>
          <div><strong>24h</strong><span>Kế hoạch được điều chỉnh</span></div>
          <div><strong>100%</strong><span>Tiến độ nhìn thấy được</span></div>
          <p>Không đoán mò. Chỉ cần một bước đầu tiên.</p>
        </section>

        <section className="apex-section apex-problem" id="problem">
          <div className="apex-problem-statement reveal">
            <h2>Bạn không thiếu<br />ý chí.</h2>
            <p>Bạn thiếu một lộ trình đủ rõ để biết hôm nay cần tập gì, ăn thế nào và tiến bộ ra sao.</p>
          </div>
          <div className="apex-problem-list reveal">
            <div><strong>Lịch tập dễ vỡ</strong><span>Bận một tuần là mất luôn nhịp tập.</span></div>
            <div><strong>Bài tập không đúng mục tiêu</strong><span>Tập nhiều nhưng cơ thể chưa thay đổi như mong muốn.</span></div>
            <div><strong>Không biết mình đang tiến bộ</strong><span>Không có dữ liệu để điều chỉnh trước khi quá muộn.</span></div>
          </div>
        </section>

        <section className="apex-section apex-method" id="method">
          <div className="apex-section-heading reveal"><h2>Thay đổi bắt đầu<br />từ dữ liệu thật.</h2></div>
          <div className="apex-method-grid">
            {[
              ['Đánh giá cơ thể', 'InBody và trao đổi mục tiêu để biết chính xác điểm bắt đầu.'],
              ['Thiết kế lộ trình', 'Bài tập, dinh dưỡng và lịch tập được sắp cho nhịp sống của bạn.'],
              ['Theo dõi tiến độ', 'Mỗi buổi tập tạo thêm một dữ liệu để huấn luyện viên điều chỉnh.'],
            ].map(([title, text], index) => (
              <article className={`apex-method-card tone-${index + 1} reveal`} key={title}>
                <h3>{title}</h3><p>{text}</p><div className="apex-card-orbit" />
              </article>
            ))}
          </div>
        </section>

        <section className="apex-section apex-courses" id="courses">
          <div className="apex-section-heading apex-heading-row reveal"><div><h2>Tập cho điều<br />bạn muốn đạt.</h2></div><p className="apex-heading-aside">Từ tăng cơ, giảm mỡ đến cải thiện sức bền. Bạn chọn mục tiêu, chúng tôi lo phần còn lại.</p></div>
          <div className="apex-course-grid">
            {TRAINING_COURSES.slice(0, 4).map((item, index) => <button className={`apex-course-card course-${index + 1} reveal`} key={item.id} onClick={() => openTrial({ course: item })}>
              <img src={item.image} alt={item.title} loading="lazy" /><div><h3>{courseLabels[index]}</h3><p>{item.duration} · {item.caloriesBurn}</p></div><ArrowUpRight size={22} />
            </button>)}
          </div>
        </section>

        <section className="apex-section apex-coaches" id="coaches">
          <div className="apex-coach-image reveal"><img src={photo('photo-1534438327276-14e5300c3a48', 900, 1100)} alt="Không gian tập luyện và huấn luyện viên ApexFit" loading="lazy" /><span>Luôn bên<br />bạn.</span></div>
          <div className="apex-coach-copy reveal"><h2>Người đồng hành<br />luôn bên bạn.</h2><p>Huấn luyện viên ApexFit không chỉ đếm rep. Họ quan sát, điều chỉnh và giúp bạn giữ nhịp đủ lâu để thay đổi trở thành thói quen.</p><div className="apex-coach-list">{COACHES.slice(0, 3).map((item) => <button key={item.id} onClick={() => setCoach(item)}><img src={item.avatar} alt={item.name} /><span><strong>{item.name}</strong><small>{item.title}</small></span><ArrowUpRight size={18} /></button>)}</div></div>
        </section>

        <section className="apex-section apex-process" id="process"><div className="apex-process-intro"><h2>Tiến bộ<br />có nhịp.</h2><button className="apex-text-link" onClick={() => openTrial()}>Nhận tư vấn lộ trình <ArrowUpRight size={16} /></button></div><div className="apex-process-visual"><div className="process-tile process-small"><img src={photo('photo-1517836357463-d25dfeac3438', 700, 700)} alt="Bắt đầu buổi tập" loading="lazy" /><b>Bắt đầu</b><span>Đánh giá cơ thể</span></div><div className="process-tile process-medium"><img src={photo('photo-1583454110551-21f2fa2afe61', 800, 950)} alt="Tập cùng huấn luyện viên" loading="lazy" /><b>Tập trung</b><span>Huấn luyện 1:1</span></div><div className="process-tile process-large"><img src={photo('photo-1538805060514-97d9cc17730c', 900, 1200)} alt="Theo dõi tiến độ" loading="lazy" /><b>Tiến bộ</b><span>Thấy kết quả</span></div></div></section>

        <section className="apex-section apex-quote-section"><div className="apex-portrait"><img src={TESTIMONIALS[0].avatar} alt={TESTIMONIALS[0].name} loading="lazy" /><span>Hội viên ApexFit</span></div><blockquote><Quote size={32} /><p>“{TESTIMONIALS[0].quote}”</p><footer><strong>{TESTIMONIALS[0].name}</strong><span>{TESTIMONIALS[0].role}</span></footer></blockquote><img className="apex-quote-detail" src={photo('photo-1534438327276-14e5300c3a48', 420, 420)} alt="Không gian ApexFit" loading="lazy" /></section>

        <section className="apex-section apex-pricing" id="plans"><div className="apex-section-heading reveal"><h2>Một gói tập<br />đúng nhịp bạn.</h2></div><div className="apex-pricing-layout"><div className="apex-plan-list"><div className="apex-tabs"><button className={pricingTab === 'pt' ? 'active' : ''} onClick={() => { setPricingTab('pt'); setPricingIndex(1); }}>PT 1:1</button><button className={pricingTab === 'membership' ? 'active' : ''} onClick={() => { setPricingTab('membership'); setPricingIndex(1); }}>Membership</button></div>{plans.map((plan, index) => <button className={`apex-plan-name ${index === pricingIndex ? 'active' : ''}`} key={'id' in plan ? plan.id : index} onClick={() => setPricingIndex(index)}>{'title' in plan ? plan.title : plan.name}<span>{index === pricingIndex ? '•' : '·'}</span></button>)}</div><div className="apex-plan-detail reveal"><span className="apex-plan-tag">{activePlan.popular ? 'Được chọn nhiều nhất' : 'Bắt đầu theo cách của bạn'}</span><strong>{activePlan.price}</strong><p>{'description' in activePlan ? activePlan.description : `Gói ${activePlan.duration} để bạn duy trì nhịp tập đều đặn và chủ động sử dụng toàn bộ khu vực tập.`}</p><ul>{activePlan.features.slice(0, 5).map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><button className="apex-button" onClick={() => 'title' in activePlan ? openTrial({ pkg: activePlan }) : openTrial({ plan: activePlan })}>Chọn gói này <ArrowUpRight size={18} /></button></div></div></section>

        <section className="apex-section apex-faq" id="faq"><div className="apex-section-heading reveal"><h2>Câu hỏi trước<br />khi bắt đầu.</h2></div><div className="apex-faq-list">{FAQS.slice(0, 5).map((item, index) => <div className={`apex-faq-item ${faqIndex === index ? 'open' : ''}`} key={item.id}><button onClick={() => setFaqIndex(faqIndex === index ? -1 : index)}><span>{item.question}</span><ChevronDown size={22} /></button>{faqIndex === index && <p>{item.answer}</p>}</div>)}</div></section>

        <section className="apex-cta"><div><h2>Bắt đầu<br />ngay.</h2><p>Đăng ký buổi tư vấn miễn phí. Chúng tôi sẽ gọi lại trong 15 phút để nghe mục tiêu của bạn.</p><button className="apex-button apex-button-light" onClick={() => openTrial()}>Đăng ký ngay <ArrowUpRight size={18} /></button></div><div className="apex-cta-disc"><Sparkles size={56} /></div></section>
      </main>

      <footer className="apex-footer"><div className="apex-footer-mark">Apex<span>Fit</span></div><div className="apex-footer-links"><div><strong>Khám phá</strong><a href="#method">Phương pháp</a><a href="#coaches">Huấn luyện viên</a><a href="#plans">Gói tập</a></div><div><strong>Hỗ trợ</strong><a href="#faq">Câu hỏi thường gặp</a><button onClick={() => setDownloadOpen(true)}>Tải ứng dụng</button><a href="mailto:hello@apexfit.vn">hello@apexfit.vn</a></div><div><strong>Ghé thăm</strong><p>28 Nguyễn Cơ Thạch<br />Nam Từ Liêm, Hà Nội</p><p>06:00–22:00 mỗi ngày</p></div></div><div className="apex-footer-bottom"><span>© 2025 ApexFit. Tập đúng, sống mạnh.</span><a href="#top">Về đầu trang ↑</a></div></footer>

      <TrialModal isOpen={trialOpen} onClose={() => setTrialOpen(false)} initialCourse={course} initialPtPackage={packageChoice} initialMembership={membership} />
      <CoachModal coach={coach} onClose={() => setCoach(null)} onOpenTrialWithCoach={() => { setCoach(null); openTrial(); }} />
      <AppDownloadModal isOpen={downloadOpen} onClose={() => setDownloadOpen(false)} />
    </div>
  );
};

export default LandingPage;
