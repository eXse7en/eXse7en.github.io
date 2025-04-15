
let icdData = [];

function fetchCSV(url) {
  return fetch(url)
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split('\n').slice(1);
      const rawData = rows.map(row => {
        const [code, description, parent, details] = row.split(',');
        return {
  code: code.trim(),
  description: description.trim(),
  parent: (parent || '').trim(),
  details: (details || '').trim()
};
      });

const obj = {
  code: row[0],
  description: row[1],
  parent: row[2] || null,
  details: row[3] || '',
};

      const map = {};
      rawData.forEach(item => {
        map[item.code] = {
  code: item.code,
  description: item.description,
  details: item.details,
  children: []
};
      });

      const result = [];
      rawData.forEach(item => {
        if (item.parent && map[item.parent]) {
          map[item.parent].children.push(map[item.code]);
        } else {
          result.push(map[item.code]);
        }
      });

      // Urutkan parent dan children berdasarkan kode
result.sort(sortByCode);
result.forEach(item => {
  if (item.children && item.children.length > 0) {
    item.children.sort(sortByCode);
  }
});

return result;
    });
}
function splitCode(code) {
  const match = code.match(/^([A-Za-z]*)([0-9.]+)$/);
  if (match) {
    return {
      prefix: match[1] || '',
      number: parseFloat(match[2]) || 0
    };
  } else {
    return {
      prefix: code,
      number: 0
    };
  }
}

function sortByCode(a, b) {
  const ac = splitCode(a.code);
  const bc = splitCode(b.code);
  if (ac.prefix !== bc.prefix) {
    return ac.prefix.localeCompare(bc.prefix);
  }
  return ac.number - bc.number;
}

function buildSidebar(data) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  data.forEach(item => {
    const parentDiv = document.createElement('div');
    parentDiv.textContent = `${item.code} - ${item.description}`;
    parentDiv.className = 'code-main';
    parentDiv.style.cursor = 'pointer';

    const childrenWrapper = document.createElement('div');
    childrenWrapper.style.marginLeft = '1rem';

    // Default: semua collapse (tertutup)
childrenWrapper.style.display = 'none';

    // Isi child
    if (item.children) {
      item.children.forEach(subItem => {
        const subDiv = document.createElement('div');
        subDiv.textContent = `${subItem.code} - ${subItem.description}`;
        subDiv.className = 'code-sub';
        subDiv.style.cursor = 'pointer';
        subDiv.onclick = (e) => {
          e.stopPropagation();
          showContent(subItem);
        };
        childrenWrapper.appendChild(subDiv);
      });
    }
if (item.__autoExpand) {
  childrenWrapper.style.display = 'block';
  parentDiv.classList.add('expanded');
}

    parentDiv.addEventListener('click', () => {
      const expanded = childrenWrapper.style.display === 'none';
      childrenWrapper.style.display = expanded ? 'block' : 'none';
      parentDiv.classList.toggle('expanded', expanded);
    });

    parentDiv.addEventListener('dblclick', () => showContent(item));

    sidebar.appendChild(parentDiv);
    sidebar.appendChild(childrenWrapper);
  });
}

function showContent(item) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="code-box">
      <h2>${item.code} - ${item.description}</h2>
      ${item.details ? `<div class="details"><p>${item.details}</p></div>` : ''}
    </div>
  `;
}

function searchICD(keyword) {
  const results = [];
  const lowerKeyword = keyword.toLowerCase();

  icdData.forEach(item => {
    const matchParent = item.code.toLowerCase().includes(lowerKeyword) || item.description.toLowerCase().includes(lowerKeyword);

    const matchingChildren = (item.children || []).filter(child =>
      child.code.toLowerCase().includes(lowerKeyword) ||
      child.description.toLowerCase().includes(lowerKeyword)
    );

    if (matchParent) {
      results.push({ ...item, __autoExpand: true });
    } else if (matchingChildren.length > 0) {
      results.push({ ...item, children: matchingChildren, __autoExpand: true });
    }
  });

  buildSidebar(results);
}

document.getElementById('search').addEventListener('input', (e) => {
  const keyword = e.target.value;
  if (keyword.trim() === '') {
    buildSidebar(icdData);
  } else {
    searchICD(keyword);
  }
});

fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vRMWtTCMDwpT7z6X_odxHGhCSv-F_AeWBk9FRu8EY88nedibswhhvwZlsTmLxAvNPKX_gY-a-DyS0E0/pub?output=csv')
  .then(data => {
    icdData = data;
    buildSidebar(icdData);
  })
  .catch(err => {
    console.error('Gagal memuat data dari spreadsheet:', err);
  });
