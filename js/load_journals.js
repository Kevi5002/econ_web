// Lists journal entries created through Pages CMS (data/journals/*.json).
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('journal-list');
  if (!container) return;

  const owner = 'Kevi5002';
  const repo = 'econ_web';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/journals`;

  const showEmpty = () => {
    container.replaceChildren(el('p', 'journal-empty', 'No articles have been published yet — check back soon.'));
  };

  fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } })
    .then((res) => {
      if (res.status === 404) return []; // folder not created yet
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json();
    })
    .then((files) => {
      if (!Array.isArray(files)) return [];
      const jsonFiles = files.filter((f) => f.type === 'file' && f.name.endsWith('.json'));
      return Promise.all(jsonFiles.map((f) =>
        fetch(f.download_url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      ));
    })
    .then((entries) => {
      const articles = entries
        .filter((a) => a && a.title)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))); // newest first

      if (!articles.length) return showEmpty();
      const frag = document.createDocumentFragment();
      articles.forEach((a) => frag.appendChild(renderCard(a)));
      container.replaceChildren(frag);
    })
    .catch((err) => {
      console.error('Error loading journals:', err);
      showEmpty();
    });
});

// Build each card with textContent so CMS text can never inject HTML/script.
function renderCard(data) {
  const card = el('div', 'journal-card');
  card.appendChild(el('h3', null, data.title));

  const meta = el('p');
  meta.append(el('strong', null, 'By:'), ` ${data.author || 'Unknown'} | `,
              el('strong', null, 'Published:'), ` ${data.date || ''}`);
  card.appendChild(meta);

  if (data.summary) card.appendChild(el('p', null, data.summary));

  const href = safeUrl(data.file);
  if (href) {
    const link = el('a', 'download-btn', 'Read PDF');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    card.appendChild(link);
  }
  return card;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Only allow relative paths or http(s) links (blocks javascript: URLs).
function safeUrl(value) {
  if (!value) return null;
  // Pages CMS saves root-relative paths ("/images/journals/x.pdf"); make them
  // page-relative so they also work when the site is served from /econ_web/.
  if (value.startsWith('/') && !value.startsWith('//')) value = value.slice(1);
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
