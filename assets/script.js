// state
let PROBLEMS = [];
const STORAGE_KEY = 'cpp_dsa_tracker_v2';
let tracker = {};

try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) tracker = JSON.parse(saved);
} catch {}

function saveTracker() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker)); } catch {}
}

let shouldRestoreScroll = false;
let isRestoringScroll = false;
const navHistory = [];
let activeFilter = 'all';
let activePopover = null;

// markdown custom renderer
const renderer = new marked.Renderer();

renderer.blockquote = function(token) {
    const text = typeof token === 'object' ? this.parser.parse(token.tokens) : token;
    const match = text.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (match) {
        const type = match[1].toUpperCase();
        const body = text.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').trim();
        const icons = { NOTE: 'circle-info', TIP: 'lightbulb', IMPORTANT: 'circle-exclamation', WARNING: 'triangle-exclamation', CAUTION: 'circle-radiation' };
        const titles = { NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Warning', CAUTION: 'Caution' };
        return `<div class="alert-box alert-${type.toLowerCase()}">
            <div class="alert-header"><i class="fa-solid fa-${icons[type]}"></i> ${titles[type]}</div>
            ${body}
        </div>`;
    }
    return `<blockquote>${text}</blockquote>`;
};

renderer.code = function(codeObj) {
    const text = typeof codeObj === 'object' ? codeObj.text : codeObj;
    const lang = (typeof codeObj === 'object' ? codeObj.lang : '') || 'cpp';
    return `<pre><code class="language-${lang.toLowerCase()}">${escapeHtml(text)}</code></pre>`;
};

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

marked.use({ renderer });

// boot
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupHeaderButtons();
    setupSearch();
    setupTrackerFilters();
    setupHeaderHoverReveal();
    setupMobileScrollReveal();

    try {
        const res = await fetch('docs/problems.json');
        if (res.ok) {
            PROBLEMS = await res.json();
            PROBLEMS.forEach(p => {
                const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                p.leetcode = p.leetcode_url || `https://leetcode.com/problems/${slug}/`;
                p.markdown = `docs/solutions/lc-${String(p.id).padStart(4, '0')}.md`;
                p.topic = p.topic || p.pattern || `Chapter ${p.chapter || ''}`;
                if (!tracker[p.id]) tracker[p.id] = { status: 'todo' };
            });
            saveTracker();
        }
    } catch (e) {
        console.error('error loading problems json:', e);
    }

    window.addEventListener('hashchange', () => handleRoute(window.location.hash));
    document.getElementById('markdown-container').addEventListener('click', onMarkdownClick);

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    window.addEventListener('scroll', () => {
        if (!isRestoringScroll && !shouldRestoreScroll) {
            localStorage.setItem('cpp_dsa_last_scroll', window.scrollY);
        }
    });

    const savedHash = localStorage.getItem('cpp_dsa_last_hash');
    let initialHash = window.location.hash;
    if (!initialHash || initialHash === '#' || initialHash === '#index') {
        if (savedHash && savedHash !== '#index' && savedHash !== '#') {
            initialHash = savedHash;
            window.location.hash = savedHash;
        }
    }

    if (initialHash) shouldRestoreScroll = true;
    handleRoute(initialHash);
});

// theme toggle
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.className = saved === 'light' ? 'light-theme' : 'dark-theme';
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

function setupHeaderButtons() {
    document.getElementById('back-btn').addEventListener('click', () => {
        const hash = window.location.hash || '';
        if (isSolutionRoute(hash)) {
            window.location.hash = '#problems';
        } else if (isChapterRoute(hash)) {
            window.location.hash = '#index';
        } else {
            window.location.hash = '#index';
        }
    });

    document.getElementById('cs-btn').addEventListener('click', () => { window.location.hash = '#cheatsheet'; });

    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => { window.location.hash = '#index'; });
    }

    const modal = document.getElementById('tracker-modal');
    document.getElementById('tracker-btn').addEventListener('click', () => {
        if (window.location.hash === '#problems') {
            showProblemsTable();
        } else {
            window.location.hash = '#problems';
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.location.hash = '#index';
        }
    });
}

