var tabHash = {}; // store sessions.getTabValue

function setActiveTab(tabId) {
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    for (let tab of tabs) {
      if (tab.id == tabId) {
        browser.tabs.update(tabId, { active: true });
      }
    }
  });
}

function buildTabEl(tab) {
  let tabEl = document.createElement('span');
  if (tab.favIconUrl) {
    let iconEl = document.createElement('img');
    iconEl.classList.add('favicon');
    iconEl.setAttribute('src', tab.favIconUrl);
    tabEl.appendChild(iconEl);
  }

  let closeEl = document.createElement('div');
  closeEl.classList.add('close-button');
  closeEl.textContent = 'x';

  let screenEl = document.createElement('div');
  screenEl.classList.add('screenshot');
  screenEl.id = `screen-id-${tab.id}`;

  let labelEl = document.createElement('div');
  labelEl.classList.add('caption');
  labelEl.textContent = tab.title || tab.id;

  tabEl.classList.add('tab');
  tabEl.appendChild(closeEl);
  tabEl.appendChild(screenEl);
  tabEl.appendChild(labelEl);
  return tabEl;
}

function listTabs() {
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    let tabsList = document.getElementById('tabs-list');
    let currentTabs = document.createDocumentFragment();

    for (let tab of tabs) {
      if (typeof tab === 'undefined') { continue; }
      console.log(tab);
      tabHash[tab.id] = Object.assign(tabs[tab.id] || {}, tab);
      let tabEl = buildTabEl(tab);
      currentTabs.appendChild(tabEl);
    }
    tabsList.appendChild(currentTabs);

    for (let tab of tabs) {
      if (typeof tab === 'undefined') { continue; }
      browser.tabs.captureTab(tab.id).then((image) => {
        tabHash[tab.id].image = image;
        let tabEl = document.getElementById(`screen-id-${tab.id}`)
        tabEl.style.backgroundImage = `url(${image})`;
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", listTabs);