import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'
import { AccountComponent } from './account/account.component'
import { AppComponent } from './app.component'
import { AuthComponent } from './auth/auth.component'
import { SupabaseService } from './supabase.service'

@NgModule({
  declarations: [AppComponent, AuthComponent, AccountComponent],
  imports: [BrowserModule, RouterModule.forRoot([], { initialNavigation: 'enabledBlocking' })],
  providers: [SupabaseService],
  bootstrap: [AppComponent],
})
export class AppModule {}