function isChapterRoute(hash) {
    if (!hash) return false;
    const h = hash.toLowerCase();
    return /^#chapter-\d+/i.test(h)
        || h.startsWith('#note-chapters/')
        || h.startsWith('#note-chapter-')
        || h.startsWith('#note-docs/chapters/');
}

function isSolutionRoute(hash) {
    if (!hash) return false;
    const h = hash.toLowerCase();
    return /^#problem-\d+/i.test(h)
        || h.startsWith('#note-solutions/')
        || h.startsWith('#note-docs/solutions/')
        || h.startsWith('#note-lc-');
}

function showProblemsTable() {
    const modal = document.getElementById('tracker-modal');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    refreshTrackerStats();
    renderTrackerTable();
    modal.scrollTop = 0;
}

// router
function handleRoute(hash) {
    const modal = document.getElementById('tracker-modal');
    const isHome = !hash || hash === '#' || hash === '#index' || hash === '#welcome';
    const isProblemsTable = hash === '#problems' || hash === '#tracker' || hash === '#note-problems.md' || hash === '#note-docs/problems.md';
    const isChapter = isChapterRoute(hash);
    const isSolution = isSolutionRoute(hash);
    const backBtn = document.getElementById('back-btn');

    if (!isProblemsTable) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    const cleanHash = isHome ? '#index' : hash;
    localStorage.setItem('cpp_dsa_last_hash', cleanHash);

    if (navHistory[navHistory.length - 1] !== hash) {
        navHistory.push(hash);
    }

    backBtn.style.display = (isChapter || isSolution) ? 'inline-flex' : 'none';

    if (isHome)                 return loadMarkdown('docs/index.md');
    if (hash === '#cheatsheet') return loadMarkdown('docs/cheatsheet.md');
    if (isProblemsTable)        return showProblemsTable();
    if (hash === '#roadmap')    return loadMarkdown('docs/roadmap.md');

    const cm = hash.match(/^#chapter-(\d+)$/);
    if (cm) return loadMarkdown(`docs/chapters/chapter-${cm[1]}.md`);

    if (hash.startsWith('#note-')) {
        let route = hash.slice(6);
        let anchor = '';
        if (route.includes(':')) [route, anchor] = route.split(':');
        if (route.startsWith('chapters/') || route.startsWith('solutions/')) {
            return loadMarkdown(`docs/${route}`, anchor);
        }
        if (route.startsWith('notes/') || route.startsWith('docs/') || route.startsWith('index/') || route.startsWith('assets/')) {
            return loadMarkdown(route, anchor);
        }
        if (route.startsWith('chapter-')) {
            return loadMarkdown(`docs/chapters/${route}`, anchor);
        }
        return loadMarkdown(`docs/${route}`, anchor);
    }

    const pm = hash.match(/^#problem-(\d+)$/);
    if (pm) {
        const p = PROBLEMS.find(x => String(x.id) === pm[1]);
        if (p) return loadMarkdown(p.markdown || `docs/solutions/lc-${String(p.id).padStart(4, '0')}.md`);
    }
}

// intercept markdown clicks
function onMarkdownClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || !href.includes('.md')) return;

    e.preventDefault();
    let [filename, anchor] = href.split('#');
    filename = filename.replace(/^(notes|docs)\//, '');
    let hash = `#note-${filename}`;
    if (anchor) hash += `:${anchor}`;
    window.location.hash = hash;
}

// fetch and render doc
function loadMarkdown(filepath, anchor = '') {
    const container = document.getElementById('markdown-container');
    container.innerHTML = '';

    fetch(filepath)
        .then(r => { if (!r.ok) throw new Error(); return r.text(); })
        .then(text => {
            container.innerHTML = marked.parse(text);

            if (typeof renderMathInElement === 'function') {
                renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }

            const isIndex = filepath.toLowerCase().endsWith('index.md');
            container.classList.toggle('is-index', isIndex);
            Prism.highlightAllUnder(container);
            enhanceLeetCodeLinks(filepath);
            wrapTables(container);

            if (shouldRestoreScroll) {
                shouldRestoreScroll = false;
                const savedScroll = parseInt(localStorage.getItem('cpp_dsa_last_scroll') || '0', 10);
                if (savedScroll > 0) {
                    isRestoringScroll = true;
                    setTimeout(() => {
                        window.scrollTo(0, savedScroll);
                        isRestoringScroll = false;
                    }, 100);
                } else if (anchor) {
                    scrollToAnchor(anchor, container);
                } else {
                    window.scrollTo(0, 0);
                }
            } else if (anchor) {
                scrollToAnchor(anchor, container);
            } else {
                window.scrollTo(0, 0);
            }
        })
        .catch(() => {
            container.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-secondary)">Content not found.</div>`;
        });
}

