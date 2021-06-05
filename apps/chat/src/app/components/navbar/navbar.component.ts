import { Component, OnInit } from '@angular/core'
import { AuthService } from '../../core/services'

@Component({
  selector: 'dalenguyen-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  constructor(public auth: AuthService) {}

  ngOnInit(): void {}
}
