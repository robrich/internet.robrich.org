// 301? or cert error? assume captive portal
// fetch api for
// - cancel
// - don't redirect

// cert error
// - see https://badssl.com/

// css animate back to unknown after 3 seconds

// listen to online/offline events and update automatically
// button to check for reals
/*
- online
- offline (navigator)
- timeout
- redirect
*/

// PWA that doesn't cache the online check page but does cache everything else

/*
function isOnline()  {
  new Promise((resolve, reject) => {
    const wait = 1000; // ms

    if (!navigator.onLine) {
      return resolve(false);
    }
    let done = false;
    let timeout = setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      resolve('timeout');
    }, wait);

    let xhr = new XMLHttpRequest();
    xhr.open('HEAD', `/check.png?_=${Math.round(Math.random() * 10000)}`, true);
    xhr.addEventListener('readystatechange', processRequest, false);
    function processRequest(e) {
      if (xhr.readyState === 4) {
        clearTimeout(timeout);
        if (done) {
          return;
        }
        done = true;
        let online = (xhr.status >= 200 && xhr.status < 400);
        resolve(online? 'online' : 'offline');
      }
    }
    xhr.send();
  )
}
*/

(function (window) {

  if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('/sw.js', {scope: './'});
  }

  const checkDiv = document.getElementById('check');
  const navigatorDiv = document.getElementById('navigator');
  const checkGroupDiv = document.getElementById('checkGroup');
  const navigatorGroupDiv = document.getElementById('navigatorGroup');
  const checkBtn = document.getElementById('checkBtn');
  window.addEventListener('online',  updateNavigator);
  window.addEventListener('offline', updateNavigator);
  checkBtn.addEventListener('click', checkFn);
  checkFn();

  function checkFn(e) {
    if (e) {
      e.preventDefault();
    }
    updateNavigator();
    getOnlineStatus().then(setOnlineStatus);
  }

  function updateNavigator() {
    let status = navigator.onLine ? 'online' : 'offline';
    navigatorDiv.innerText = status;
    navigatorGroupDiv.className = status;
  }

  function setOnlineStatus(status) {
    checkDiv.innerText = status;
    checkGroupDiv.className = status.replace(' ', '-');
  }

  function getOnlineStatus() {
    // TODO: do it anyway?
    if (!navigator.onLine) {
      return Promise.resolve('offline');
    }
    // /check
    // /check.json
    // 'https://self-signed.badssl.com/'
    return onlineChecker('/check.json')
    .then(r => {
      // TODO: check other r. stuff?
      if (r.redirected) {
        return 'captive portal';
      } else {
        return 'online';
      }
    })
    .catch(err => {
      if (err && err.name === 'AbortError') {
        return 'timeout';
      } else {
        // FRAGILE: cert fail is just: {name:'TypeError',message:'Failed to fetch'}
        // same as timeout or offline
        return 'connection fail';
      }
    });
  }

  function onlineChecker(url) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000);
    return fetch(url, {
      method: 'GET',
      cache: 'no-cache',
      signal
      //don't know if it redirected or failed to connect: redirect: 'manual'
    });
  }

}(window));
