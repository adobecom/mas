function normalizePath(path) {
    if (!path) return '/';
    const pathname = path.startsWith('http') ? new URL(path).pathname : path;
    const stripped = pathname.split('#')[0].split('?')[0];
    if (stripped.length > 1 && stripped.endsWith('/')) return stripped.slice(0, -1);
    return stripped;
}

function humanize(segment) {
    return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function createNode(path, title) {
    return {
        path,
        title,
        children: new Map(),
    };
}

function toFolderPath(path) {
    if (path === '/') return path;
    return path.endsWith('/') ? path : `${path}/`;
}

function buildTree(data) {
    const docsRoot = createNode('/docs', 'Docs');
    const filtered = data
        .map((entry) => ({
            ...entry,
            path: normalizePath(entry.path),
        }))
        .filter((entry) => entry.path === '/docs' || entry.path.startsWith('/docs/'));

    filtered.forEach((entry) => {
        const segments = entry.path
            .replace(/^\/docs\/?/, '')
            .split('/')
            .filter(Boolean);

        if (!segments.length) {
            docsRoot.title = entry.title || docsRoot.title;
            return;
        }

        let current = docsRoot;
        let currentPath = '/docs';

        segments.forEach((segment, index) => {
            currentPath = `${currentPath}/${segment}`;
            if (!current.children.has(segment)) {
                current.children.set(segment, createNode(toFolderPath(currentPath), humanize(segment)));
            }

            const node = current.children.get(segment);
            if (index === segments.length - 1) {
                node.title = entry.title || node.title;
                node.path = entry.path;
            }

            current = node;
        });
    });

    return docsRoot;
}

function sortNodes(node) {
    const entries = [...node.children.entries()].sort((a, b) => a[1].title.localeCompare(b[1].title));
    node.children = new Map(entries);
    node.children.forEach((child) => sortNodes(child));
}

function renderBranch(node, currentPath) {
    const ul = document.createElement('ul');

    node.children.forEach((child) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        const normalizedChildPath = normalizePath(child.path);
        const inPath = currentPath === normalizedChildPath || currentPath.startsWith(`${normalizedChildPath}/`);
        const hasChildren = child.children.size > 0;
        const href = hasChildren ? toFolderPath(normalizedChildPath) : child.path;

        link.textContent = child.title;
        link.href = href;
        if (currentPath === child.path) {
            link.setAttribute('aria-current', 'page');
        }

        li.append(link);

        if (hasChildren) {
            const button = document.createElement('button');
            button.className = 'sidenav-toggle';
            button.type = 'button';
            button.setAttribute('aria-label', `Expand ${child.title}`);
            button.setAttribute('aria-expanded', inPath ? 'true' : 'false');
            button.textContent = '▸';

            const branch = renderBranch(child, currentPath);
            branch.classList.add('sidenav-branch');
            if (inPath) {
                li.classList.add('is-open');
            }

            button.addEventListener('click', () => {
                const isOpen = li.classList.toggle('is-open');
                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            li.append(button, branch);
        }

        ul.append(li);
    });

    return ul;
}

async function fetchIndexData() {
    const response = await fetch('/query-index.json');
    if (!response.ok) throw new Error('Could not fetch query index');
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.data)) return [];
    return payload.data;
}

export default async function decorate(block) {
    const currentPath = normalizePath(window.location.pathname);
    const title = document.createElement('a');
    const studioButton = document.createElement('a');
    title.className = 'sidenav-title';
    title.href = '/docs/';
    title.textContent = 'Docs';
    studioButton.className = 'sidenav-studio-button';
    studioButton.href = '/studio.html';
    studioButton.textContent = 'To studio';
    block.append(title);

    try {
        const data = await fetchIndexData();
        const tree = buildTree(data);
        sortNodes(tree);

        title.textContent = tree.title || 'Docs';
        block.append(renderBranch(tree, currentPath));
    } catch (e) {
        const message = document.createElement('p');
        message.className = 'sidenav-error';
        message.textContent = 'Navigation is unavailable.';
        block.append(message);
    }

    block.append(studioButton);
}
