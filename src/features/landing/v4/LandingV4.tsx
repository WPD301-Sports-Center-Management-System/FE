import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, ArrowDown, ArrowUpRight, CalendarDays, Check, Dumbbell, Menu, Minus, Plus, RefreshCw, ShieldCheck, Target, X,
} from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { initialsOf } from '@/shared/components/ui/avatar'
import { difficultyLabel, useCatalog, usePublicCoaches, useReviews, type PublicCourse, type TrialContext } from '../api'
import { Brand } from './Brand'
import { HeroVideo } from './HeroVideo'
import { LandingModal } from './LandingModal'
import { LandingSeo } from './LandingSeo'
import { LeadForm } from './LeadForm'
import { FAQ, STOCK_IMAGES } from './content'
import { useLandingMotion } from './useLandingMotion'
import './landing-v4.css'
import './landing-v4-extra.css'

type OpenConsult = (context?: TrialContext) => void

const NAV_LINKS = [
  ['Giới thiệu', 'about'],
  ['Chương trình tập', 'programs'],
  ['Huấn luyện viên', 'coaches'],
  ['Gói tập', 'pricing'],
  ['FAQ', 'faq'],
] as const

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Smooth in-page navigation that keeps a real `#hash` href (works without JS too). */
function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  return true
}

function onAnchorClick(e: MouseEvent<HTMLAnchorElement>, id: string, after?: () => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  if (scrollToSection(id)) e.preventDefault()
  after?.()
}

function ErrorBox({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div className="error-box" role="status">
      <strong>Chưa tải được dữ liệu</strong>
      <p>{text}</p>
      {retry && (
        <button type="button" className="btn small" onClick={retry}>
          <RefreshCw size={14} />
          Thử lại
        </button>
      )}
    </div>
  )
}

function Nav({ onConsult }: { onConsult: OpenConsult }) {
  const [open, setOpen] = useState(false)
  return (
    <nav className="nav" aria-label="Điều hướng chính">
      <Brand />
      <div id="landing-nav-links" className={'nav-links ' + (open ? 'open' : '')}>
        {NAV_LINKS.map(([text, id]) => (
          <a key={id} href={'#' + id} onClick={(e) => onAnchorClick(e, id, () => setOpen(false))}>
            {text}
          </a>
        ))}
      </div>
      <div className="nav-actions">
        <Link className="login-link" to="/login">
          Đăng nhập
        </Link>
        <a
          className="btn lime small"
          href="#consult"
          onClick={(e) => {
            e.preventDefault()
            setOpen(false)
            onConsult()
          }}
        >
          Đăng ký tư vấn <ArrowUpRight size={15} />
        </a>
        <button
          type="button"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          aria-controls="landing-nav-links"
          className="icon-btn mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  )
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">
          <span />
          {eyebrow}
        </p>
        <h2>{title}</h2>
        {text && <p className="muted">{text}</p>}
      </div>
    </div>
  )
}

function CourseCard({ course, index, onConsult }: { course: PublicCourse; index: number; onConsult: OpenConsult }) {
  return (
    <a
      className="course-card"
      href="#consult"
      onClick={(e) => {
        e.preventDefault()
        onConsult({ interest: `Khóa ${course.name}` })
      }}
      aria-label={`${course.name} – Đăng ký tư vấn khóa này`}
    >
      <img src={course.imageUrl || STOCK_IMAGES[index % STOCK_IMAGES.length]} alt={course.name} loading="lazy" decoding="async" />
      <div className="course-top">
        <span>PT 1:1</span>
        <span>{String(index + 1).padStart(2, '0')} /</span>
      </div>
      <div className="course-bottom">
        <span className="tag">{difficultyLabel(course.difficultyLevel) || 'Huấn luyện cá nhân'}</span>
        <h3>{course.name}</h3>
        {(course.objective || course.description) && <p>{course.objective || course.description}</p>}
        <div className="course-meta">
          <span>
            {course.coachCount} Coach đồng hành
            {course.priceFrom != null && ` · Từ ${formatVND(course.priceFrom)}`}
          </span>
          <span className="round-arrow">
            <ArrowUpRight size={19} />
          </span>
        </div>
      </div>
    </a>
  )
}

