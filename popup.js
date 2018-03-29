let bg;

function tabsInGroup(groupId) {
  let tabList = [];
  for (let [tabId, metadata] of Object.entries(bg.tabHash)) {
    if (metadata.groupId === groupId) {
      tabList.push(tabId);
    }
  }
  return tabList;
}

function activateTabGroup(groupId) {
  const tabList = tabsInGroup(groupId);
  return browser.tabs.show(tabsInGroup);
}

function moveTabToGroup(tabId, groupId) {
  bg.updateTabHash(tabId, { group: groupId });
  // if (groupId !== activeTabGroupId) {
  //   browser.tabs.hide(tabid);
  // }
}

function setActiveTab(tabId) {
  // if tab's group group isn't active, change active group
  return browser.tabs.query({ currentWindow: true }).then((tabs) => {
    for (let tab of tabs) {
      // if active group changed,
      //    if tabHash[tab.id].group !== activeTabGroup, add to hide list
      //    else, add to show list
      if (tab.id == tabId) {
        browser.tabs.update(tabId, { active: true });
      }
    }
    // if active group changed...
    //    browser.tabs.hide(hiddenTabs);
    //    browser.tabs.show(visibleTabs);
});
}

function closeTab(tabId, tabEl) {
  browser.tabs.remove(tabId);
  tabEl.parentNode.removeChild(tabEl);
  delete bg.tabHash[tabId];
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
  if (bg.tabHash[tab.id] && bg.tabHash[tab.id].image) {
    screenEl.style.backgroundImage = `url(${bg.tabHash[tab.id].image})`;
  }

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
  return browser.tabs.query({ currentWindow: true }).then((tabs) => {
    let tabsList = document.getElementsByClassName('tab-group')[0];
    let currentTabs = document.createDocumentFragment();

    for (let tab of tabs) {
      // I don't know why I'm getting non-existent/duplicate tabs
      if (typeof tab === 'undefined' || bg.tabHash[tab.id]) { continue; }
      let tabEl = buildTabEl(tab);
      currentTabs.appendChild(tabEl);
    }
    tabsList.appendChild(currentTabs);
      bg.currentTab().then((tab) => {
        console.log(tab);
        const activeTabEl = document.getElementById(`tab-${tab.id}`);
        activeTabEl.classList.add('active-tab');
      });

    for (let tab of tabs) {
      if (typeof tab === 'undefined') { continue; }
      browser.tabs.captureTab(tab.id).then((image) => {
        bg.updateTabHash(tab.id, { image });
        let tabEl = document.getElementById(`screen-id-${tab.id}`)
        tabEl.style.backgroundImage = `url(${bg.tabHash[tab.id].image})`;
      });
    }
    console.log(bg.tabHash);
  });
}

function setupEvents() {
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
        closeTab(tabId, tabEl);
      } else {
        setActiveTab(tabId).then(() => window.close());
      }
    }
  });
}

let bgPagePromise = browser.runtime.getBackgroundPage();

function init() {
  bgPagePromise.then((bgPage) => {
    bg = bgPage;
    listTabs().then(setupEvents)
  });
}

document.addEventListener("DOMContentLoaded", init);