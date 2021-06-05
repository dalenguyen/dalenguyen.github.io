import { Component, OnDestroy, OnInit } from '@angular/core'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore'
import { AngularFireStorage } from '@angular/fire/storage'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { Alert, User } from '../../classes'
import { AlertType } from '../../enums'
import { Location } from '@angular/common'
import { finalize, switchMap } from 'rxjs/operators'
import { AlertService, AuthService, LoadingService } from '../../core/services'

@Component({
  selector: 'dalenguyen-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null | undefined = null
  userId = ''
  uploadPercent = 0
  downloadUrl = ''

  protected subscriptions$: Subscription[] = []

  constructor(
    private auth: AuthService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private fs: AngularFireStorage,
    private db: AngularFirestore,
    private location: Location,
    private alertService: AlertService,
  ) {
    this.loadingService.isLoading.next(true)
  }

  ngOnInit(): void {
    this.subscriptions$.push(
      this.auth.currentUser$.subscribe((user) => {
        this.currentUser = user
        this.loadingService.isLoading.next(false)
      }),
    )

    this.subscriptions$.push(
      this.route.paramMap.subscribe((params) => {
        this.userId = params.get('userId') as string
      }),
    )
  }

  uploadFile(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0]
    const filePath = `${file?.name}_${this.currentUser?.id}`
    const fileRef = this.fs.ref(filePath)
    const task = this.fs.upload(filePath, file)

    // observe the percentage changes
    this.subscriptions$.push(
      task.percentageChanges().subscribe((percentage) => {
        console.log({ percentage })

        if (percentage && percentage < 100) {
          this.loadingService.isLoading.next(true)
        } else {
          this.loadingService.isLoading.next(false)
        }
        this.uploadPercent = percentage as number
      }),
    )

    // get notified when the download URL is available
    this.subscriptions$.push(
      task
        .snapshotChanges()
        .pipe(
          finalize(() => fileRef.getDownloadURL()),
          switchMap((url) => {
            return fileRef.getDownloadURL()
          }),
        )
        .subscribe((url) => {
          console.error({ url })
          this.downloadUrl = url
        }),
    )
  }

  save(): void {
    const photo = this.downloadUrl ?? this.currentUser?.photoUrl
    const user = Object.assign({}, this.currentUser, { photoUrl: photo })
    const userRef: AngularFirestoreDocument<User> = this.db.doc(`users/${this.currentUser?.id}`)
    userRef.set(user, { merge: true })

    this.alertService.alerts.next(new Alert('Your profile was successfully updated', AlertType.Success))
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe())
  }
}
