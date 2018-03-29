window.tabHash = {};
window.activeTabGroupId = 1;

function updateTabHash(id, obj) {
  let tabObj = {};
  for (let [key, value] of Object.entries(obj)) { tabObj[key] = value; }
  window.tabHash[id] = Object.assign(window.tabHash[id] || {}, tabObj);
}

function currentTab() {
  return browser.tabs.query({active: true, windowId: browser.windows.WINDOW_ID_CURRENT})
    .then(tabs => browser.tabs.get(tabs[0].id));
}
