@echo off
echo ==========================================
echo      JIRA Auto Ticket Tool Builder
echo ==========================================
echo.
echo 1. Installing PyInstaller...
pip install pyinstaller
echo.

echo 2. Cleaning up previous builds...
rmdir /s /q build
rmdir /s /q dist
del /q *.spec

echo.
echo 3. Building EXE...
echo    This may take a minute...
:: --onedir: 產生一個資料夾而非單一檔案 (除錯較易，啟動較快)
:: --icon: 可以指定圖示 (這裡先略過)
:: --name: 指定執行檔名稱
pyinstaller --noconfirm --onedir --console --name "JiraAutoTool" app.py

echo.
echo 4. Copying resources...
:: 複製必要的資料夾到 dist\JiraAutoTool 目錄下
xcopy /E /I /Y templates dist\JiraAutoTool\templates
xcopy /E /I /Y static dist\JiraAutoTool\static
xcopy /E /I /Y ticket_templates dist\JiraAutoTool\ticket_templates
xcopy /Y config_template.json dist\JiraAutoTool\

:: 建立一個 user_presets 資料夾
mkdir dist\JiraAutoTool\user_presets

echo.
echo ==========================================
echo         Build Complete!
echo ==========================================
echo.
echo Your app is ready in: dist\JiraAutoTool
echo.
echo You can zip the 'JiraAutoTool' folder inside 'dist'
echo and send it to anyone!
echo.
pause
