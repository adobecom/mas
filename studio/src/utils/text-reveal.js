const CHARS_PER_FRAME = 30;

export function revealText(container) {
    return new Promise((resolve) => {
        const fullHTML = container.innerHTML;
        if (!fullHTML) {
            resolve();
            return;
        }

        container.innerHTML = '';
        let charIndex = 0;

        function nextFrame() {
            if (charIndex >= fullHTML.length) {
                container.innerHTML = fullHTML;
                resolve();
                return;
            }

            let end = charIndex + CHARS_PER_FRAME;

            while (end < fullHTML.length) {
                if (fullHTML[end] === '<') break;
                if (fullHTML[end] === '&') break;
                end++;
                if (end - charIndex > CHARS_PER_FRAME * 2) break;
            }

            if (end < fullHTML.length && fullHTML[end] === '<') {
                const closeIndex = fullHTML.indexOf('>', end);
                if (closeIndex !== -1) end = closeIndex + 1;
            }

            if (end < fullHTML.length && fullHTML[end] === '&') {
                const semiIndex = fullHTML.indexOf(';', end);
                if (semiIndex !== -1) end = semiIndex + 1;
            }

            charIndex = end;

            const partial = fullHTML.substring(0, charIndex);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = partial;
            container.innerHTML = tempDiv.innerHTML;

            requestAnimationFrame(nextFrame);
        }

        requestAnimationFrame(nextFrame);
    });
}
