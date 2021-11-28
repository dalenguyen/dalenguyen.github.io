import { Component } from '@angular/core'

@Component({
  selector: 'dalenguyen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  changeBackground() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id != null) {
        chrome.tabs.executeScript(tabs[0].id, {
          code: 'document.body.style.backgroundColor = "red";',
        })
      }
    })
  }
}
