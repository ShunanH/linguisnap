// 1. 向当前网页中注入悬浮按钮和结果面板
const btn = document.createElement('div');
btn.id = 'linguisnap-float-btn';
btn.innerHTML = '✨ 开拆';
document.body.appendChild(btn);

const panel = document.createElement('div');
panel.id = 'linguisnap-panel';
panel.innerHTML = `
LinguiSnap
`;
document.body.appendChild(panel);

let currentText = "";

// 2. 监听用户的划词动作
document.addEventListener('mouseup', () => {
const selection = window.getSelection();
const text = selection.toString().trim();

if (text.length > 0) {
currentText = text;
// 获取鼠标选区的位置，把按钮放到选区右下角
const range = selection.getRangeAt(0);
const rect = range.getBoundingClientRect();

btn.style.left = `${rect.right + window.scrollX + 8}px`;
btn.style.top = `${rect.bottom + window.scrollY + 8}px`;
btn.style.display = 'flex';
} else {
btn.style.display = 'none';
}
});

// 3. 点击空白处隐藏面板和按钮
document.addEventListener('mousedown', (e) => {
if (e.target.id !== 'linguisnap-float-btn' && !panel.contains(e.target)) {
btn.style.display = 'none';
panel.style.display = 'none';
}
});

// 4. 点击【悬浮按钮】触发解析
btn.addEventListener('mousedown', (e) => {
e.preventDefault(); // 防止点击时选区消失
showPanel(currentText);
});

// 5. 监听来自【右键菜单】的触发
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
if (request.action === "analyze_sentence") {
showPanel(request.text);
}
});

// 显示结果面板的函数
function showPanel(text) {
btn.style.display = 'none';
panel.style.display = 'block';
const lsText = document.getElementById('ls-text');
lsText.innerHTML = `
目标句子：


"${text}"


*（Demo 演示：未来这里将无缝嵌入你的 Next.js 四行解析卡片组件）*
`;
}