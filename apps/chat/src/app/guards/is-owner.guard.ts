import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { Observable } from 'rxjs'
import { map, take, tap } from 'rxjs/operators'
import { Alert } from '../classes'
import { AlertType } from '../enums'
import { AlertService, AuthService } from '../services'

@Injectable({
  providedIn: 'root',
})
export class IsOwnerGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router, private alertService: AlertService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.currentUser$.pipe(
      take(1),
      map((currentUser) => !!currentUser && currentUser.id === route.params.userId),
      tap((isOwner) => {
        if (!isOwner) {
          this.alertService.alerts.next(new Alert('You can only edit your profile.', AlertType.Danger))
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
        }
      }),
    )
  }
}
