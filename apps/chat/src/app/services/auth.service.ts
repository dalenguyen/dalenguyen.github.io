import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { from, Observable, of } from 'rxjs'
import { Alert, User } from '../classes'
import { AlertService } from './alert.service'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore'
import { switchMap } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser$: Observable<User | null | undefined>

  constructor(
    private router: Router,
    private alertService: AlertService,
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    // TODO: fetch the user from Firebase
    this.currentUser$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          console.log(user)
          console.log(`users/${user.uid}`)

          return this.db.doc<User>(`users/${user.uid}`).valueChanges()
        }
        return of(null)
      }),
    )
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
              id: result.user?.uid,
              email: result.user?.email,
              firstName,
              lastName,
              photoUrl:
                'https://firebasestorage.googleapis.com/v0/b/dn-demo-chat.appspot.com/o/default-profile-pic.jpg?alt=media&token=6146f6e4-f65c-4af8-8c7c-2c76d7444b43',
            }
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
    // TODO call firebase logout function
    this.router.navigate(['/login'])
    this.alertService.alerts.next(new Alert('You have been signed out.'))
  }
}
