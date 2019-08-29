import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy } from '@angular/core';
import { MatGridList } from '@angular/material/grid-list';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { Subscription } from 'rxjs';
import { PortfolioService } from 'src/app/shared/services/portfolio.service';
import { GitProject } from 'src/app/shared/models/git.project';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnDestroy, AfterContentInit, OnInit {

  watcher: Subscription;

  gridByBreakpoint = {
    xl: 3,
    lg: 3,
    md: 2,
    sm: 1,
    xs: 1
  };

  portfolios: GitProject[] = [];

  @ViewChild('grid', {static: false}) grid: MatGridList;

  constructor(private mediaObserver: MediaObserver, private portfolioService: PortfolioService) {
    this.portfolioService.projects.then(projects => this.portfolios = projects);
  }

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