function Programs({ onConsult }: { onConsult: OpenConsult }) {
  const catalog = useCatalog()
  const [group, setGroup] = useState<string | null>(null)
  const courses = catalog.data?.courses ?? []
  const groups = [...new Set(courses.flatMap((c) => c.muscleGroups))].sort((a, b) => a.localeCompare(b, 'vi'))
  const visible = group ? courses.filter((c) => c.muscleGroups.includes(group)) : courses
  const usesStock = visible.some((c) => !c.imageUrl)

  return (
    <section className="section" id="programs">
      <SectionHead
        eyebrow="CHƯƠNG TRÌNH HUẤN LUYỆN"
        title="Chương trình huấn luyện"
        text="Chọn mục tiêu tập luyện để tìm chương trình và huấn luyện viên phù hợp."
      />
      <div className="program-toolbar">
        {groups.length > 1 ? (
          <div className="tabs" role="group" aria-label="Lọc theo nhóm cơ">
            <button type="button" className={!group ? 'active' : ''} aria-pressed={!group} onClick={() => setGroup(null)}>
              Tất cả
            </button>
            {groups.map((g) => (
              <button type="button" key={g} className={group === g ? 'active' : ''} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className="subtle-label">
          CÁ NHÂN HÓA CÙNG COACH <ArrowUpRight size={15} />
        </span>
      </div>
      {catalog.isError ? (
        <ErrorBox text="Không tải được danh sách chương trình tập." retry={() => catalog.refetch()} />
      ) : !catalog.data ? (
        <div className="skeleton" aria-busy="true" aria-label="Đang tải chương trình tập" />
      ) : !visible.length ? (
        <p className="muted">Trung tâm đang cập nhật chương trình tập. Bạn vẫn có thể đăng ký tư vấn để được gợi ý lộ trình.</p>
      ) : (
        <div className="course-grid">
          {visible.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} onConsult={onConsult} />
          ))}
        </div>
      )}
      {usesStock && <p className="image-note">Ảnh stock dùng để minh họa chương trình, không phải hồ sơ nhân sự.</p>}
    </section>
  )
}

function Coaches() {
  const coaches = usePublicCoaches()
  return (
    <section className="coach-section section" id="coaches">
      <SectionHead
        eyebrow="NGƯỜI ĐỒNG HÀNH"
        title="Đội ngũ huấn luyện viên"
        text="Tìm hiểu chuyên môn, kinh nghiệm và các gói PT của từng Coach."
      />
      {coaches.isError ? (
        <ErrorBox text="Không tải được danh sách huấn luyện viên." retry={() => coaches.refetch()} />
      ) : !coaches.data ? (
        <div className="skeleton" aria-busy="true" aria-label="Đang tải huấn luyện viên" />
      ) : !coaches.data.length ? (
        <p className="muted">Trung tâm đang cập nhật đội ngũ huấn luyện viên.</p>
      ) : (
        <div className="coach-grid">
          {coaches.data.slice(0, 6).map((c) => {
            const rating = Number(c.averageRating ?? 0)
            return (
              <Link to={`/coaches/${c.id}`} className="coach-card" key={c.id}>
                <div className="coach-photo">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={`Huấn luyện viên ${c.fullName}`} loading="lazy" decoding="async" />
                  ) : (
                    <span className="coach-initials" aria-hidden="true">{initialsOf(c.fullName)}</span>
                  )}
                  <span className="coach-status">
                    <i />
                    KHÁM PHÁ HỒ SƠ
                  </span>
                  <span className="coach-go" aria-hidden="true">
                    <ArrowUpRight size={24} />
                  </span>
                  <span className="coach-profile-cta">
                    Xem hồ sơ <ArrowUpRight size={13} />
                  </span>
                </div>
                <div className="coach-info">
                  <h3>{c.fullName}</h3>
                  <span>{c.specialization || 'Huấn luyện cá nhân'}</span>
                  <div>
                    <span>{c.yearsOfExperience ? `${c.yearsOfExperience} năm kinh nghiệm` : 'PT 1:1'}</span>
                    <span>{c.reviewCount ? `★ ${rating.toFixed(1)} · ${c.reviewCount} đánh giá` : 'Chưa có đánh giá'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Pricing({ onConsult }: { onConsult: OpenConsult }) {
  const catalog = useCatalog()
  const [tab, setTab] = useState<'gym' | 'pt'>('gym')
  const plans = catalog.data?.membershipPlans ?? []
  const ptCourses = (catalog.data?.courses ?? []).filter((c) => c.priceFrom != null).sort((a, b) => (a.priceFrom ?? 0) - (b.priceFrom ?? 0))
  const perMonth = (p: (typeof plans)[number]) => Number(p.price) / Math.max(1, p.paidMonths + p.bonusMonths)
  // Highlighted plan is derived from real prices (lowest cost per month), never hand-picked.
  const featuredId = plans.length > 1 ? [...plans].sort((a, b) => perMonth(a) - perMonth(b))[0]?.id : undefined
  const count = tab === 'gym' ? plans.length : ptCourses.length

  return (
    <section className="section" id="pricing">
      <SectionHead eyebrow="VÉ GYM & HUẤN LUYỆN CÁ NHÂN" title="Gói tập & mức phí" />
      <div className="tabs pricing-tabs" role="group" aria-label="Loại gói">
        {([['gym', 'Vé vào gym'], ['pt', 'Gói huấn luyện PT 1:1']] as const).map(([v, t]) => (
          <button type="button" key={v} className={tab === v ? 'active' : ''} aria-pressed={tab === v} onClick={() => setTab(v)}>
            {t}
          </button>
        ))}
      </div>
      <div className="price-grid" style={{ '--price-cols': Math.min(Math.max(count, 1), 3) } as CSSProperties}>
        {catalog.isError ? (
          <ErrorBox text="Không tải được bảng giá." retry={() => catalog.refetch()} />
        ) : !catalog.data ? (
          <div className="skeleton" aria-busy="true" aria-label="Đang tải bảng giá" />
        ) : tab === 'gym' ? (
          plans.length ? (
            plans.map((p) => {
              const featured = p.id === featuredId
              return (
                <article className={'price-card ' + (featured ? 'featured' : '')} key={p.id}>
                  <span className="eyebrow">{p.paidMonths} THÁNG TẬP LUYỆN{p.bonusMonths > 0 && ` · TẶNG ${p.bonusMonths} THÁNG`}</span>
                  <h3>{p.name}</h3>
                  <div className="price">{formatVND(p.price)}</div>
                  <p>{p.paidMonths + p.bonusMonths} tháng · Không bao gồm huấn luyện PT</p>
                  <hr />
                  {['Vé vào không gian tập luyện', 'Chủ động tập theo lịch của bạn', 'PT 1:1 được mua riêng'].map((t) => (
                    <p className="check-line" key={t}>
                      <Check size={16} />
                      {t}
                    </p>
                  ))}
                  <button type="button" className={'btn ' + (featured ? 'lime' : 'outline')} onClick={() => onConsult({ interest: `Vé tập ${p.name}` })}>
                    Tư vấn gói tập <ArrowUpRight size={17} />
                  </button>
                </article>
              )
            })
          ) : (
            <p className="muted">Trung tâm đang cập nhật bảng giá vé tập. Vui lòng đăng ký tư vấn để được báo giá.</p>
          )
        ) : ptCourses.length ? (
          ptCourses.map((c, i) => (
            <article className={'price-card pt-price ' + (i === 0 ? 'featured' : '')} key={c.id}>
              <span className="eyebrow">PT 1:1 · {c.coachCount} COACH ĐANG NHẬN DẠY</span>
              <h3>{c.name}</h3>
              <div className="price">
                <small>Từ </small>
                {formatVND(c.priceFrom)}
              </div>
              <p>Giá của gói thấp nhất đang mở bán · Một Coach cố định suốt gói</p>
              <div className="check-line">
                <Check size={16} />
                Mua trước, đặt sau hoặc giữ lịch rồi thanh toán
              </div>
              <p>Giáo án cá nhân hóa theo từng buổi. Mua gói không đồng nghĩa đã có lịch tập.</p>
              <button type="button" className={'btn ' + (i === 0 ? 'lime' : 'outline')} onClick={() => onConsult({ interest: `Gói PT khóa ${c.name}` })}>
                Tư vấn gói PT này <ArrowUpRight size={17} />
              </button>
              <a className="text-link price-profile-link" href="#coaches" onClick={(e) => onAnchorClick(e, 'coaches')}>
                Xem Coach & các gói khác <ArrowUpRight size={15} />
              </a>
            </article>
          ))
        ) : (
          <p className="muted">Chưa có gói PT nào đang mở bán. Vui lòng đăng ký tư vấn để được báo giá.</p>
        )}
        <div className="price-aside">
          <Dumbbell size={38} />
          <h3>
            Cần tư vấn chọn gói
            <br />
            tập phù hợp?
          </h3>
          <p>Hãy kể cho chúng tôi mục tiêu của bạn. Cùng tìm một điểm bắt đầu phù hợp.</p>
          <a
            className="text-link"
            href="#consult"
            onClick={(e) => {
              e.preventDefault()
              onConsult()
            }}
          >
            Để chúng tôi giúp bạn <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}

/** Real, visible reviews only. The section is left out entirely until at least one exists. */
function Reviews() {
  const coaches = usePublicCoaches()
  const reviews = useReviews(coaches.data)
  if (!reviews.data?.length) return null
  return (
    <section className="section reviews-section" id="reviews">
      <SectionHead
        eyebrow="ĐÁNH GIÁ TỪ HỌC VIÊN"
        title="Trải nghiệm của học viên"
        text="Đánh giá được học viên gửi sau khi hoàn thành gói PT."
      />
      <div className="reviews-grid">
        {reviews.data.slice(0, 3).map((r) => (
          <article className="review-card" key={r.id}>
            <div className="stars" role="img" aria-label={`${r.rating} trên 5 sao`}>
              {'★'.repeat(Math.round(r.rating))}
              <span className="stars-empty">{'★'.repeat(Math.max(0, 5 - Math.round(r.rating)))}</span>
            </div>
            <blockquote>“{r.comment}”</blockquote>
            <div className="review-person">
              <span className="initial-avatar" aria-hidden="true">{initialsOf(r.memberName ?? 'Hội viên')}</span>
              <div>
                <b>{r.memberName ?? 'Hội viên'}</b>
                <small>
                  Coach {r.coachName}
                  {r.courseName ? ` · ${r.courseName}` : ''} · {formatDate(r.createdAt)}
                </small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="section">
      <div className="footer-top">
        <Brand />
        <p>Gym & huấn luyện cá nhân 1:1</p>
        <a href="#about" className="text-link" onClick={(e) => onAnchorClick(e, 'about')}>
          Về đầu trang <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ApexFIT. All rights reserved.</span>
        <span>PT 1:1 · DÀNH RIÊNG CHO BẠN</span>
        <span>DESIGNED FOR PROGRESS ↗</span>
      </div>
    </footer>
  )
}

export function LandingV4() {
  const landingRef = useRef<HTMLElement>(null)
  useLandingMotion(landingRef)
  // null = closed; {} = general request; otherwise what the visitor was looking at.
  // A shared /#consult link opens the form directly.
  const [consult, setConsult] = useState<TrialContext | null>(() => (typeof window !== 'undefined' && window.location.hash === '#consult' ? {} : null))
  const [faq, setFaq] = useState<number | null>(0)
  const openConsult = useCallback<OpenConsult>((context = {}) => setConsult(context), [])

  // Arriving from another page with /#section (e.g. "Quay lại huấn luyện viên").
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id || id === 'consult') return
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 150)
    return () => window.clearTimeout(timer)
  }, [])

  const consultLink = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    openConsult()
  }

  return (
    <div className="gc-landing">
      <LandingSeo />
      <Nav onConsult={openConsult} />
      <main ref={landingRef} className="public-landing">
        <div className="landing-progress" aria-hidden="true" />
        <section className="hero" id="about">
          <div className="hero-copy">
            <p className="eyebrow">
              <span />
              GYM & PERSONAL TRAINING
            </p>
            <h1>
              Huấn luyện
              <br />
              cá nhân.
              <br />
              <span>Phù hợp với bạn.</span>
            </h1>
            <p className="hero-desc">
              Tập cùng huấn luyện viên 1:1, với giáo án theo mục tiêu
              <br className="desktop" /> và lịch tập phù hợp với thời gian của bạn.
            </p>
            <div className="hero-actions">
              <a href="#coaches" className="btn lime" onClick={(e) => onAnchorClick(e, 'coaches')}>
                Tìm huấn luyện viên <ArrowUpRight size={18} />
              </a>
              <a href="#consult" className="hero-secondary" onClick={consultLink}>
                Đăng ký tư vấn <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={17} />
              <span>Coach cố định · Lịch tập linh hoạt · Theo dõi kết quả</span>
            </div>
          </div>
          <div className="hero-art">
            <HeroVideo />
          </div>
          <a className="scroll-cue" href="#programs" onClick={(e) => onAnchorClick(e, 'programs')}>
            <span className="scroll-arrow">
              <ArrowDown size={17} />
            </span>
            <span>Khám phá chương trình tập</span>
          </a>
        </section>

        <Stats />

        <section className="section benefits" aria-labelledby="benefits-title">
          <div className="benefit-intro">
            <p className="eyebrow">
              <span />
              HUẤN LUYỆN CÓ KẾ HOẠCH
            </p>
            <h2 id="benefits-title">
              Có người hướng dẫn.
              <br />
              Có kế hoạch rõ ràng.
            </h2>
          </div>
          {(
            [
              [Target, 'Giáo án cá nhân hóa', 'Giáo án PT 1:1 theo mục tiêu, thể trạng và nhịp sống của bạn.'],
              [CalendarDays, 'Lịch tập, bạn chủ động', 'Chọn từng buổi hoặc lịch theo tuần. Mua trước, đặt lịch sau.'],
              [Activity, 'Theo dõi kết quả', 'Theo dõi từng buổi tập và kết quả cùng Coach của bạn.'],
            ] as const
          ).map(([Icon, title, text]) => (
            <div className="benefit" key={title}>
              <Icon size={25} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <Programs onConsult={openConsult} />
        <Coaches />

        <section className="journey section" aria-labelledby="journey-title">
          <div>
            <p className="eyebrow">
              <span />
              BẮT ĐẦU THẬT ĐƠN GIẢN
            </p>
            <h2 id="journey-title">
              Bắt đầu tập luyện
              <br />
              <span>trong 3 bước.</span>
            </h2>
            <a href="#consult" className="text-link" onClick={consultLink}>
              Bắt đầu hành trình <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="steps">
            {[
              ['01', 'Chọn huấn luyện viên', 'Khám phá Coach và lựa chọn chuyên môn phù hợp.'],
              ['02', 'Chọn gói & cách bắt đầu', 'Mua trước đặt sau, hoặc giữ lịch rồi thanh toán.'],
              ['03', 'Tập theo lịch đã xác nhận', 'Lịch được xác nhận, giáo án được cá nhân hóa cho bạn.'],
            ].map(([n, t, d]) => (
              <div className="journey-step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
                <ArrowUpRight size={18} aria-hidden="true" />
              </div>
            ))}
            <p className="fine-print">
              <ShieldCheck size={14} />
              Xem trước lịch không giữ chỗ. Lịch tập được xác nhận theo hệ thống.
            </p>
          </div>
        </section>

        <Pricing onConsult={openConsult} />
        <Reviews />

        <section className="consult section" id="consult" aria-labelledby="consult-title">
          <div className="consult-copy">
            <p className="eyebrow">
              <span />
              TƯ VẤN CHƯƠNG TRÌNH TẬP
            </p>
            <h2 id="consult-title">
              Trao đổi mục tiêu.
              <br />
              Chọn cách tập.
              <br />
              <span>Bắt đầu phù hợp.</span>
            </h2>
            <p>
              Để lại thông tin. Chúng tôi sẽ cùng bạn
              <br />
              tìm một lộ trình phù hợp.
            </p>
            <span className="fine-print">
              <ShieldCheck size={16} />
              Thông tin của bạn chỉ dùng để liên hệ tư vấn.
            </span>
          </div>
          <LeadForm />
        </section>

        <section className="faq section" id="faq" aria-labelledby="faq-title">
          <div>
            <p className="eyebrow">
              <span />
              BẠN HỎI, CHÚNG TÔI TRẢ LỜI
            </p>
            <h2 id="faq-title">
              Thông tin cần biết
              <br />
              trước khi đăng ký.
            </h2>
            <p className="muted">Một hành trình tốt bắt đầu từ sự thấu hiểu.</p>
          </div>
          <div className="faq-list">
            {FAQ.map(([q, a], i) => (
              <div className={'faq-item ' + (faq === i ? 'expanded' : '')} key={q}>
                <h3>
                  <button type="button" id={`faq-q-${i}`} aria-expanded={faq === i} aria-controls={`faq-a-${i}`} onClick={() => setFaq(faq === i ? null : i)}>
                    {q}
                    {faq === i ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                  </button>
                </h3>
                {/* Answers stay in the HTML (hidden) so they are crawlable and match the FAQ schema. */}
                <p id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={faq !== i}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      {consult && (
        <LandingModal label="Đăng ký tư vấn" onClose={() => setConsult(null)}>
          {consult.interest && <p className="modal-context">BẠN ĐANG QUAN TÂM · {consult.interest}</p>}
          <LeadForm context={consult} />
        </LandingModal>
      )}
    </div>
  )
}

function Stats() {
  const catalog = useCatalog()
  return (
    <div className="stats-strip">
      {catalog.data ? (
        <>
          <div className="stats-intro">
            CHUYÊN MÔN & CHƯƠNG TRÌNH
            <br />
            <strong>TẠI APEXFIT</strong>
          </div>
          {(
            [
              [catalog.data.stats.coaches, 'Huấn luyện viên'],
              [catalog.data.stats.courses, 'Chương trình tập'],
              [catalog.data.stats.exercises, 'Bài tập chuyên biệt'],
            ] as const
          ).map(([n, t]) => (
            <div className="stat" key={t}>
              <b>{n}</b>
              <span>{t}</span>
            </div>
          ))}
          <span className="stats-note">
            Dữ liệu từ danh mục trung tâm
            <ArrowUpRight size={18} />
          </span>
        </>
      ) : catalog.isError ? (
        <ErrorBox text="Không tải được số liệu của trung tâm." retry={() => catalog.refetch()} />
      ) : (
        <p className="muted">Đang tải danh mục…</p>
      )}
    </div>
  )
}

export default LandingV4
