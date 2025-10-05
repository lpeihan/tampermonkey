// ==UserScript==
// @name         网页取色器（Command+Shift+X 触发，仅HEX）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  使用快捷键 Command+Shift+X 取色，自动复制 HEX（基于 EyeDropper API）
// @author       lipeihan
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // === 样式：提示框 ===
  GM_addStyle(`
    .tm-toast {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%) translateY(20px);
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      opacity: 0;
      transition: .2s ease;
      z-index: 2147483647;
    }
    .tm-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `);

  // === 提示框函数 ===
  function showToast(msg, timeout = 2000) {
    const t = document.createElement("div");
    t.className = "tm-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => t.classList.remove("show"), timeout);
    setTimeout(() => t.remove(), timeout + 300);
  }

  // === 取色逻辑 ===
  async function pickColor() {
    if (!window.EyeDropper) {
      showToast("❌ 当前浏览器不支持 EyeDropper API");
      return;
    }
    try {
      const eye = new EyeDropper();
      const result = await eye.open();
      const hex = result.sRGBHex.toUpperCase();
      await navigator.clipboard.writeText(hex);
      showToast(`✅ 已复制：${hex}`);
    } catch {
      showToast("已取消取色");
    }
  }

  window.addEventListener("keydown", (e) => {
    // Mac 上是 metaKey，Windows 上是 ctrlKey
    if (e.metaKey && e.shiftKey && e.code === "KeyX") {
      e.preventDefault();
      pickColor();
    }
  });
})();
