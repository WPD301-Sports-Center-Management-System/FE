import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EquipmentPage } from './equipment-page'
import { equipmentService } from '@/features/equipment-maintenance/services/equipment.service'

vi.mock('@/features/equipment-maintenance/services/equipment.service', () => ({
  equipmentService: {
    getEquipment: vi.fn(),
    getGymAreas: vi.fn(),
    createEquipment: vi.fn(),
  },
}))

describe('EquipmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders equipment list and areas from API', async () => {
    vi.mocked(equipmentService.getEquipment).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'eq-1',
          name: 'Ghế đẩy tạ đa năng Adjustable Bench',
          equipmentCode: 'EQ-BENCH-01',
          brand: 'Hammer Strength',
          status: 'OPERATIONAL',
        } as any,
      ],
    } as any)

    vi.mocked(equipmentService.getGymAreas).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'ga-1',
          name: 'Khu vực Tạ tự do Free Weights',
          location: 'Tầng 1',
          isActive: true,
        } as any,
      ],
    } as any)

    render(<EquipmentPage />)

    await waitFor(() => {
      expect(screen.getByText('Quản Lý Thiết Bị & Khu Vực Phòng Gym')).toBeInTheDocument()
      expect(screen.getByText('Ghế đẩy tạ đa năng Adjustable Bench')).toBeInTheDocument()
    })
  })
})
