var tabHash = {}; // store sessions.getTabValue

function setActiveTab(tabId) {
  return browser.tabs.query({ currentWindow: true }).then((tabs) => {
    for (let tab of tabs) {
      if (tab.id == tabId) {
        browser.tabs.update(tabId, { active: true });
      }
    }
  });
}

function sortUpdate(e) {
  e.target.classList.remove('new-group');
}

function sortStart(e) {
  if (e.detail.startparent.children.length === 1) {
    e.detail.startparent.classList.add('new-group');
  }
}

function getTabContainerEl(el) {
  if (el.classList.contains('favicon') ||
      el.classList.contains('caption') ||
      el.classList.contains('close-button') ||
      el.classList.contains('screenshot')) {
        return el.parentNode;
  }
  if (el.classList.contains('tab')) {
    return el;
  }
}

function buildTabEl(tab) {
  let tabEl = document.createElement('a');
  tabEl.setAttribute('href', tab.id);
  tabEl.id = `tab-${tab.id}`;
  tabEl.draggable = true;
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
    let tabsList = document.getElementsByClassName('tab-group')[0];
    let currentTabs = document.createDocumentFragment();

    for (let tab of tabs) {
      // I don't know why I'm getting non-existent/duplicate tabs
      if (typeof tab === 'undefined' || tabHash[tab.id]) { continue; }
      tabHash[tab.id] = Object.assign(tabs[tab.id] || {}, tab);
      let tabEl = buildTabEl(tab);
      currentTabs.appendChild(tabEl);
    }
    tabsList.appendChild(currentTabs);
    browser.runtime.getBackgroundPage()
      .then((bgPage) => bgPage.currentTab())
      .then((tab) => {
        console.log(tab);
        const activeTabEl = document.getElementById(`tab-${tab.id}`);
        activeTabEl.classList.add('active-tab');
      });

    for (let tab of tabs) {
      if (typeof tab === 'undefined') { continue; }
      browser.tabs.captureTab(tab.id).then((image) => {
        tabHash[tab.id].image = image;
        let tabEl = document.getElementById(`screen-id-${tab.id}`)
        tabEl.style.backgroundImage = `url(${tabHash[tab.id].image})`;
      });
    }
  });

  sortable('.tab-group', {
    placeholderClass: 'tab-drop',
    acceptFrom: '.tab-group'
  });
  sortable('.tab-group')[0].addEventListener('sortupdate', sortUpdate);
  sortable('.tab-group')[1].addEventListener('sortupdate', sortUpdate);
  sortable('.tab-group')[0].addEventListener('sortstart', sortStart);
  sortable('.tab-group')[1].addEventListener('sortstart', sortStart);

  document.addEventListener("click", (e) => {
    e.preventDefault();

    const tabEl = getTabContainerEl(e.target);
    if (tabEl) {
      let tabId = +tabEl.getAttribute('href');

      if (e.target.classList.contains('close-button')) {
        browser.tabs.remove(tabId);
        tabEl.parentNode.removeChild(tabEl);
        delete tabHash[tabId];
      } else {
        setActiveTab(tabId).then(() => window.close());
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", listTabs);