import {MediaMatcher} from '@angular/cdk/layout';
import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  mobileQuery: MediaQueryList;
  // tslint:disable-next-line:variable-name
  private _mobileQueryListener: () => void;

  constructor(cdf: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => cdf.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}
