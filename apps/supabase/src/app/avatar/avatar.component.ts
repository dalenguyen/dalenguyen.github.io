import { Component, EventEmitter, Input, Output } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'dalenguyen-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {
  _avatarUrl: SafeResourceUrl | undefined
  uploading = false

  @Input()
  set avatarUrl(url: string | undefined) {
    if (url) {
      this.downloadImage(url)
    }
  }

  @Output() upload = new EventEmitter<string>()

  constructor(private readonly supabase: SupabaseService, private readonly dom: DomSanitizer) {}

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.downLoadImage(path)
      this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(URL.createObjectURL(data as Blob | MediaSource))
    } catch (error) {
      console.error('Error downloading image: ', (error as Error).message)
    }
  }

  async uploadAvatar(event: Event) {
    try {
      this.uploading = true
      if (!(event?.target as HTMLInputElement)?.files || (event?.target as HTMLInputElement)?.files?.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = (event?.target as HTMLInputElement)?.files?.[0]

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        await this.supabase.uploadAvatar(filePath, file)
        this.upload.emit(filePath)
      }
    } catch (error) {
      alert((error as Error).message)
    } finally {
      this.uploading = false
    }
  }
}
