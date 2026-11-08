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

  it('runs autumn from the equinox until christmas takes over', () => {
    expect(resolveSeason(on(9, 22))).toBe('autumn')
    expect(resolveSeason(on(11, 7))).toBe('autumn')
    expect(resolveSeason(on(12, 17))).toBe('autumn')
  })

  it('lets halloween take over autumn for its week only', () => {
    expect(resolveSeason(on(10, 24))).toBe('autumn')
    expect(resolveSeason(on(10, 25))).toBe('halloween')
    expect(resolveSeason(on(10, 31))).toBe('halloween')
    expect(resolveSeason(on(11, 1))).toBe('autumn')
  })

  it('runs christmas across the autumn/winter boundary', () => {
    expect(resolveSeason(on(12, 18))).toBe('christmas')
    expect(resolveSeason(on(12, 21))).toBe('christmas')
    expect(resolveSeason(on(12, 26))).toBe('christmas')
    expect(resolveSeason(on(12, 27))).toBe('winter')
  })

  it('runs winter across the year end until the spring equinox', () => {
    expect(resolveSeason(on(1, 1))).toBe('winter')
    expect(resolveSeason(on(2, 14))).toBe('winter')
    expect(resolveSeason(on(3, 19))).toBe('winter')
    expect(resolveSeason(on(3, 20))).toBeNull()
  })

  it('excludes the day just before autumn', () => {
    expect(resolveSeason(on(9, 21))).toBeNull()
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
