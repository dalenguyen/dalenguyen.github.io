import {MediaMatcher} from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MatIconRegistry } from '@angular/material/icon';
import { NavService } from './shared/services/nav.service';
import { Component, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  @ViewChild('snav', {static: false}) snav: MatSidenav;

  mobileQuery: MediaQueryList;
  // tslint:disable-next-line:variable-name
  private _mobileQueryListener: () => void;

  constructor(cdf: ChangeDetectorRef, media: MediaMatcher, matIconRegistry: MatIconRegistry, private navService: NavService) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => cdf.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // Add custom material icons
    matIconRegistry.registerFontClassAlias('fa');
    matIconRegistry.registerFontClassAlias('fab');

    this.navService.target.subscribe(data => {
      setTimeout(() => {
        this.closeSideNav();
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  closeSideNav() {
    if (this.mobileQuery.matches) { // mobile
      this.snav.close();
    }
  }
}