function scrollToAnchor(anchor, container) {
    setTimeout(() => {
        const id = anchor.toLowerCase();
        let el = document.getElementById(id);
        if (!el) {
            for (const h of container.querySelectorAll('h1,h2,h3,h4')) {
                const slug = h.innerText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                if (slug === id || slug.includes(id)) { el = h; break; }
            }
        }
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - window.innerHeight * 0.25, behavior: 'smooth' });
    }, 150);
}

// decorate leetcode links into capsule pills
function enhanceLeetCodeLinks(filepath = '') {
    const container = document.getElementById('markdown-container');
    const sorted = [...PROBLEMS].sort((a, b) => b.name.length - a.name.length);
    const isProblemFile = filepath.includes('problems/') || filepath.includes('solutions/');

    container.querySelectorAll('a').forEach(link => {
        if (link.classList.contains('lc-problem-capsule') || link.closest('.lc-problem-capsule') || link.closest('.alert-box') || link.closest('blockquote')) return;
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#') || href.includes('chapters/') || href.includes('chapter-') || href.includes('index.md') || href.includes('cheatsheet.md') || href.includes('roadmap.md')) return;
        const text = link.innerText.trim();

        let prob = null;
        const lcMatch = text.match(/LC\s*#?(\d+)/i) || href.match(/lc-?0*(\d+)\.md/i);
        if (lcMatch) prob = PROBLEMS.find(p => String(p.id) === parseInt(lcMatch[1], 10).toString());

        if (!prob) {
            const lower = text.toLowerCase();
            prob = sorted.find(p => p.name.toLowerCase() === lower) || sorted.find(p => lower.startsWith(p.name.toLowerCase()));
        }

        if (!prob && href.includes('leetcode.com/problems/')) {
            const m = href.match(/problems\/([^\/\?#]+)/i);
            if (m) {
                const slug = m[1].toLowerCase();
                prob = sorted.find(p => {
                    const pSlugMatch = p.leetcode.match(/problems\/([^\/\?#]+)/i);
                    const pSlug = pSlugMatch ? pSlugMatch[1].toLowerCase() : '';
                    const nameSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return slug === pSlug || slug === nameSlug;
                });
            }
        }

        if (!prob) return;

        const state = tracker[prob.id]?.status || 'todo';
        const statusHtml = state === 'solved'
            ? `<i class="fa-solid fa-circle-check" style="color:var(--easy-color);font-size:.8rem"></i>`
            : state === 'progress'
            ? `<i class="fa-solid fa-circle-half-stroke" style="color:var(--medium-color);font-size:.8rem"></i>`
            : '';

        const capsule = document.createElement('a');
        capsule.className = 'lc-problem-capsule';

        if (isProblemFile) {
            capsule.href = prob.leetcode || href;
            capsule.target = '_blank';
            capsule.rel = 'noopener noreferrer';
        } else {
            capsule.href = prob.markdown ? `#note-${prob.markdown.replace(/^(notes|docs)\//, '')}` : `#problem-${prob.id}`;
        }

        capsule.innerHTML = `
            <div class="lc-capsule-left">
                <i class="fa-regular fa-file-lines lc-icon"></i>
                <span>${prob.id}. ${prob.name}</span>
            </div>
            <div class="lc-capsule-right">
                <span class="lc-diff ${prob.difficulty.toLowerCase()}">${prob.difficulty}</span>
                ${statusHtml}
            </div>`;

        link.replaceWith(capsule);
    });
}

function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function closeAllPopovers() {
    if (activePopover) {
        if (activePopover._triggerBtn) activePopover._triggerBtn.classList.remove('popover-open');
        activePopover.remove();
        activePopover = null;
    }
}

document.addEventListener('click', (e) => {
    if (activePopover && !activePopover.contains(e.target) && !e.target.closest('.status-cb-btn') && !e.target.closest('.companies-btn')) {
        closeAllPopovers();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPopovers();
});

window.addEventListener('resize', closeAllPopovers);

// tracker filters
function setupTrackerFilters() {
    const diffSelect = document.getElementById('difficulty-select');
    if (diffSelect) {
        diffSelect.value = localStorage.getItem('cpp_dsa_filter_diff') || 'all';
        diffSelect.addEventListener('change', (e) => {
            localStorage.setItem('cpp_dsa_filter_diff', e.target.value);
            closeAllPopovers();
            renderTrackerTable();
        });
    }

    document.querySelectorAll('.stat-item[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveFilter(btn.getAttribute('data-filter'));
        });
    });

    activeFilter = localStorage.getItem('cpp_dsa_filter_status') || 'all';
    updateStatPillsActiveState(activeFilter);
}

function setActiveFilter(filterVal) {
    activeFilter = filterVal;
    localStorage.setItem('cpp_dsa_filter_status', activeFilter);
    updateStatPillsActiveState(activeFilter);
    closeAllPopovers();
    renderTrackerTable();
}

function updateStatPillsActiveState(currentFilter) {
    document.querySelectorAll('.stat-item[data-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
    });
}

// tracker search
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (!searchInput) return;

    const savedSearch = localStorage.getItem('cpp_dsa_search') || '';
    searchInput.value = savedSearch;
    if (clearBtn) clearBtn.style.display = savedSearch ? 'flex' : 'none';

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('cpp_dsa_search', val);
        if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
        closeAllPopovers();
        renderTrackerTable();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            localStorage.setItem('cpp_dsa_search', '');
            clearBtn.style.display = 'none';
            searchInput.focus();
            closeAllPopovers();
            renderTrackerTable();
        });
    }
}

