import { Component, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { Alert } from '../../classes'
import { AlertType } from '../../enums'
import { AlertService } from '../../services'

@Component({
  selector: 'dalenguyen-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  constructor(private fb: FormBuilder, private alertService: AlertService) {}

  ngOnInit(): void {}

  submit() {
    // TODO: call the auth service
    if (this.signupForm.valid) {
      const { firstName, lastName, email, password } = this.signupForm.value

      console.table({ firstName, lastName, email, password })
    } else {
      const failedSignedUpAlert = new Alert('Please enter a valid name, email & password, try again', AlertType.Danger)
      this.alertService.alerts.next(failedSignedUpAlert)
    }
  }
}
