import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  CheckCheck,
  Calendar,
  DollarSign,
  Dumbbell,
  HelpCircle,
  Wrench,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { notificationsService } from '../services/notifications.service'
import type { AppNotification, NotificationType } from '../types/notifications.types'
import { formatDateTime } from '@/shared/utils/date'
import { useAuth } from '@/features/auth/context/auth-context'
import { useNavigate } from 'react-router-dom'
import { notificationTarget } from '../notification-target'

export function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const generation = useRef(0)
  useEffect(() => {
    generation.current++
    setNotifications([])
    setIsOpen(false)
    setUnreadCount(0)
  }, [user?.id])

  // Fetch unread count on mount or when user changes
  const fetchUnreadCount = useCallback(async () => {
    const request = generation.current
    if (!user) {
      setUnreadCount(0)
      return
    }
    try {
      const res = await notificationsService.getUnreadCount()
      if (request !== generation.current) return
      setUnreadCount(res.count || 0)
    } catch {
      // Ignore background badge fetch error
    }
  }, [user])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Fetch full list when dropdown opens
  const fetchNotifications = useCallback(async () => {
    const request = ++generation.current
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await notificationsService.getNotifications({ limit: 20 })
      if (request !== generation.current) return
      setNotifications(res.data || [])
      // Update unread count based on current data
      const unread = (res.data || []).filter((n) => !n.readAt).length
      setUnreadCount(unread)
    } catch (err: any) {
      if (request !== generation.current) return
      if (err?.status === 401) {
        setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
      } else if (err?.status === 403) {
        setErrorMessage('Không có quyền truy cập thông báo.')
      } else {
        setErrorMessage('Không thể tải danh sách thông báo.')
      }
    } finally {
      if (request === generation.current) setIsLoading(false)
    }
  }, [])

  const handleToggle = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      fetchNotifications()
    }
  }

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Mark single notification as read
  const handleMarkAsRead = async (item: AppNotification) => {
    const target = notificationTarget(item, user?.role)
    if (target) { navigate(target); setIsOpen(false) }
    if (item.readAt) return
    try {
      const updated = await notificationsService.markAsRead(item.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: updated.readAt || new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Do not update state if API fails
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return
    setIsMarkingAll(true)
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch {
      setErrorMessage('Không thể đánh dấu đã đọc tất cả thông báo.')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING':
      case 'SLOT':
        return <Calendar className="h-4 w-4 text-cyan-400" />
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4 text-emerald-500" />
      case 'TRAINING':
        return <Dumbbell className="h-4 w-4 text-primary" />
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-amber-500" />
      case 'SUPPORT':
        return <HelpCircle className="h-4 w-4 text-purple-500" />
      case 'SYSTEM':
      default:
        return <Shield className="h-4 w-4 text-text-muted" />
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-grid min-h-11 min-w-11 place-items-center rounded-xl border border-border-subtle bg-bg-surface p-2 text-text-muted hover:text-text-primary hover:bg-bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer sm:min-h-0 sm:min-w-0"
        title="Thông báo hệ thống"
        aria-label="Thông báo"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-4 top-16 mt-2 rounded-2xl border border-border-subtle bg-bg-surface shadow-2xl z-50 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 bg-bg-surface">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-xs text-primary hover:underline transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{isMarkingAll ? 'Đang xử lý...' : 'Đọc tất cả'}</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border-subtle">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : errorMessage ? (
              <div className="p-4 flex items-start gap-2.5 text-xs text-danger bg-danger/10">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{errorMessage}</p>
                  <button
                    onClick={fetchNotifications}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-text-muted space-y-1">
                <p>Bạn không có thông báo nào.</p>
                <p className="text-xs opacity-75">Các cập nhật quan trọng sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void handleMarkAsRead(n) } }}
                    onClick={() => handleMarkAsRead(n)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      isUnread
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'bg-transparent hover:bg-bg-surface-muted/60'
                    }`}
                  >
                    <div className="mt-0.5 rounded-xl bg-bg-surface-muted p-2 shrink-0 border border-border-subtle">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${isUnread ? 'text-text-primary' : 'text-text-muted'}`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-text-muted/80">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
