// TODO: css animate back to unknown after 3 seconds

(function (window) {

  if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('/sw.js', {scope: './'});
  }

  const jokeDiv = document.getElementById('joke');
  const checkDiv = document.getElementById('check');
  const pageDiv = document.getElementById('page');
  const checkBtn = document.getElementById('checkBtn');
  window.addEventListener('online',  checkFn);
  window.addEventListener('offline', checkFn);
  checkBtn.addEventListener('click', checkFn);
  checkFn();

  async function checkFn(e) {
    if (e) {
      e.preventDefault();
    }
    const url = '/check.json';
    let msg = await getOnlineStatus(url);
    if (msg && msg.status === 'online') {
      const joke = await getOnlineStatus('https://icanhazdadjoke.com/slack');
      if (joke && joke.message && joke.message.attachments && joke.message.attachments[0]) {
        joke.joke = joke.message.attachments[0].text;
      }
      msg = joke;
    }
    setOnlineStatus(msg);
  }

  function setOnlineStatus(msg) {
    if (!msg) {
      checkDiv.innerText = 'null';
      return;
    }
    checkDiv.innerText = msg.status;
    jokeDiv.innerText = msg.joke || msg.date;
    pageDiv.className = msg.status.replace(' ', '-');
  }

  async function getOnlineStatus(url) {
    if (!navigator.onLine) {
      return {status:'offline'};
    }
    const d = new Date();
    const dStr = d.getHours()+':'+d.getMinutes().toString().padStart(2, '0')+':'+d.getSeconds().toString().padStart(2, '0');
    let result = {
      status:'crash',
      url,
      date: dStr
    };
    try {
      const r = await onlineChecker(url);
      if (r.redirected) {
        result.status = 'captive portal';
      } else {
        result.status = 'online';
        result.message = await r.json();
      }
      // TODO: check other r. stuff?
    } catch (err) {
      if (!result.status || result.status === 'crash') {
        // don't overwrite with error, we succeeded part of the way
        if (err && err.name === 'AbortError') {
          result.status = 'timeout';
        } else {
          // FRAGILE: cert fail is just: {name:'TypeError',message:'Failed to fetch'}, same as timeout or offline
          result.status = 'connection fail';
        }
      }
    }
    return result;
  }

  function onlineChecker(url) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000);
    return fetch(url, {
      method: 'GET',
      /*headers: new Headers({
        'Content-Type': 'applicaton/json',
        'Accept': 'applicaton/json'
      }),*/
      mode: 'no-cors',
      cache: 'no-cache',
      signal
    });
  }

}(window));
