// 全域變數
let currentTemplates = [];
let userPresets = [];
let currentProjects = [];

document.addEventListener('DOMContentLoaded', function () {
    initializeTabs();
    loadConfig();
    loadProjects().then(() => {
        loadTemplates(); // 載入系統模板
        loadUserPresets(); // 載入使用者 Presets
    });
    setupEventListeners();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetId = this.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupEventListeners() {
    document.getElementById('testConnection')?.addEventListener('click', testConnection);
    document.getElementById('saveConfig')?.addEventListener('click', saveConfig);
    document.getElementById('createIssue')?.addEventListener('click', createIssue);
    document.getElementById('refreshTemplates')?.addEventListener('click', () => {
        loadTemplates();
        loadUserPresets();
    });
    document.getElementById('saveAsPreset')?.addEventListener('click', openSavePresetDialog);
}

// 核心載入邏輯
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        document.getElementById('jiraUrl').value = config.jira_url || '';
        document.getElementById('username').value = config.username || '';
        document.getElementById('password').value = config.password || '';
    } catch (e) { console.error(e); }
}

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        currentProjects = await response.json();
    } catch (e) { showAlert('error', '無法載入 Project設定: ' + e.message); }
}

async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        currentTemplates = data.templates || [];
        renderTemplateGrid();
        renderTemplateManager();
    } catch (e) { showAlert('error', '無法載入模板: ' + e.message); }
}

async function loadUserPresets() {
    try {
        const response = await fetch('/api/user-presets');
        const data = await response.json();
        userPresets = data.presets || [];
        renderUserPresetGrid();
    } catch (e) { console.error('無法載入 Presets', e); }
}

// 渲染 grids
function renderTemplateGrid() {
    const container = document.getElementById('templateGrid');
    container.innerHTML = '';
    currentTemplates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
            <div class="template-name">${template.name}</div>
            <div class="template-description">${template.description}</div>
            <div style="margin-top: 10px;">
                <span class="badge badge-primary">${template.project_key}</span>
                <span class="badge badge-success">${template.issuetype}</span>
            </div>
        `;
        // 點擊事件：選用系統模板
        card.addEventListener('click', () => selectTemplate(template, null));
        container.appendChild(card);
    });
}

function renderUserPresetGrid() {
    const section = document.getElementById('userPresetSection');
    const container = document.getElementById('userPresetGrid');
    container.innerHTML = '';

    if (userPresets.length > 0) {
        section.style.display = 'block';
        userPresets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'template-card';
            // 加上刪除按鈕
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <div class="template-name">⭐ ${preset.name}</div>
                    <span style="font-size:0.8em;cursor:pointer;color:red;" class="delete-preset" data-id="${preset.id}">✕</span>
                </div>
                <div class="template-description">${preset.description || '(無描述)'}</div>
                <div style="margin-top: 10px; font-size: 0.8em; color: var(--text-tertiary);">
                    Base: ${getTemplateNameById(preset.base_template_id)}
                </div>
            `;
            // 當點擊卡片本體時 -> 載入 Preset
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-preset')) return;
                selectTemplate(null, preset);
            });
            // 刪除事件
            card.querySelector('.delete-preset').addEventListener('click', (e) => {
                deletePreset(preset.id);
            });
            container.appendChild(card);
        });
    } else {
        section.style.display = 'none';
    }
}

function getTemplateNameById(id) {
    const t = currentTemplates.find(x => x.id === id);
    return t ? t.name : id;
}

// 選用模板 (的核心函數)
// 如果 template 不為空 => 選用系統模板 (使用 template 的 default_values)
// 如果 preset 不為空 => 選用 Preset (先載入 Base template，再用 preset.values 覆蓋)
function selectTemplate(template, preset) {
    let baseTemplate = template;
    let overrideValues = {};

    if (preset) {
        baseTemplate = currentTemplates.find(t => t.id === preset.base_template_id);
        if (!baseTemplate) {
            showAlert('error', '此 Preset 對應的系統模板已不存在');
            return;
        }
        overrideValues = preset.values || {};
    }

    // 更新 UI 狀態
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
    // 簡單處理：如果是點擊事件觸發的，這行通常在 render 內處理了，這裡主要處理邏輯

    document.getElementById('issueFormCard').style.display = 'block';
    document.getElementById('issueFormCard').scrollIntoView({ behavior: 'smooth' });

    let titleText = `${baseTemplate.project_key} / ${baseTemplate.issuetype}`;
    if (preset) titleText += ` (使用: ${preset.name})`;
    document.getElementById('currentTemplateBadge').textContent = titleText;
    document.getElementById('targetInfo').textContent = `目標: [${baseTemplate.project_key}] - ${baseTemplate.issuetype}`;

    document.getElementById('projectKey').value = baseTemplate.project_key;
    document.getElementById('issueType').value = baseTemplate.issuetype;
    document.getElementById('baseTemplateId').value = baseTemplate.id;

    renderDynamicForm(baseTemplate, overrideValues);
}

