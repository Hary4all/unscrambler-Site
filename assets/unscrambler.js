(function () {
  if (window.__wordfindlabSharedLoaded) return;
  window.__wordfindlabSharedLoaded = true;
  var GTM_ID = 'GTM-T55GC2PM';
  if (typeof window.trackWFL !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.trackWFL = function (eventName, data = {}) {
      window.dataLayer.push({
        event: eventName,
        page_path: window.location.pathname,
        page_title: document.title || '',
        ...data,
      });
    };
  }
  window.WFLMeasurement = window.WFLMeasurement || {};
  window.WFLMeasurement.track = window.trackWFL;
  function hasScript(fragment) {
    return Array.from(document.scripts || []).some(function (script) {
      return (script.src || '').indexOf(fragment) !== -1;
    });
  }
  if (!hasScript('googletagmanager.com/gtm.js?id=' + GTM_ID)) {
    window.dataLayer = window.dataLayer || [];
    if (!window.__wflGtmBootstrapped) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      window.__wflGtmBootstrapped = true;
    }
    var gtm = document.createElement('script');
    gtm.async = true;
    gtm.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(gtm);
    if (!document.querySelector('noscript[data-wfl-gtm="' + GTM_ID + '"]')) {
      var noscript = document.createElement('noscript');
      noscript.setAttribute('data-wfl-gtm', GTM_ID);
      noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID + '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
      if (document.body) {
        document.body.insertBefore(noscript, document.body.firstChild);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          if (document.body && !document.querySelector('noscript[data-wfl-gtm="' + GTM_ID + '"]')) {
            document.body.insertBefore(noscript, document.body.firstChild);
          }
        }, { once: true });
      }
    }
  }
  var script = document.createElement('script');
  script.src = '/assets/wordfindlab.js?v=20260601';
  script.defer = true;
  document.head.appendChild(script);
})();
