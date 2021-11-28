/// <reference types="chrome"/>

chrome.runtime.onInstalled.addListener(() => {
  chrome.webNavigation?.onCompleted.addListener(
    () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
        console.log(`Change background to ${id}`)
        if (id != null) {
          chrome.pageAction.show(id)
        }
      })
    },
    // { url: [{ urlMatches: 'google.com' }] },
  )
})
