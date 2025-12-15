# 🎫 JIRA Auto Ticket Tool

這是一個輕量級、免安裝的 JIRA 自動開單工具，專為需要頻繁建立標準化工單的團隊設計。透過高度可自訂的模板系統，大幅減少重複輸入的時間。

## ✨ 主要功能

- **🚀 快速開單**：選擇模板 → 填寫變數 → 一鍵送出。
- **📋 多專案支援**：支援不同 JIRA Project (如 MCC, TC, AC 等) 的設定與欄位。
- **🛠️ 高度客製化欄位**：
  - 支援文字框、下拉選單、日期時間選擇器。
  - 欄位可依據模板動態顯示或隱藏。
- **💾 個人常用模板 (Presets)**：
  - 使用者可將填好的內容存為「常用模板」。
  - 下次開單直接載入，只需修改少量內容。
- **📦 免安裝與可攜性**：
  - 支援打包為單一 `exe` 執行檔。
  - 設定檔與程式分離，保護個人帳號密碼安全。

---

## 📖 使用指南 (給一般使用者)

### 1. 初次設定
1. 解壓縮拿到的工具包 (通常為 `JiraAutoTool` 資料夾)。
2. 執行資料夾內的 `JiraAutoTool.exe`。
3. 程式會自動開啟瀏覽器介面。
4. 點選 **「⚙️ 設定」** 分頁，輸入您的 JIRA 資訊：
   - **URL**: 公司的 JIRA 網址
   - **Username**: 您的帳號
   - **Password**: 您的密碼 (工具僅將密碼儲存在您本地電腦，不會上傳)

### 2. 建立工單 (Issue)
1. 在 **「📝 建立 Issue」** 分頁，選擇一個適合的 **「系統標準模板」**。
2. 填寫必要欄位 (如標題、描述、自訂參數)。
3. 點擊 **「✅ 立即開單」**。

### 3. 建立我的常用模板
如果您發現自己常填寫相同的 Fab 或 Assignee：
1. 先填好所有欄位。
2. 點擊右下角的 **「💾 另存為我的常用模板」**。
3. 取個名字 (例如: *"Fab12 週報"* )。
4. 以後在畫面最上方就能直接點選這個模板！

---

## ⚙️ 管理員設定 (給維護者)

若您需要分發此工具給團隊，請修改 `ticket_templates/templates.json` 與 `config.json`。

### 1. 修改設定檔 (config.json)
定義支援的 Project 及其特有欄位：

```json
{
  "jira_url": "https://jira.your-company.com",
  "projects": [
    {
      "key": "MCC",
      "name": "Change Center",
      "default_issuetype": "Change",
      "custom_fields": {
        "Fab": { "label": "Fab", "type": "text", "required": true },
        "StartTime": { "label": "Start Time", "type": "datetime", "required": true }
      }
    }
  ]
}
```

### 2. 修改模板 (templates.json)
定義模板的預設值與可見欄位 (`visible_fields`)：

```json
{
  "id": "template_1",
  "project_key": "MCC",
  "name": "參數調整",
  "visible_fields": ["summary", "description", "priority", "custom_fields"],
  "default_values": {
    "summary": "【參數調整】",
    "custom_fields": { "Fab": "12A" }
  }
}
```

---

## 🛠️ 開發與打包指南

### 安裝依賴
```bash
pip install -r requirements.txt
```

### 本地執行
```bash
python app.py
```

### 打包發布 (產生 EXE)
我們提供了一鍵打包腳本，只需執行：
```bash
build_exe.bat
```
完成後，將 `dist/JiraAutoTool` 資料夾壓縮即為發布檔。

---

## 📝 注意事項
- 本工具僅透過標準 JIRA REST API 進行通訊。
- 密碼以明文儲存於本地 `config.json`，請勿分享此檔案給他人。
- `user_presets` 資料夾存放使用者的個人模板，建議定期備份。
