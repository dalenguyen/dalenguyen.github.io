import { Component } from '@angular/core'

@Component({
  selector: 'dalenguyen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  async changeBackground() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab.id != null) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          chrome.storage.sync.get('color', ({ color }) => {
            document.body.style.backgroundColor = color
          })
        },
      })
    }
  }
}
