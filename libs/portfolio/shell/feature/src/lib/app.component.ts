import { MediaMatcher } from '@angular/cdk/layout'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ErrorHandler,
  Injectable,
  OnDestroy,
  ViewChild,
} from '@angular/core'
import { MatIconModule, MatIconRegistry } from '@angular/material/icon'
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav'
import { RouterModule } from '@angular/router'
import { EditGithubComponent, FooterComponent, NavComponent, NavService } from '@dalenguyen/portfolio/shell/ui'
import * as Sentry from '@sentry/browser'

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error) {
    Sentry.captureException(error.originalError || error)
    console.error(error)
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-root',
  standalone: true,
  imports: [MatSidenavModule, MatIconModule, RouterModule, FooterComponent, NavComponent, EditGithubComponent],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }],
  template: `
  <div class="main-content" [class.is-mobile]="mobileQuery.matches">
  <mat-sidenav-container class="sidenav-container">
    <mat-sidenav
      #snav
      [opened]="mobileQuery.matches ? false : true"
      [mode]="mobileQuery.matches ? 'over' : 'side'"
      [fixedInViewport]="mobileQuery.matches"
    >
      <dalenguyen-nav/>
    </mat-sidenav>
    <mat-sidenav-content>
      <div class="hamburger bg-slate-500 bg-opacity-75 shadow-xl" (click)="snav.toggle()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path class="text-white" stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </div>
      <main class="h-full">
        <dalenguyen-edit-github />
        <router-outlet />
        <dalenguyen-footer/>
      </main>
    </mat-sidenav-content>
  </mat-sidenav-container>
</div>
`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  @ViewChild('snav') snav: MatSidenav

  mobileQuery: MediaQueryList
  // tslint:disable-next-line:variable-name
  private _mobileQueryListener: () => void

  constructor(
    cdf: ChangeDetectorRef,
    media: MediaMatcher,
    matIconRegistry: MatIconRegistry,
    private navService: NavService,
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)')
    this._mobileQueryListener = () => cdf.detectChanges()
    this.mobileQuery.addListener(this._mobileQueryListener)

    // Add custom material icons
    matIconRegistry.registerFontClassAlias('fa')
    matIconRegistry.registerFontClassAlias('fab')

    // close nav on mobile
    this.navService.target.subscribe((data) => {
      setTimeout(() => {
        this.closeSideNav()
      }, 1000)
    })
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener)
  }

  closeSideNav() {
    if (this.mobileQuery.matches) {
      // mobile
      this.snav.close()
    }
  }
}
