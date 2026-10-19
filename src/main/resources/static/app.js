const els = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
let latestResult = null;
const runs = [];

const sample = {
    scenarioName: '订单履约研发闭环',
    transcript: '我们先访谈并确认需求，设计评审通过后开发，实现完成后跑自动化测试，全部通过才能生成发布候选；失败转人工。'
};

function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function toast(message, error = false) {
    els.toast.textContent = message;
    els.toast.className = `toast show${error ? ' error' : ''}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.className = 'toast', 3200);
}

function setLoading(loading) {
    els.runPipeline.disabled = loading;
    els.runPipeline.innerHTML = loading ? '<span>◌</span> 正在规划' : '<span>▶</span> 运行管线';
    els.interviewStatus.className = `status-pill ${loading ? 'neutral' : 'success'}`;
    els.interviewStatus.textContent = loading ? '抽取语义中' : '执行完成';
}

function renderFlow(result) {
    const model = result.extraction.candidate;
    const completed = new Set((result.run?.steps || []).map(step => step.capabilityId));
    const nodes = model.capabilities.map((capability, index) => {
        const role = model.roles.find(item => item.id === capability.ownerRole);
        return `${index ? '<span class="flow-arrow">→</span>' : ''}<div class="agent-node ${completed.has(capability.id) ? 'done' : ''}">
            <b>${escapeHtml(role?.description || capability.ownerRole)}</b>
            <small>${escapeHtml(capability.description)}</small>
            <em>${completed.has(capability.id) ? '✓ 已执行' : '待执行'}</em>
        </div>`;
    }).join('');
    els.agentFlow.className = 'flow-canvas';
    els.agentFlow.innerHTML = nodes;
    els.graphMeta.textContent = `${model.roles.length} Agent · ${model.capabilities.length} Action`;
}

function renderOverview(result) {
    const run = result.run;
    els.goalRing.className = `goal-ring${run?.achieved ? ' complete' : ''}`;
    els.goalRing.innerHTML = `<div><strong>${run?.achieved ? '100%' : '0%'}</strong><span>${run?.achieved ? '目标已达成' : '目标未达成'}</span></div>`;
    els.actionCount.textContent = run?.steps?.length ?? 0;
    els.replanCount.textContent = run?.replans ?? 0;
    els.evidenceCount.textContent = run?.finalState?.evidence?.length ?? 0;
    els.validationState.textContent = result.validation.valid ? '通过' : '失败';
}

function renderTimeline(result) {
    const steps = result.run?.steps || [];
    if (!steps.length) {
        els.timeline.className = 'timeline-placeholder';
        els.timeline.textContent = '没有可执行步骤';
        return;
    }
    els.timeline.className = 'timeline';
    els.timeline.innerHTML = steps.map(step => `<div class="timeline-item">
        <span class="timeline-index">${step.sequence}</span>
        <div class="timeline-copy"><b>${escapeHtml(step.capabilityId)}</b><span>${escapeHtml(step.ownerRole)} · ${escapeHtml(step.preconditions?.length ? `前置条件 ${step.preconditions.join(', ')}` : '无前置条件')} · 产生 ${escapeHtml((step.effects || []).join(', '))}</span></div>
    </div>`).join('');
}

function renderRuns() {
    if (!runs.length) return;
    els.runTable.className = '';
    els.runTable.innerHTML = runs.map(run => `<div class="run-row"><strong>#${run.id}</strong><div><b>${escapeHtml(run.name)}</b><br><span>${escapeHtml(run.goal)}</span></div><span>${run.steps} 步</span><span>${run.ok ? '✓ 已达成' : '未达成'}</span></div>`).join('');
}

function render(result) {
    latestResult = result;
    const model = result.extraction.candidate;
    els.sidebarScenario.textContent = model.name;
    renderFlow(result);
    renderOverview(result);
    renderTimeline(result);
    els.modelJson.textContent = JSON.stringify(model, null, 2);
    runs.unshift({ id: runs.length + 1, name: model.name, goal: result.run?.goalId || '—', steps: result.run?.steps?.length || 0, ok: Boolean(result.run?.achieved) });
    renderRuns();
}

async function runPipeline() {
    const transcript = els.transcript.value.trim();
    if (!transcript) return toast('请先输入业务访谈内容', true);
    setLoading(true);
    try {
        const response = await fetch('/api/pipeline/run', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ transcript, scenarioName: els.scenarioName.value.trim() || '未命名场景' })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        render(body);
        els.interviewStatus.className = 'status-pill success';
        els.interviewStatus.textContent = '执行完成';
        toast(body.run?.achieved ? '目标已达成，执行证据已生成' : '管线已完成，但目标尚未达成');
    } catch (error) {
        els.interviewStatus.className = 'status-pill error';
        els.interviewStatus.textContent = '运行失败';
        toast(`运行失败：${error.message}`, true);
    } finally {
        els.runPipeline.disabled = false;
        els.runPipeline.innerHTML = '<span>▶</span> 运行管线';
    }
}

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${button.dataset.view}View`).classList.add('active');
}));

els.runPipeline.addEventListener('click', runPipeline);
els.loadExample.addEventListener('click', () => {
    els.scenarioName.value = sample.scenarioName;
    els.transcript.value = sample.transcript;
    els.transcript.dispatchEvent(new Event('input'));
    toast('示例访谈已载入');
});
els.transcript.addEventListener('input', () => els.charCount.textContent = `${[...els.transcript.value].length} 字`);
els.transcript.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runPipeline();
});
els.copyModel.addEventListener('click', async () => {
    if (!latestResult) return toast('请先运行管线', true);
    await navigator.clipboard.writeText(els.modelJson.textContent);
    toast('模型 JSON 已复制');
});
els.transcript.dispatchEvent(new Event('input'));
