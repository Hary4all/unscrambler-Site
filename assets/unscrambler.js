(function () {
  if (window.__wordfindlabSharedLoaded) return;
  window.__wordfindlabSharedLoaded = true;
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
  var script = document.createElement('script');
  script.src = '/assets/wordfindlab.js?v=20260521';
  script.defer = true;
  document.head.appendChild(script);
})();
