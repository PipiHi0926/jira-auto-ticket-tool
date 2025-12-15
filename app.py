from flask import Flask, render_template, request, jsonify
import requests
from requests.auth import HTTPBasicAuth
import json
import os

app = Flask(__name__)

# 載入設定檔
def load_config():
    with open('config.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_config(config):
    with open('config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

# 載入模板
def load_templates():
    template_file = os.path.join('ticket_templates', 'templates.json')
    with open(template_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_templates(templates):
    template_file = os.path.join('ticket_templates', 'templates.json')
    with open(template_file, 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=2, ensure_ascii=False)

# User Presets 管理
def load_user_presets():
    preset_file = os.path.join('user_presets', 'presets.json')
    if not os.path.exists(preset_file):
        return {'presets': []}
    with open(preset_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_user_presets(presets):
    preset_file = os.path.join('user_presets', 'presets.json')
    with open(preset_file, 'w', encoding='utf-8') as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)

# 主頁面
@app.route('/')
def index():
    return render_template('index.html')

# 取得設定
@app.route('/api/config', methods=['GET'])
def get_config():
    config = load_config()
    # 不回傳密碼
    safe_config = config.copy()
    if 'password' in safe_config:
        safe_config['password'] = '******' if safe_config['password'] else ''
    return jsonify(safe_config)

# 取得所有 Projects
@app.route('/api/projects', methods=['GET'])
def get_projects():
    config = load_config()
    return jsonify(config.get('projects', []))

# 取得單一 Project
@app.route('/api/projects/<project_key>', methods=['GET'])
def get_project(project_key):
    config = load_config()
    projects = config.get('projects', [])
    for project in projects:
        if project['key'] == project_key:
            return jsonify(project)
    return jsonify({'error': 'Project 不存在'}), 404

# 更新設定
@app.route('/api/config', methods=['POST'])
def update_config():
    try:
        new_config = request.json
        current_config = load_config()
        
        # 如果密碼是 ******，保持原密碼
        if new_config.get('password') == '******':
            new_config['password'] = current_config.get('password', '')
        
        save_config(new_config)
        return jsonify({'success': True, 'message': '設定已更新'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# 測試 JIRA 連線
@app.route('/api/test-connection', methods=['POST'])
def test_connection():
    try:
        config = load_config()
        
        # 測試連線
        url = f"{config['jira_url']}/rest/api/2/myself"
        response = requests.get(
            url,
            auth=HTTPBasicAuth(config['username'], config['password']),
            timeout=10
        )
        
        if response.status_code == 200:
            user_info = response.json()
            return jsonify({
                'success': True, 
                'message': f"連線成功! 使用者: {user_info.get('displayName', config['username'])}"
            })
        else:
            return jsonify({
                'success': False, 
                'message': f"連線失敗: {response.status_code} - {response.text}"
            }), 400
    except Exception as e:
        return jsonify({'success': False, 'message': f"連線錯誤: {str(e)}"}), 500

# 取得所有模板
@app.route('/api/templates', methods=['GET'])
def get_templates():
    templates = load_templates()
    return jsonify(templates)

# 取得單一模板
@app.route('/api/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    templates = load_templates()
    for template in templates['templates']:
        if template['id'] == template_id:
            return jsonify(template)
    return jsonify({'error': '模板不存在'}), 404

# 新增模板
@app.route('/api/templates', methods=['POST'])
def create_template():
    try:
        templates = load_templates()
        new_template = request.json
        
        # 生成新的 ID
        max_id = 0
        for template in templates['templates']:
            template_num = int(template['id'].split('_')[1])
            max_id = max(max_id, template_num)
        
        new_template['id'] = f"template_{max_id + 1}"
        templates['templates'].append(new_template)
        save_templates(templates)
        
        return jsonify({'success': True, 'template': new_template})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# 更新模板
@app.route('/api/templates/<template_id>', methods=['PUT'])
def update_template(template_id):
    try:
        templates = load_templates()
        updated_template = request.json
        
        for i, template in enumerate(templates['templates']):
            if template['id'] == template_id:
                templates['templates'][i] = updated_template
                save_templates(templates)
                return jsonify({'success': True, 'template': updated_template})
        
        return jsonify({'error': '模板不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# 刪除模板
@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    try:
        templates = load_templates()
        templates['templates'] = [t for t in templates['templates'] if t['id'] != template_id]
        save_templates(templates)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# === User Presets API ===
@app.route('/api/user-presets', methods=['GET'])
def get_user_presets():
    return jsonify(load_user_presets())

@app.route('/api/user-presets', methods=['POST'])
def create_user_preset():
    try:
        presets_data = load_user_presets()
        new_preset = request.json
        # 簡單生成 ID
        import time
        new_preset['id'] = f"preset_{int(time.time())}"
        presets_data['presets'].append(new_preset)
        save_user_presets(presets_data)
        return jsonify({'success': True, 'preset': new_preset})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/user-presets/<preset_id>', methods=['DELETE'])
def delete_user_preset(preset_id):
    try:
        presets_data = load_user_presets()
        presets_data['presets'] = [p for p in presets_data['presets'] if p['id'] != preset_id]
        save_user_presets(presets_data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# 建立 JIRA Issue
@app.route('/api/create-issue', methods=['POST'])
def create_issue():
    try:
        config = load_config()
        issue_data = request.json
        
        # 建立 JIRA Issue 的 payload
        jira_payload = {
            "fields": {
                "project": {
                    "key": issue_data.get('project_key', config.get('default_project', 'MCC'))
                },
                "summary": issue_data['summary'],
                "description": issue_data['description'],
                "issuetype": {
                    "name": issue_data['issuetype']
                }
            }
        }
        
        # 加入可選欄位
        if issue_data.get('priority'):
            jira_payload['fields']['priority'] = {"name": issue_data['priority']}
        
        if issue_data.get('assignee'):
            jira_payload['fields']['assignee'] = {"name": issue_data['assignee']}
        
        if issue_data.get('labels'):
            jira_payload['fields']['labels'] = issue_data['labels']
        
        if issue_data.get('components'):
            jira_payload['fields']['components'] = [{"name": c} for c in issue_data['components']]
        
        # 加入自訂欄位 (如果有的話)
        if issue_data.get('custom_fields'):
            # 這裡需要根據你公司的 JIRA 自訂欄位 ID 來映射
            # 暫時先儲存在描述中
            custom_fields_text = "\n\n## 自訂欄位\n"
            for field_key, field_value in issue_data['custom_fields'].items():
                if field_value:  # 只加入有值的欄位
                    custom_fields_text += f"- **{field_key}**: {field_value}\n"
            jira_payload['fields']['description'] += custom_fields_text
        
        # 發送請求到 JIRA
        url = f"{config['jira_url']}/rest/api/2/issue"
        response = requests.post(
            url,
            auth=HTTPBasicAuth(config['username'], config['password']),
            headers={'Content-Type': 'application/json'},
            json=jira_payload,
            timeout=30
        )
        
        if response.status_code == 201:
            issue = response.json()
            return jsonify({
                'success': True,
                'message': f"Issue 建立成功!",
                'issue_key': issue['key'],
                'issue_url': f"{config['jira_url']}/browse/{issue['key']}"
            })
        else:
            return jsonify({
                'success': False,
                'message': f"建立失敗: {response.status_code} - {response.text}"
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f"錯誤: {str(e)}"}), 500

# 取得 JIRA 專案資訊 (用於驗證和取得可用選項)
@app.route('/api/project-meta', methods=['GET'])
def get_project_meta():
    try:
        config = load_config()
        
        # 取得專案的 metadata
        url = f"{config['jira_url']}/rest/api/2/issue/createmeta"
        params = {'projectKeys': config['project_key'], 'expand': 'projects.issuetypes.fields'}
        
        response = requests.get(
            url,
            auth=HTTPBasicAuth(config['username'], config['password']),
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': f"無法取得專案資訊: {response.status_code}"}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 確保必要的目錄存在
    os.makedirs('ticket_templates', exist_ok=True)
    os.makedirs('user_presets', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    # 檢查是否為首次運行 (建立預設 config)
    if not os.path.exists('config.json') and os.path.exists('config_template.json'):
         import shutil
         shutil.copy('config_template.json', 'config.json')

    # 自動開啟瀏覽器
    import webbrowser
    from threading import Timer
    
    def open_browser():
        webbrowser.open_new('http://127.0.0.1:5000/')

    # 延遲 1.5 秒開啟，確保 Server 已啟動
    Timer(1.5, open_browser).start()

    print("程式啟動中... 請稍候，瀏覽器將自動開啟。")
    app.run(host='0.0.0.0', port=5000, debug=False)
