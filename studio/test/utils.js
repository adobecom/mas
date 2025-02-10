import { NodeSelection, TextSelection } from 'prosemirror-state';

window.toggleTheme = () => {
    const theme = document.querySelector('sp-theme');
    theme.color = theme.color === 'dark' ? 'light' : 'dark';
};

export const getTemplateContent = (template) => {
    const templateEl = document.getElementById(template);
    // @ts-ignore
    const templateContent = templateEl.content.cloneNode(true);
    return [...templateContent.children];
};

export const delay = (ms = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export function spTheme() {
    const theme = document.createElement('sp-theme');
    theme.color = 'light';
    theme.scale = 'medium';
    return theme;
}

export async function createFromTemplate(id, testName) {
    const [element] = getTemplateContent(id);
    const div = document.createElement('div');
    div.innerHTML = `<h2>${testName}</h2>`;
    div.append(element);
    document.querySelector('sp-theme').append(div);
    // add header to element.
    await element.updateComplete;
    return element;
}

const calculateCoordinates = (element, offsetX, offsetY) => {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + (offsetX ?? rect.width / 2),
        y: rect.top + (offsetY ?? rect.height / 2),
        rect,
    };
};

const dispatchMouseEvent = (element, eventType, clientX, clientY) => {
    const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
    });
    element.dispatchEvent(event);
};

const setCursorPosition = (element, offsetX, rect) => {
    if (!element.isContentEditable) return;

    const textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    const charIndex = Math.floor(
        (offsetX / rect.width) * textNode.textContent.length,
    );

    const range = document.createRange();
    const selection = window.getSelection();

    range.setStart(textNode, charIndex);
    range.setEnd(textNode, charIndex);
    selection.removeAllRanges();
    selection.addRange(range);
};

export async function simulateClick(element, offsetX, offsetY) {
    if (!element) {
        throw new Error('Element must be provided.');
    }

    const { x, y, rect } = calculateCoordinates(element, offsetX, offsetY);
    dispatchMouseEvent(element, 'click', x, y);
    setCursorPosition(element, offsetX ?? rect.width / 2, rect);
    await delay(500);
}

export function selectWordsInTextNode(view, words) {
    const { state } = view;
    const { doc } = state;
    const regex = new RegExp(words, 'gi');
    let foundSelection = false;

    // Function to process text nodes
    doc.descendants((node, pos) => {
        if (foundSelection || node.type.name !== 'text') return;

        const text = node.text;
        let match;

        // Find all occurrences of any word
        while ((match = regex.exec(text)) !== null) {
            // Create a ProseMirror selection
            const from = pos + match.index;
            const to = from + match[0].length;

            // Create and dispatch the transaction with the new selection
            const selection = TextSelection.create(doc, from, to);
            const tr = state.tr.setSelection(selection);

            view.dispatch(tr);
            foundSelection = true;
            break; // Stop after first match - remove if you want to handle multiple selections
        }
    });

    return foundSelection;
}

export function selectNodeAtPos(view, pos) {
    const { state } = view;
    const resolvedPos = state.doc.resolve(pos);
    const selection = NodeSelection.create(state.doc, resolvedPos.pos);
    const tr = state.tr.setSelection(selection);
    view.dispatch(tr);
    return [selection.node, selection];
}

export function applyChanges(view, pos, attrs) {
    const { state, dispatch } = view;
    const tr = state.tr;
    tr.setNodeMarkup(pos, null, attrs);
    dispatch(tr);
}

export function triggerInput(element, value) {
    element.value = value;
    element.dispatchEvent(
        new Event('input', { bubbles: true, composed: true }),
    );
}

export function initElementFromTemplate(templateId, title) {
    const spTheme = document.querySelector('sp-theme');
    const [root] = getTemplateContent(templateId);
    if (title) {
        const container = document.createElement('div');
        const header = document.createElement('h3');
        header.textContent = title;
        container.append(header, root);
        spTheme.append(container);
    } else {
        spTheme.append(root);
    }
    return root;
}

export function mockFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function (args) {
        const { pathname } = new URL(args);
        if (/querybuilder.json/.test(pathname)) {
            return originalFetch('/test/mocks/tags.json');
        }
        if (/mas.json/.test(pathname)) {
            return originalFetch('/test/mocks/folders/default.json');
        }
        if (/search/.test(pathname)) {
            return originalFetch(
                '/test/mocks/sites/cf/fragments/search/default.json',
            );
        }
        if (/user-groups/.test(pathname)) {
            return originalFetch('/test/mocks/users.json');
        }
        return originalFetch(...arguments);
    };
    return originalFetch;
}
