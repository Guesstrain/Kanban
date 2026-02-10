let roadmapData = null;

async function loadData() {
  try {
    const res = await fetch('./data/roadmap.json');
    roadmapData = await res.json();
    render();
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

function render() {
  document.getElementById('lastUpdated').textContent = roadmapData.lastUpdated;
  
  const board = document.getElementById('board');
  board.innerHTML = '';
  
  roadmapData.columns.forEach(column => {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class="column-header">
        <span class="column-title">${column.title}</span>
        <span class="column-count">${column.items.length}</span>
      </div>
      <div class="column-items">
        ${column.items.length === 0 
          ? '<div class="empty-column">暂无需求</div>'
          : column.items.map(item => renderCard(item)).join('')
        }
      </div>
    `;
    board.appendChild(col);
  });

  // 绑定点击事件
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      showDetail(id);
    });
  });
}

function renderCard(item) {
  const priorityClass = item.priority.toLowerCase();
  const statusClass = item.blocked ? 'blocked' : item.status.toLowerCase();
  
  return `
    <div class="card ${priorityClass}" data-id="${item.id}">
      <div class="card-header">
        <span class="card-id">${item.id}</span>
        <span class="priority ${priorityClass}">${item.priority}</span>
      </div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.description}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${item.progress}%"></div>
      </div>
      <div class="card-footer">
        <span>${item.progress}% 完成</span>
        <span class="status-badge ${statusClass}">${item.blocked ? '⚠️ 阻塞' : getStatusText(item.status)}</span>
      </div>
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

function showDetail(id) {
  let item = null;
  roadmapData.columns.forEach(col => {
    col.items.forEach(i => {
      if (i.id === id) item = i;
    });
  });
  
  if (!item) return;
  
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  
  body.innerHTML = `
    <h2>
      <span class="priority ${item.priority.toLowerCase()}">${item.priority}</span>
      ${item.title}
    </h2>
    <p style="color: #aaa; margin-bottom: 20px;">${item.description}</p>
    
    ${item.blocked ? `<div class="blocked-alert">⚠️ 阻塞原因: ${item.blocked}</div>` : ''}
    
    <section>
      <h3>📦 范围</h3>
      <ul>
        ${item.scope.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </section>
    
    <section>
      <h3>🎯 业务目标</h3>
      <ul>
        ${item.goals.map(g => `<li>${g}</li>`).join('')}
      </ul>
    </section>
    
    <section>
      <h3>📍 里程碑</h3>
      ${item.milestones.map(m => `
        <div class="milestone">
          <span class="milestone-status ${m.status}">${getIcon(m.status)}</span>
          <span>${m.name}${m.date ? ` (${m.date})` : ''}</span>
        </div>
      `).join('')}
    </section>
    
    ${item.todos && item.todos.length > 0 ? `
    <section>
      <h3>✅ 待办事项</h3>
      <ul>
        ${item.todos.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </section>
    ` : ''}
  `;
  
  modal.classList.add('show');
}

function getIcon(status) {
  const icons = {
    'done': '✓',
    'in_progress': '◐',
    'waiting': '○',
    'blocked': '✗'
  };
  return icons[status] || '○';
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

// ESC 关闭弹窗
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// 点击遮罩关闭
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// 启动
loadData();