function refreshTrackerStats() {
    let solved = 0, progress = 0, todo = 0;
    PROBLEMS.forEach(p => {
        const s = tracker[p.id]?.status || 'todo';
        if (s === 'solved') solved++;
        else if (s === 'progress') progress++;
        else todo++;
    });
    document.getElementById('stat-total').innerText = PROBLEMS.length;
    document.getElementById('stat-solved').innerText = solved;
    document.getElementById('stat-progress').innerText = progress;
    document.getElementById('stat-todo').innerText = todo;
}

// popover menus
function openStatusPopover(triggerBtn, problemId) {
    if (activePopover && activePopover._triggerBtn === triggerBtn) {
        closeAllPopovers();
        return;
    }
    closeAllPopovers();
    const currentStatus = tracker[problemId]?.status || 'todo';

    const popover = document.createElement('div');
    popover.className = 'status-popover';
    popover._triggerBtn = triggerBtn;
    triggerBtn.classList.add('popover-open');

    popover.innerHTML = `
        <button class="status-popover-item ${currentStatus === 'todo' ? 'active' : ''}" data-status="todo">
            <span class="status-marker todo"></span>
            <span>To Do</span>
        </button>
        <button class="status-popover-item ${currentStatus === 'progress' ? 'active' : ''}" data-status="progress">
            <span class="status-marker progress"><i class="fa-solid fa-minus"></i></span>
            <span>In Progress</span>
        </button>
        <button class="status-popover-item ${currentStatus === 'solved' ? 'active' : ''}" data-status="solved">
            <span class="status-marker solved"><i class="fa-solid fa-check"></i></span>
            <span>Solved</span>
        </button>
    `;

    document.body.appendChild(popover);
    activePopover = popover;

    const rect = triggerBtn.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left;

    if (top + 130 > window.innerHeight) top = rect.top - 130;
    if (left + 150 > window.innerWidth) left = window.innerWidth - 160;
    if (left < 10) left = 10;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;

    popover.querySelectorAll('.status-popover-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            let selectedStatus = item.getAttribute('data-status');
            if (currentStatus === selectedStatus && selectedStatus !== 'todo') {
                selectedStatus = 'todo';
            }
            tracker[problemId] = { status: selectedStatus };
            saveTracker();
            refreshTrackerStats();
            closeAllPopovers();

            if (activeFilter !== 'all') {
                renderTrackerTable();
            } else {
                updateStatusButton(triggerBtn, selectedStatus);
            }
        });
    });
}