// 渲染表單 (支援 overrideValues)
function renderDynamicForm(template, overrideValues) {
    const container = document.getElementById('dynamicFieldsContainer');
    container.innerHTML = '';

    const visibleFields = template.visible_fields || ['summary', 'description'];
    // 預設值優先順序: UserPreset > SystemDefault > 空字串
    const sysDefaults = template.default_values || {};

    // 合併 Custom Fields
    const sysCustomDefaults = sysDefaults.custom_fields || {};
    const overrideCustom = overrideValues.custom_fields || {};
    const mergedCustomDefaults = { ...sysCustomDefaults, ...overrideCustom };

    // Standard Fields
    if (visibleFields.includes('summary')) {
        createField(container, {
            id: 'summary', label: '標題 (Summary)', type: 'text', required: true,
            value: overrideValues.summary !== undefined ? overrideValues.summary : (sysDefaults.summary || '')
        });
    }
    if (visibleFields.includes('description')) {
        createField(container, {
            id: 'description', label: '描述 (Description)', type: 'textarea', required: true,
            value: overrideValues.description !== undefined ? overrideValues.description : (sysDefaults.description || '')
        });
    }
    if (visibleFields.includes('priority')) {
        createField(container, {
            id: 'priority', label: '優先級 (Priority)', type: 'select',
            options: ['Highest', 'High', 'Medium', 'Low', 'Lowest'], required: true,
            value: overrideValues.priority !== undefined ? overrideValues.priority : (sysDefaults.priority || 'Medium')
        });
    }
    if (visibleFields.includes('assignee')) {
        createField(container, {
            id: 'assignee', label: '指派給 (Assignee)', type: 'text',
            value: overrideValues.assignee !== undefined ? overrideValues.assignee : (sysDefaults.assignee || '')
        });
    }

    // Custom Fields
    if (visibleFields.includes('custom_fields')) {
        const project = currentProjects.find(p => p.key === template.project_key);
        if (project && project.custom_fields) {
            const customSection = document.createElement('div');
            customSection.style.marginTop = '20px';
            customSection.style.padding = '15px';
            customSection.style.background = 'var(--bg-tertiary)';
            customSection.style.borderRadius = 'var(--radius-sm)';
            customSection.innerHTML = '<h4 style="margin-bottom:10px; color:var(--text-secondary);">Project 自訂欄位</h4>';

            Object.keys(project.custom_fields).forEach(fieldKey => {
                const conf = project.custom_fields[fieldKey];
                const val = mergedCustomDefaults[fieldKey] !== undefined ? mergedCustomDefaults[fieldKey] : '';

                createField(customSection, {
                    id: `custom_${fieldKey}`, label: conf.label, type: conf.type, options: conf.options,
                    required: conf.required, value: val,
                    isCustom: true, dataKey: fieldKey
                });
            });
            container.appendChild(customSection);
        }
    }
}

function createField(container, config) {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = config.label + (config.required ? ' *' : '');
    group.appendChild(label);

    let input;
    if (config.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        input.value = config.value;
    } else if (config.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        if (!config.required) {
            const empty = document.createElement('option');
            empty.value = ''; empty.text = '-- 請選擇 --';
            input.appendChild(empty);
        }
        (config.options || []).forEach(opt => {
            const option = document.createElement('option');
            option.value = opt; option.textContent = opt;
            if (opt === config.value) option.selected = true;
            input.appendChild(option);
        });
    } else if (config.type === 'datetime' || config.type === 'date') {
        input = document.createElement('input');
        input.type = 'datetime-local';
        input.className = 'form-input';

        // JIRA 格式通常包含時區，但 datetime-local 是 yyyy-MM-ddThh:mm
        // 如果有值，直接填入
        input.value = config.value || '';

    } else {
        input = document.createElement('input');
        input.type = config.type === 'number' ? 'number' : 'text';
        input.className = 'form-input';
        input.value = config.value;
    }

    // Tagging
    if (config.id) input.id = config.id;
    if (config.isCustom) {
        input.dataset.customFieldKey = config.dataKey;
        input.classList.add('custom-field-input');
    } else {
        input.classList.add('standard-field-input'); // 標記為標準欄位，方便收集
    }

    group.appendChild(input);
    container.appendChild(group);
}

