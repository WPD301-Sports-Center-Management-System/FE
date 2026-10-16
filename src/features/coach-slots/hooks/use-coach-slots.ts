import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/hooks/use-auth'
import { coachSlotService } from '../services/coach-slot-service'
import { coachSlotKeys } from '../constants/coach-slot.constants'
import type {
  CreateSlotInput,
  BulkCreateSlotInput,
  BlockSlotInput,
  QuickBulkCreateSlotsInput,
} from '../types/coach-slot-types'

export function useCoachSlots(params: { coachId?: string; from?: string; to?: string; limit?: number }) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...coachSlotKeys.list(params), user?.id || 'anonymous'],
    queryFn: () => coachSlotService.getSlots(params),
    staleTime: 30_000,
  })
}

export function useCreateSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSlotInput) => coachSlotService.createSlot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useBulkCreateSlots() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkCreateSlotInput) => coachSlotService.bulkCreateSlots(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useBulkCreateTemplateSlots() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: QuickBulkCreateSlotsInput) =>
      coachSlotService.bulkCreateTemplateSlots(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useBlockSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BlockSlotInput) => coachSlotService.blockSlot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useSlotDetail(slotId?: string) {
  return useQuery({
    queryKey: ['coach-slots', 'detail', slotId],
    queryFn: () => (slotId ? coachSlotService.getSlotById(slotId) : null),
    enabled: Boolean(slotId),
  })
}

export function useUpdateSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      slotId,
      payload,
    }: {
      slotId: string
      payload: { note?: string; startsAt?: string; endsAt?: string }
    }) => coachSlotService.updateSlot(slotId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useDeleteSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      slotId,
      cancellationReason,
    }: {
      slotId: string
      cancellationReason?: string
    }) => coachSlotService.deleteSlot(slotId, { cancellationReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useBookSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      slotId,
      payload,
    }: {
      slotId: string
      payload: { purchaseId: string; memberId?: string }
    }) => coachSlotService.bookSlot(slotId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

