import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router'
import { Observable } from 'rxjs'

@Injectable()
export class Guard  {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const page = route.queryParams['page']

    if (!page) {
      return true
    }

    this.router.navigate(['/' + page])
    return false
  }
}
