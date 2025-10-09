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
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (this._url.includes("")) {
          // TODO
        }

        body = JSON.stringify(parsed);
      } catch (e) {}
    }

    this.addEventListener("load", function () {
      try {
        let response = this.responseText;
        const json = JSON.parse(response);

        if (this._url.includes("")) {
          // TODO
        }

        response = JSON.stringify(json);
        Object.defineProperty(this, "responseText", { value: response });
      } catch (e) {}
    });

    return origSend.call(this, body);
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [url, options] = args;

    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        if (url.includes("")) {
          // TODO
        }

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
        if (url.includes("")) {
          // TODO
        }

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
