# 🎫 JIRA 自動開單工具

一個簡單易用的 JIRA 自動開單工具,讓你快速建立和管理 JIRA Issues。

## ✨ 功能特色

- 🚀 **快速開單**: 使用預設模板快速建立 JIRA Issues
- 📋 **模板管理**: 自訂和管理多個開單模板
- 🎨 **友善介面**: 現代化深色主題設計
- 💾 **本地儲存**: 所有設定和模板都儲存在本地
- 🔒 **安全**: 在本地運行,不需要外部伺服器
- 📦 **可攜帶**: 整個資料夾可以直接複製到其他電腦使用

## 📋 系統需求

- Python 3.7 或更高版本
- 網路連線 (用於連接 JIRA)

## 🚀 安裝步驟

### 1. 安裝 Python 依賴套件

```bash
pip install -r requirements.txt
```

### 2. 設定 JIRA 連線

首次使用時,請在「設定」頁面填寫:
- JIRA URL (例如: https://your-company.atlassian.net)
- 使用者名稱
- 密碼
- 專案 Key

### 3. 啟動應用程式

```bash
python app.py
```

### 4. 開啟瀏覽器

在瀏覽器中開啟: http://127.0.0.1:5000

## 📖 使用說明

### 建立 Issue

1. 在「建立 Issue」頁面選擇一個模板
2. 模板內容會自動填入表單
3. 根據需要調整內容
4. 點擊「建立 Issue」按鈕

### 管理模板

1. 前往「模板管理」頁面
2. 點擊「新增模板」建立新模板
3. 填寫模板名稱、描述和預設欄位值
4. 儲存後即可在建立 Issue 時使用

### 編輯/刪除模板

- 點擊模板卡片上的「編輯」按鈕可修改模板
- 點擊「刪除」按鈕可移除模板

## 📁 專案結構

```
JIRA自動開單/
├── app.py                  # Flask 後端主程式
├── config.json             # JIRA 連線設定
├── requirements.txt        # Python 依賴套件
├── README.md              # 說明文件
├── templates/             # HTML 模板
│   └── index.html         # 主介面
├── static/               
│   ├── css/
│   │   └── style.css      # 樣式表
│   └── js/
│       └── main.js        # 前端邏輯
└── ticket_templates/      # 開單模板
    └── templates.json     # 模板配置
```

## 🔧 設定檔說明

### config.json

儲存 JIRA 連線資訊:

```json
{
  "jira_url": "https://your-jira-instance.com",
  "username": "your.username",
  "password": "your.password",
  "project_key": "PROJECT"
}
```

### templates.json

儲存開單模板:

```json
{
  "templates": [
    {
      "id": "template_1",
      "name": "Bug 回報模板",
      "description": "用於回報系統 Bug",
      "fields": {
        "summary": "【Bug】",
        "description": "## 問題描述\n...",
        "issuetype": "Bug",
        "priority": "Medium"
      }
    }
  ]
}
```

## 💡 使用技巧

1. **建立多個模板**: 為不同類型的工作建立專用模板,例如 Bug 回報、功能需求、技術任務等
2. **使用 Markdown**: 描述欄位支援 Markdown 格式,可以使用標題、列表、程式碼區塊等
3. **定期備份**: 定期備份 `config.json` 和 `templates.json` 檔案
4. **攜帶使用**: 將整個資料夾複製到 USB 隨身碟,即可在不同電腦上使用

## 🔐 安全性建議

1. **保護設定檔**: `config.json` 包含密碼,請妥善保管
2. **不要上傳到公開位置**: 避免將包含密碼的設定檔上傳到 GitHub 等公開平台
3. **使用 API Token**: 如果 JIRA 支援,建議使用 API Token 代替密碼

## 🐛 常見問題

### Q: 連線測試失敗怎麼辦?

A: 請檢查:
- JIRA URL 是否正確 (不要包含結尾的 `/`)
- 使用者名稱和密碼是否正確
- 網路連線是否正常
- JIRA 是否需要 VPN 連線

### Q: 建立 Issue 失敗?

A: 可能原因:
- 專案 Key 不正確
- 使用者沒有建立 Issue 的權限
- Issue 類型在該專案中不存在
- 必填欄位未填寫

### Q: 如何在公司電腦使用?

A: 
1. 將整個資料夾複製到公司電腦
2. 確認已安裝 Python
3. 執行 `pip install -r requirements.txt`
4. 執行 `python app.py`

## 📝 版本歷史

### v1.0.0 (2025-12-16)
- ✨ 初始版本
- 📝 支援建立 JIRA Issues
- 📋 支援模板管理
- ⚙️ 支援 JIRA 連線設定

## 📄 授權

此專案僅供個人使用。

## 🤝 貢獻

歡迎提出建議和改進意見!

---

Made with ❤️ for TSMC
