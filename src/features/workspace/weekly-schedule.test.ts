import { describe, expect, it } from 'vitest'
import { copyHoursDay, copyPatternDay, mergeIntervals, paintHours, recommendPatterns, selectSlot } from './weekly-schedule'

describe('Weekly scheduling without fixed weekday groups', () => {
  it('allows arbitrary days and a different clock time for each, respecting the package cadence', () => {
    let v=selectSlot([], {weekday:2,startTime:'07:30'},2)
    v=selectSlot(v,{weekday:7,startTime:'19:00'},2)
    expect(v).toEqual([{weekday:2,startTime:'07:30'},{weekday:7,startTime:'19:00'}])
    expect(selectSlot(v,{weekday:4,startTime:'18:00'},2)).toEqual(v)
    expect(selectSlot(v,{weekday:7,startTime:'20:00'},2).at(-1)?.startTime).toBe('20:00')
  })
  it('copies only to free days and never overwrites a selected day or exceeds the cadence', () => {
    const v=[{weekday:2,startTime:'18:00'},{weekday:3,startTime:'08:00'}]
    const free=[{weekday:3,startTime:'18:00',available:true},{weekday:4,startTime:'18:00',available:false},{weekday:6,startTime:'18:00',available:true},{weekday:7,startTime:'18:00',available:true}]
    expect(copyPatternDay(v,2,[3,4,6,7],free,3)).toEqual([...v,{weekday:6,startTime:'18:00'}])
    expect(v).toHaveLength(2)
  })
  it('finds suggestions when no days share the same clock time', () => {
    const free=[{weekday:2,startTime:'07:00',available:true},{weekday:4,startTime:'18:30',available:true},{weekday:7,startTime:'10:00',available:true},{weekday:1,startTime:'18:00',available:false}]
    const patterns=recommendPatterns(free,3,'evening')
    expect(patterns[0]?.map(s=>s.weekday)).toEqual([2,4,7])
    expect(patterns.every(p=>p.every(s=>free.some(f=>f.available&&f.weekday===s.weekday&&f.startTime===s.startTime)))).toBe(true)
  })
  it('returns no incomplete recommendation when too few days are free', () => {
    expect(recommendPatterns([{weekday:2,startTime:'18:00',available:true}],3)).toEqual([])
  })
  it('unions intervals without changing input or rounding exact times', () => {
    const rows=[{weekday:1,startTime:'08:15',endTime:'10:45'},{weekday:1,startTime:'10:30',endTime:'12:00'}]
    expect(mergeIntervals(rows)).toEqual([{weekday:1,startTime:'08:15',endTime:'12:00'}])
    expect(rows[0]?.endTime).toBe('10:45')
  })
  it('paints and erases a rectangle without losing the rest of the working day', () => {
    const rows=paintHours([],[2,3,4],'08:00','12:00',false)
    const erased=paintHours(rows,[3],'09:00','10:00',true)
    expect(erased.filter(r=>r.weekday===3)).toEqual([{weekday:3,startTime:'08:00',endTime:'09:00'},{weekday:3,startTime:'10:00',endTime:'12:00'}])
    expect(erased.filter(r=>r.weekday!==3)).toHaveLength(2)
  })
  it('replaces only the explicitly selected destination days when copying hours', () => {
    const result=copyHoursDay([{weekday:2,startTime:'08:15',endTime:'12:00'},{weekday:3,startTime:'17:00',endTime:'21:00'},{weekday:7,startTime:'09:00',endTime:'11:00'}],2,[3])
    expect(result).toContainEqual({weekday:3,startTime:'08:15',endTime:'12:00'})
    expect(result).toContainEqual({weekday:7,startTime:'09:00',endTime:'11:00'})
    expect(result.some(r=>r.startTime==='17:00')).toBe(false)
  })
})
