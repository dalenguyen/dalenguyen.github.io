import { Component, OnInit } from '@angular/core';
import { NavService } from '../../shared/services/nav.service';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
  constructor(public navService: NavService) {}

  ngOnInit() {}
}
