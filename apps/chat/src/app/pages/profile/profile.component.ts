import { Component, OnDestroy, OnInit } from '@angular/core'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { User } from '../../classes'
import { AuthService, LoadingService } from '../../core/services'

@Component({
  selector: 'dalenguyen-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser$ = this.auth.currentUser$
  user: User | undefined

  private subscriptions$: Subscription[] = []

  constructor(
    private auth: AuthService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private db: AngularFirestore,
  ) {
    // this.loadingService.isLoading.next(true)
  }

  ngOnInit(): void {
    this.subscriptions$.push(
      this.route.paramMap.subscribe((params) => {
        const userId = params.get('userId')
        const userRef: AngularFirestoreDocument<User> = this.db.doc(`users/${userId}`)
        userRef.valueChanges().subscribe((user) => (this.user = user))
      }),
    )
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe())
  }
}