function updateStatusButton(btn, status) {
    btn.className = `status-cb-btn ${status}`;
    if (status === 'solved') {
        btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
    } else if (status === 'progress') {
        btn.innerHTML = `<i class="fa-solid fa-minus"></i>`;
    } else {
        btn.innerHTML = ``;
    }
}

function openCompaniesPopover(triggerBtn, problem) {
    if (activePopover && activePopover._triggerBtn === triggerBtn) {
        closeAllPopovers();
        return;
    }
    closeAllPopovers();

    const popover = document.createElement('div');
    popover.className = 'companies-popover';
    popover._triggerBtn = triggerBtn;
    triggerBtn.classList.add('popover-open');

    const companiesHtml = (problem.companies || []).map(c => `<span class="company-tag">${escapeHtml(c)}</span>`).join('');

    popover.innerHTML = `
        <div class="companies-popover-body">
            ${companiesHtml || '<span style="color:var(--text-tertiary);font-size:0.75rem">No companies recorded</span>'}
        </div>
    `;

    document.body.appendChild(popover);
    activePopover = popover;

    if (window.innerWidth <= 600) {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
        popover.style.width = 'calc(100vw - 32px)';
        popover.style.maxWidth = '280px';
    } else {
        const rect = triggerBtn.getBoundingClientRect();
        let top = rect.top;
        let left = rect.right + 8;

        if (left + 260 > window.innerWidth) left = rect.left - 265;
        if (left < 10) left = 10;
        if (top + 180 > window.innerHeight) top = window.innerHeight - 190;
        if (top < 10) top = 10;

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
}

// tracker table render
function renderTrackerTable() {
    const tbody = document.getElementById('problems-tbody');
    const diffEl = document.getElementById('difficulty-select');
    const diff = diffEl ? diffEl.value : 'all';
    const searchEl = document.getElementById('search-input');
    const search = searchEl ? searchEl.value.toLowerCase().trim() : '';

    tbody.innerHTML = '';

    const filtered = PROBLEMS.filter(p => {
        const status = tracker[p.id]?.status || 'todo';
        if (activeFilter !== 'all' && status !== activeFilter) return false;
        if (diff !== 'all' && p.difficulty !== diff) return false;
        if (search) {
            const q = search;
            const matchesId = String(p.id).includes(q);
            const matchesName = p.name.toLowerCase().includes(q);
            const matchesTopic = (p.topic || '').toLowerCase().includes(q);
            const matchesPattern = (p.pattern || '').toLowerCase().includes(q);
            const matchesCompany = p.companies && p.companies.some(c => c.toLowerCase().includes(q));
            if (!matchesId && !matchesName && !matchesTopic && !matchesPattern && !matchesCompany) return false;
        }
        return true;
    });

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-secondary);font-size:0.88rem;">No problems found.</td></tr>`;
        return;
    }

    const grouped = {};
    filtered.forEach(p => {
        const key = p.pattern || p.topic || 'Other';
        (grouped[key] = grouped[key] || []).push(p);
    });

    Object.keys(grouped).forEach(topic => {
        const htr = document.createElement('tr');
        htr.className = 'topic-row';
        htr.innerHTML = `<td colspan="5">${toTitleCase(topic)}</td>`;
        tbody.appendChild(htr);

        grouped[topic].forEach(p => {
            const status = tracker[p.id]?.status || 'todo';
            const lcHref = p.leetcode_url || p.leetcode || `https://leetcode.com/problems/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}/`;
            const mdHref = p.markdown ? `#note-${p.markdown.replace(/^(notes|docs)\//, '')}` : `#problem-${p.id}`;

            const tr = document.createElement('tr');

            let statusIcon = '';
            if (status === 'solved') statusIcon = '<i class="fa-solid fa-check"></i>';
            else if (status === 'progress') statusIcon = '<i class="fa-solid fa-minus"></i>';

            let companiesHtml = '<span style="color:var(--text-tertiary)">—</span>';
            if (p.companies && p.companies.length > 0) {
                companiesHtml = `
                    <button class="companies-btn" data-id="${p.id}" aria-label="${p.companies.length} Companies">
                        <i class="fa-solid fa-building"></i>
                    </button>`;
            }

            tr.innerHTML = `
                <td style="text-align:center;width:36px;">
                    <button class="status-cb-btn ${status}" data-id="${p.id}" aria-label="Status: ${status}">
                        ${statusIcon}
                    </button>
                </td>
                <td class="td-problem">
                    <a href="${lcHref}" target="_blank" rel="noopener noreferrer" class="problem-link">${p.id}. ${escapeHtml(p.name)}</a>
                </td>
                <td style="text-align:center;width:48px;">
                    <span class="diff-circle ${p.difficulty.toLowerCase()}"></span>
                </td>
                <td style="text-align:center;width:68px;">
                    ${companiesHtml}
                </td>
                <td style="text-align:center;width:52px;">
                    <a href="${mdHref}" class="solution-btn" aria-label="View solution notes">
                        <i class="fa-regular fa-file-lines"></i>
                    </a>
                </td>`;

            const statusBtn = tr.querySelector('.status-cb-btn');
            if (statusBtn) {
                statusBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openStatusPopover(statusBtn, p.id);
                });
            }

            const compBtn = tr.querySelector('.companies-btn');
            if (compBtn) {
                compBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openCompaniesPopover(compBtn, p);
                });
            }

            tbody.appendChild(tr);
        });
    });
}

function wrapTables(container) {
    container.querySelectorAll('table').forEach(t => {
        if (t.parentElement?.classList.contains('table-scroll-wrap')) return;
        const w = document.createElement('div');
        w.className = 'table-scroll-wrap';
        t.parentNode.insertBefore(w, t);
        w.appendChild(t);
    });
}

// reveal floating controls on hover / scroll
function setupHeaderHoverReveal() {
    const zone = document.querySelector('.header-trigger-zone');
    if (!zone) return;
    document.addEventListener('mousemove', (e) => {
        if (e.clientY <= 72) {
            zone.classList.add('hovered');
        } else {
            zone.classList.remove('hovered');
        }
    });
}

function setupMobileScrollReveal() {
    const zone = document.querySelector('.header-trigger-zone');
    if (!zone) return;
    let timer;
    const onScroll = () => {
        if (window.innerWidth > 768) return;
        zone.classList.add('mobile-visible');
        clearTimeout(timer);
        timer = setTimeout(() => zone.classList.remove('mobile-visible'), 1500);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const modal = document.getElementById('tracker-modal');
    if (modal) modal.addEventListener('scroll', onScroll, { passive: true });
}