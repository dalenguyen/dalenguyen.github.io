import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { Observable } from 'rxjs'
import { Alert } from '../classes'
import { AlertType } from '../enums'
import { map, tap, take } from 'rxjs/operators'
import { AlertService, AuthService } from '../core/services'

@Injectable({
  providedIn: 'root',
})
export class AuthGuard  {
  constructor(private auth: AuthService, private router: Router, private alertService: AlertService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.currentUser$.pipe(
      take(1),
      map((currentUser) => !!currentUser),
      tap((loggedIn) => {
        console.log({ loggedIn })

        if (!loggedIn) {
          this.alertService.alerts.next(new Alert('You must login to access this page.', AlertType.Danger))
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
        }
      }),
    )
  }
}
