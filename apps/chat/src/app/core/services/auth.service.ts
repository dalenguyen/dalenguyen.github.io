import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { from, Observable, of } from 'rxjs'
import { AlertService } from './alert.service'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { catchError, exhaustMap, mergeMap, switchMap } from 'rxjs/operators'
import { Alert, User } from '../../classes'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser$: Observable<User | null | undefined>
  currentUserSnapshot: User | null | undefined

  constructor(
    private router: Router,
    private alertService: AlertService,
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    // this.currentUser$ = this.afAuth.user.pipe(
    //   switchMap((user) => {
    //     if (user) {
    //       console.log(user)
    //       console.log(`users/${user.uid}`)
    //       // force token to be refresh
    //       user.getIdToken(true)
    //       return this.db.doc<User>(`users/${user.uid}`).valueChanges()
    //     }
    //     return of(null)
    //   }),
    //   // mergeMap((u) => (u ? this.db.doc<User>(`users/${u.uid}`).valueChanges() : of(null))),
    // )

    this.currentUser$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          // force token to be refresh
          user.getIdToken(true)
          return this.db.doc<User>(`users/${user.uid}`).valueChanges()
        } else {
          return of(null)
        }
      }),
    )

    // firebase.auth.onAuthStateChanged((user) => {
    //   console.log(user)
    // })

    this.setCurrentUserSnapshot()
  }

  signUp(firstName: string, lastName: string, email: string, password: string): Observable<boolean> {
    // TODO call firebase signup function
    return from(
      this.afAuth
        .createUserWithEmailAndPassword(email, password)
        .then((result) => {
          console.log(result)
          console.log(result.user?.uid)

          if (result?.user) {
            const userRef: AngularFirestoreDocument<User> = this.db.doc(`users/${result.user.uid}`)
            const updatedUser = {
              id: result.user.uid,
              email: result.user.email as string,
              firstName,
              lastName,
              photoUrl:
                'https://firebasestorage.googleapis.com/v0/b/dn-demo-chat.appspot.com/o/default-profile-pic.jpg?alt=media&token=6146f6e4-f65c-4af8-8c7c-2c76d7444b43',
              quote: 'Life is a box of  chocolates',
              bio: 'Bio is under construction',
            } as User
            userRef.set(updatedUser, { merge: true })
            return true
          }
          return false
        })
        .catch((err) => false),
    )
  }

  login(email: string, password: string): Observable<boolean> {
    return from(
      this.afAuth
        .signInWithEmailAndPassword(email, password)
        .then((result) => true)
        .catch((err) => false),
    )
  }

  logOut(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login'])
      this.alertService.alerts.next(new Alert('You have been signed out.'))
    })
  }

  setCurrentUserSnapshot() {
    this.currentUser$.subscribe((user) => (this.currentUserSnapshot = user))
  }
}
