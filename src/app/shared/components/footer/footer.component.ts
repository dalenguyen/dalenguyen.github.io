import { Component, OnInit, VERSION } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  currentYear = (new Date()).getFullYear();
  angularVersion = VERSION.major;

  constructor() { }

  ngOnInit() {
  }

}
