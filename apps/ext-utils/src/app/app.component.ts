import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { Observable } from 'rxjs'

interface CatFact {
  status: { verified: null; sentCount: number }
  _id: string
  type: 'cat'
  deleted: false
  user: string
  text: string
  createdAt: string
  updatedAt: string
  __v: number
}

@Component({
  selector: 'dalenguyen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  randomFact$ = this.http.get('https://cat-fact.herokuapp.com/facts/random') as Observable<CatFact>

  originalText = 'Hello world'

  constructor(private http: HttpClient) {
    chrome.storage?.sync?.get('originalText', (storage) => {
      console.log({ storage })
      this.originalText = storage.originalText
      // alert(this.originalText)
    })
  }

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

  async test() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab.id != null) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          console.log(document.getSelection()?.toString())
          alert(document.getSelection()?.toString())
        },
      })
    }
  }
}
