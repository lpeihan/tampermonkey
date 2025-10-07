// ==UserScript==
// @name         Request & Response Interceptor
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Intercept and modify specific fetch/XHR requests and responses
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // 设置要拦截的 URL 关键词
  const TARGET_KEYWORDS = ["/api/", "/v1/"]; // 可以改成你想要匹配的路径片段

  const shouldIntercept = (url) => {
    return TARGET_KEYWORDS.some((keyword) => url.includes(keyword));
  };

  // --- Intercept fetch ---
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [url, options] = args;

    if (!shouldIntercept(url)) {
      return originalFetch(url, options);
    }

    console.log("[TM] Intercept fetch:", url);

    // 修改请求体
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        body.modifiedByTM = true; // 示例：添加字段
        options.body = JSON.stringify(body);
      } catch (e) {
        // 非 JSON 请求体
      }
    }

    const response = await originalFetch(url, options);

    // 修改响应体
    const clone = response.clone();
    try {
      const text = await clone.text();
      let data = text;
      try {
        const json = JSON.parse(text);
        json.modifiedByTM = true; // 示例：添加字段
        data = JSON.stringify(json);
      } catch (e) {
        // 非 JSON 响应
      }
      return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (err) {
      console.error("Error reading response:", err);
      return response;
    }
  };

  // --- Intercept XMLHttpRequest ---
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (!shouldIntercept(this._url)) {
      return origSend.call(this, body);
    }

    console.log("[TM] Intercept XHR:", this._url);

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
        json.modifiedByTM = true;
        response = JSON.stringify(json);
        Object.defineProperty(this, "responseText", { value: response });
      } catch (e) {}
    });

    return origSend.call(this, body);
  };

  console.log("Tampermonkey conditional interceptor active");
})();
