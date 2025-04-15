
async function fetchCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.trim().split('\n').map(row => row.split(','));

  const items = [];
  const byCode = {};

  for (const row of rows.slice(1)) {
    const obj = {
      code: row[0],
      description: row[1],
      parent: row[2] || null,
      details: row[3] || '',
      children: []
    };

    byCode[obj.code] = obj;

    if (obj.parent) {
      if (!byCode[obj.parent]) {
        byCode[obj.parent] = { code: obj.parent, children: [] };
        items.push(byCode[obj.parent]);
      }
      byCode[obj.parent].children.push(obj);
    } else {
      items.push(obj);
    }
  }

  items.forEach(item => {
    if (item.children) {
      item.children.sort((a, b) => a.code.localeCompare(b.code));
    }
  });

  return items;
}

function createTree(data) {
  const treeContainer = document.getElementById('tree');
  treeContainer.innerHTML = '';

  data.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('code-box');
    div.innerHTML = `
      <h3>${item.code} - ${item.description}</h3>
      <button onclick="showContent('${item.code}')">Details</button>
    `;
    treeContainer.appendChild(div);

    if (item.children.length > 0) {
      const childDiv = document.createElement('div');
      childDiv.style.marginLeft = '20px';
      createTree(item.children);
      div.appendChild(childDiv);
    }
  });
}

function showContent(code) {
  const content = document.getElementById('content');
  const item = dataMap[code];
  content.innerHTML = `
    <div class="code-box">
      <h2>${item.code} - ${item.description}</h2>
      ${item.details ? `<div class="details"><p>${item.details}</p></div>` : ''}
    </div>
  `;
}

async function loadData() {
  const data = await fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vRMWtTCMDwpT7z6X_odxHGhCSv-F_AeWBk9FRu8EY88nedibswhhvwZlsTmLxAvNPKX_gY-a-DyS0E0/pub?output=csv');
  dataMap = {};
  data.forEach(item => {
    dataMap[item.code] = item;
  });
  createTree(data);
}

window.onload = loadData;
