import { Component, OnInit } from '@angular/core'
import { AuthService } from '../../core/services'

@Component({
    selector: 'dalenguyen-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})
export class NavbarComponent implements OnInit {
  constructor(public auth: AuthService) {}

  ngOnInit(): void {}
}
