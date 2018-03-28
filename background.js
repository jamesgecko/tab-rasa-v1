function currentTab() {
  return browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => browser.tabs.get(tabs[0].id));
}
