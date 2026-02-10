let data = null;

async function loadData() {
  try {
    const res = await fetch('./data/roadmap.json');
    data = await res.json();
    render();
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

function render() {
  document.getElementById('lastUpdated').textContent = data.lastUpdated;
  
  const activeItems = data.items.filter(i => i.status !== 'DONE');
  const doneItems = data.items.filter(i => i.status === 'DONE');
  const blockedCount = data.items.filter(i => i.blocked).length;
  
  // Stats
  document.getElementById('stats').innerHTML = `
    <div class="stat-card active">
      <div class="number">${activeItems.length}</div>
      <div class="label">🔄 进行中</div>
    </div>
    <div class="stat-card done">
      <div class="number">${doneItems.length}</div>
      <div class="label">✅ 已结束</div>
    </div>
    <div class="stat-card blocked">
      <div class="number">${blockedCount}</div>
      <div class="label">⚠️ 有阻塞</div>
    </div>
  `;
  
  // Active cards
  const activeContainer = document.getElementById('activeCards');
  if (activeItems.length === 0) {
    activeContainer.innerHTML = '<div class="empty-state">暂无进行中的需求</div>';
  } else {
    activeContainer.innerHTML = activeItems.map(renderCard).join('');
  }
  
  // Done cards
  const doneContainer = document.getElementById('doneCards');
  if (doneItems.length === 0) {
    doneContainer.innerHTML = '<div class="empty-state">暂无已结束的需求</div>';
  } else {
    doneContainer.innerHTML = doneItems.map(renderCard).join('');
  }
  
  // Bind click events
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function renderCard(item) {
  const pClass = item.priority.toLowerCase();
  const statusClass = item.blocked ? 'blocked' : item.status === 'READY' ? 'ready' : item.status === 'DONE' ? 'done' : '';
  const statusText = item.blocked ? '⚠️ 阻塞' : getStatusText(item.status);
  
  return `
    <div class="card ${pClass}" data-id="${item.id}">
      <div class="card-header">
        <div class="card-title">${item.title}</div>
        <div class="card-badges">
          <span class="badge priority">${item.priority}</span>
          <span class="badge status ${statusClass}">${statusText}</span>
        </div>
      </div>
      ${item.goalSummary ? `<div class="card-goal">🎯 ${item.goalSummary}</div>` : ''}
      ${item.blocked ? `<div class="card-blocker">⏸️ ${item.blocked}</div>` : ''}
      <div class="card-hint">点击查看详情 →</div>
    </div>
  `;
}

function getStatusText(status) {
  const map = {
    'IN_PROGRESS': '进行中',
    'READY': '待排期',
    'DONE': '已完成',
    'BLOCKED': '阻塞'
  };
  return map[status] || status;
}

function openModal(id) {
  const item = data.items.find(i => i.id === id);
  if (!item) return;
  
  const modal = document.getElementById('modalContent');
  const statusText = item.blocked ? '阻塞中' : getStatusText(item.status);
  
  modal.innerHTML = `
    <div class="modal-header">
      <div>
        <div class="modal-title">${getEmoji(item.title)} ${item.title}</div>
        <div class="modal-subtitle">${item.id} · ${item.priority} · ${statusText}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      ${item.docUrl ? `<a href="${item.docUrl}" target="_blank" class="doc-link">📄 查看产品文档 →</a>` : ''}
      
      ${item.blocked ? `<div class="blocker-box"><span>⚠️</span><span>${item.blocked}</span></div>` : ''}
      
      <div class="detail-section goals-box">
        <h4>📈 业务目标</h4>
        <ul>${item.goals.map(g => `<li>${g}</li>`).join('')}</ul>
      </div>
      
      <div class="detail-section">
        <h4>🚩 里程碑</h4>
        <ul class="milestones-list">
          ${item.milestones.map(m => `
            <li>
              <span class="milestone-icon ${m.status}">${getMilestoneIcon(m.status)}</span>
              <span class="milestone-text">${m.name}</span>
              ${m.date ? `<span class="milestone-date">${m.date}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
      
      ${item.todos && item.todos.length > 0 ? `
      <div class="detail-section todos-box">
        <h4>📝 待办事项</h4>
        <ul>${item.todos.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      ` : ''}
      
      <div class="detail-section competitor-box">
        <h4>🔍 竞品动态</h4>
        ${item.competitors && item.competitors.items && item.competitors.items.length > 0 ? `
          <div class="update-time">数据更新: ${item.competitors.updateTime || data.lastUpdated}</div>
          ${item.competitors.items.map(c => `
            <div class="competitor-item">
              <div class="source">${c.source}</div>
              <div class="content">${c.content}</div>
            </div>
          `).join('')}
        ` : '<div class="no-data">暂无近期相关竞品动态</div>'}
      </div>
      
      <div class="detail-section feedback-box">
        <h4>💬 用户反馈</h4>
        ${item.feedback && item.feedback.items && item.feedback.items.length > 0 ? `
          <div class="update-time">来源: ${item.feedback.source || 'Twitter 近期讨论'}</div>
          ${item.feedback.items.map(f => `
            <div class="feedback-point ${f.type}">
              <span class="icon">${getFeedbackIcon(f.type)}</span>
              <span>${f.content}</span>
            </div>
          `).join('')}
        ` : '<div class="no-data">暂无近期相关用户反馈</div>'}
      </div>
    </div>
  `;
  
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function getEmoji(title) {
  if (title.includes('预测')) return '🎯';
  if (title.includes('Candydrop') || title.includes('UI')) return '🎨';
  if (title.includes('现货') || title.includes('分区')) return '📊';
  return '📋';
}

function getMilestoneIcon(status) {
  const icons = { done: '✓', blocked: '⏸', pending: '⏳', in_progress: '◐' };
  return icons[status] || '○';
}

function getFeedbackIcon(type) {
  const icons = { positive: '👍', negative: '👎', neutral: '💡' };
  return icons[type] || '💬';
}

// ESC to close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Click overlay to close
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target.id === 'modalOverlay') closeModal();
});

// Init
loadData();
