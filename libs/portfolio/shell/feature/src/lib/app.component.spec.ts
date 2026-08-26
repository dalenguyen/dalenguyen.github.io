import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create the app', () => {
    expect(component).toBeTruthy()
  })

  it('adds an external Shop nav item pointing at rubyrosebloom.com', () => {
    const shopItem = component.navItems.find((item) => item.id === 'shop')

    expect(shopItem).toBeTruthy()
    expect(shopItem?.external).toBe(true)
    expect(shopItem?.href).toBe('https://rubyrosebloom.com/')
  })

  it('renders the Shop link in the desktop nav as a new-tab external link', () => {
    const shopLink = fixture.nativeElement.querySelector('#shop-link')!

    expect(shopLink).toBeTruthy()
    expect(shopLink.getAttribute('href')).toBe('https://rubyrosebloom.com/')
    expect(shopLink.getAttribute('target')).toBe('_blank')
    expect(shopLink.getAttribute('rel')).toBe('noopener noreferrer')
    expect(shopLink.textContent).toContain('Shop')
  })

  it('renders the Shop link in the mobile menu as a new-tab external link', () => {
    component.toggleMobileMenu()
    fixture.detectChanges()

    const shopLink = fixture.nativeElement.querySelector('#shop-mobile-link')!

    expect(shopLink).toBeTruthy()
    expect(shopLink.getAttribute('href')).toBe('https://rubyrosebloom.com/')
    expect(shopLink.getAttribute('target')).toBe('_blank')
    expect(shopLink.getAttribute('rel')).toBe('noopener noreferrer')
    expect(shopLink.textContent).toContain('Shop')
  })
})
