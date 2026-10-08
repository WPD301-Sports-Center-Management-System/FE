import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachSlotService } from '../services/coach-slot-service'
import { coachSlotKeys } from '../constants/coach-slot.constants'
import type {
  CreateSlotInput,
  BulkCreateSlotInput,
  BlockSlotInput,
  QuickBulkCreateSlotsInput,
} from '../types/coach-slot-types'

export function useCoachSlots(params: { coachId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: coachSlotKeys.list(params),
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

export function useUnblockSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => coachSlotService.unblockSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

export function useDeleteSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => coachSlotService.deleteSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachSlotKeys.all })
    },
  })
}

