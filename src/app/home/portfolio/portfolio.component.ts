import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy } from '@angular/core';
import { MatGridList } from '@angular/material/grid-list';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnDestroy, AfterContentInit, OnInit {

  watcher: Subscription;

  gridByBreakpoint = {
    xl: 4,
    lg: 4,
    md: 4,
    sm: 2,
    xs: 1
  };

  @ViewChild('grid', {static: false}) grid: MatGridList;

  constructor(private mediaObserver: MediaObserver) {}

  ngOnInit(): void {
  }

  ngAfterContentInit(): void {
    this.watcher = this.mediaObserver.media$.subscribe((change: MediaChange) => {
      this.grid.cols = this.gridByBreakpoint[change.mqAlias];
    });
  }

  ngOnDestroy(): void {
    this.watcher.unsubscribe();
  }

}
