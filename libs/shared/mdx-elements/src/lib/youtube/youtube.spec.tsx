import { render } from '@testing-library/react'
import Youtube from './youtube'


describe('Youtube', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Youtube title={''} uid={''} />)
    expect(baseElement).toBeTruthy()
  })
})
