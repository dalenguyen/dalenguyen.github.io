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

  constructor(private http: HttpClient) {}

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
