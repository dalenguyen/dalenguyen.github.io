/// <reference types="chrome"/>
const color = '#3aa757'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchForWord',
    title: 'Search DuckDuckGo for: %s',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'summarizeText',
    title: 'Summarize me: %s',
    contexts: ['selection'],
  })

  chrome.storage.sync.set({ color })
  console.log('Default background color set to %cgreen', `color: ${color}`)
})

const searchForWord = (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
  if (info.menuItemId === 'searchForWord' && info.selectionText) {
    console.log('Word ' + info.selectionText + ' was clicked.')
    chrome.tabs.create({
      url: 'https://duckduckgo.com/?q=' + info.selectionText,
    })
  }

  if (info.menuItemId === 'summarizeText' && info.selectionText) {
    console.log('Word ' + info.selectionText + ' was selected.')
    chrome.storage.sync.set({ originalText: info.selectionText })
  }
}

chrome.contextMenus.onClicked.addListener(searchForWord)
