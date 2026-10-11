// 插件安装时，创建一个右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "linguisnap-analyze",
    title: "✨ 用 LinguiSnap 解构此句",
    contexts: ["selection"] // 只有在划选文字时才显示
  });
});

// 监听右键菜单的点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "linguisnap-analyze") {
    // 给当前网页发送指令，要求弹出解析面板
    chrome.tabs.sendMessage(tab.id, {
      action: "analyze_sentence",
      text: info.selectionText
    });
  }
});