// ==UserScript==
// @name         Request & Response Interceptor
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Intercept and modify specific fetch/XHR requests and responses
// @author       lipeihan
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const INTERCEPTOR_URLS = [];

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (!INTERCEPTOR_URLS.some((keyword) => this._url.includes(keyword))) {
      return origSend.call(this, body);
    }

    if (body) {
      try {
        const parsed = JSON.parse(body);
        parsed.modifiedByTM = true;
        body = JSON.stringify(parsed);
      } catch (e) {}
    }

    this.addEventListener("load", function () {
      try {
        let response = this.responseText;
        const json = JSON.parse(response);
        // json.modifiedByTM = true;

        response = JSON.stringify(json);
        Object.defineProperty(this, "responseText", { value: response });
      } catch (e) {}
    });

    return origSend.call(this, body);
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [url, options] = args;

    if (!INTERCEPTOR_URLS.some((keyword) => url.includes(keyword))) {
      return originalFetch(url, options);
    }

    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        body.modifiedByTM = true;

        options.body = JSON.stringify(body);
      } catch (e) {}
    }

    const response = await originalFetch(url, options);

    const clone = response.clone();
    try {
      const text = await clone.text();
      let data = text;
      try {
        const json = JSON.parse(text);
        // json.modifiedByTM = true;

        data = JSON.stringify(json);
      } catch (e) {}
      return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (err) {
      return response;
    }
  };
})();
