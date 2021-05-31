import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { Alert, User } from '../classes'
import { AlertService } from './alert.service'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser$: Observable<User | null>

  constructor(private router: Router, private alertService: AlertService) {
    // TODO: fetch the user from Firebase
    this.currentUser$ = of(null)
  }

  signUp(firstName: string, lastName: string, email: string, password: string): Observable<boolean> {
    // TODO call firebase signup function
    return of(true)
  }

  login(email: string, password: string): Observable<boolean> {
    // TODO call firebase login function
    return of(true)
  }

  logOut(): void {
    // TODO call firebase logout function
    this.router.navigate(['/login'])
    this.alertService.alerts.next(new Alert('You have been signed out.'))
  }
}
