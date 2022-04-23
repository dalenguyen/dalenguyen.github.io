import { Component } from '@angular/core'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'dalenguyen-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
  loading = false

  constructor(private readonly supabase: SupabaseService) {}

  async handleLogin(input: string) {
    try {
      this.loading = true
      await this.supabase.signIn(input)
      alert('Check your email for the login link!')
    } catch (error) {
      alert((error as any).error_description || (error as Error).message)
    } finally {
      this.loading = false
    }
  }
}
