import { inWindow, monthDay, resolveSeason, SeasonWindow } from '../../../../libs/portfolio/shell/ui/src/lib/season/season.data'

/** Local-time date, so it matches what `monthDay` reads. */
const on = (month: number, day: number) => new Date(2026, month - 1, day, 12, 0, 0)

describe('monthDay', () => {
  it('zero-pads both parts', () => {
    expect(monthDay(on(1, 5))).toBe('01-05')
    expect(monthDay(on(10, 31))).toBe('10-31')
  })
})

describe('resolveSeason', () => {
  it('returns null well outside every window', () => {
    expect(resolveSeason(on(9, 16))).toBeNull()
    expect(resolveSeason(on(6, 1))).toBeNull()
  })

  it('matches inside the halloween window', () => {
    expect(resolveSeason(on(10, 28))).toBe('halloween')
  })

  it('covers the whole of October, boundary days included', () => {
    expect(resolveSeason(on(10, 1))).toBe('halloween')
    expect(resolveSeason(on(10, 31))).toBe('halloween')
  })

  it('excludes the days just outside the boundaries', () => {
    expect(resolveSeason(on(9, 30))).toBeNull()
    expect(resolveSeason(on(11, 1))).toBeNull()
  })
})

describe('inWindow — year-wrapping', () => {
  const newyear: SeasonWindow = {
    id: 'newyear',
    label: 'New Year',
    icon: '🎆',
    from: '12-31',
    to: '01-02',
    themeColor: '#000',
  }

  it('matches on both sides of the year boundary', () => {
    expect(inWindow('12-31', newyear)).toBe(true)
    expect(inWindow('01-01', newyear)).toBe(true)
    expect(inWindow('01-02', newyear)).toBe(true)
  })

  it('does not match outside it', () => {
    expect(inWindow('12-30', newyear)).toBe(false)
    expect(inWindow('01-03', newyear)).toBe(false)
    expect(inWindow('07-04', newyear)).toBe(false)
  })
})
