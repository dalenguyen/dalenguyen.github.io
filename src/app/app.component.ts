import {MediaMatcher} from '@angular/cdk/layout';
import { Component, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';

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

  constructor(cdf: ChangeDetectorRef, media: MediaMatcher, matIconRegistry: MatIconRegistry) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => cdf.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // Add custom material icons
    matIconRegistry.registerFontClassAlias('fa');
    matIconRegistry.registerFontClassAlias('fab');
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  closeSideNav() {
    console.log('closing', this.mobileQuery.matches);
    if (this.mobileQuery.matches) { // mobile
      console.log('close on mobile');
      this.snav.close();
    }
  }
}