// 儲存 Preset
async function openSavePresetDialog() {
    const name = prompt("請輸入您的常用模板名稱 (例如: F12 銅製程開單):");
    if (!name) return;

    // 收集目前表單值
    const formValues = {};

    // Standard
    const stdIds = ['summary', 'description', 'priority', 'assignee'];
    stdIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) formValues[id] = el.value;
    });

    // Custom
    const custom = {};
    document.querySelectorAll('.custom-field-input').forEach(input => {
        custom[input.dataset.customFieldKey] = input.value;
    });
    formValues.custom_fields = custom;

    const baseId = document.getElementById('baseTemplateId').value;

    const payload = {
        name: name,
        description: `基於 ${getTemplateNameById(baseId)}`,
        base_template_id: baseId,
        values: formValues
    };

    try {
        const res = await fetch('/api/user-presets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            showAlert('success', '已儲存為常用模板! 🎉');
            loadUserPresets(); // 重新載入列表
        } else {
            showAlert('error', json.message);
        }
    } catch (e) { showAlert('error', e.message); }
}

async function deletePreset(id) {
    if (!confirm("確定要刪除這個常用模板嗎?")) return;
    try {
        await fetch(`/api/user-presets/${id}`, { method: 'DELETE' });
        loadUserPresets();
    } catch (e) { console.error(e); }
}

async function createIssue() {
    const btn = document.getElementById('createIssue');
    const originalText = btn.innerHTML;
    try {
        // 收集資料...
        const projectKey = document.getElementById('projectKey').value;
        const issueType = document.getElementById('issueType').value;

        let summary = "", description = "", priority = "", assignee = "";
        const sEl = document.getElementById('summary'); if (sEl) summary = sEl.value;
        const dEl = document.getElementById('description'); if (dEl) description = dEl.value;
        const pEl = document.getElementById('priority'); if (pEl) priority = pEl.value;
        const aEl = document.getElementById('assignee'); if (aEl) assignee = aEl.value;

        if (!summary || (document.getElementById('description') && !description)) {
            throw new Error('標題與描述為必填');
        }

        const customFields = {};
        document.querySelectorAll('.custom-field-input').forEach(input => {
            if (input.value) customFields[input.dataset.customFieldKey] = input.value;
        });

        const payload = {
            project_key: projectKey, issuetype: issueType,
            summary, description, priority, assignee,
            custom_fields: customFields
        };

        btn.innerHTML = '處理中...'; btn.disabled = true;
        const response = await fetch('/api/create-issue', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            showAlert('success', `成功! <a href="${result.issue_url}" target="_blank">Issue Link</a>`);
        } else {
            throw new Error(result.message);
        }
    } catch (e) { showAlert('error', e.message); } finally {
        btn.innerHTML = originalText; btn.disabled = false;
    }
}

// Template Manager View
function renderTemplateManager() {
    const list = document.getElementById('templateManagerList');
    list.innerHTML = '';
    currentTemplates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'template-card';
        div.innerHTML = `<div><strong>${t.name}</strong> (${t.project_key})</div><div style="font-size:0.8em; color:#888;">${t.description}</div>`;
        list.appendChild(div);
    });
}
function showAlert(type, msg) {
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.style.position = 'fixed'; div.style.top = '20px'; div.style.right = '20px'; div.style.zIndex = 1000;
    div.innerHTML = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}
// Settings functions
async function saveConfig() {
    const config = {
        jira_url: document.getElementById('jiraUrl').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
    try {
        const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
        const data = await res.json();
        showAlert(data.success ? 'success' : 'error', data.message);
    } catch (e) { showAlert('error', e.message); }
}
async function testConnection() {
    try {
        const res = await fetch('/api/test-connection', { method: 'POST' });
        const data = await res.json();
        showAlert(data.success ? 'success' : 'error', data.message);
    } catch (e) { showAlert('error', e.message); }
}
