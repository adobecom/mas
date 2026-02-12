document.addEventListener('mas:failed', (event) => {
    const originalTarget = event.composedPath()[0];
    if (originalTarget.matches?.('span[is="inline-price"]')) {
        originalTarget.innerHTML = `
            <sp-icon-alert class="price-error-icon"></sp-icon-alert>
            <div class="price-error-content">
                <span class="price-error-title">Price unavailable</span>
            </div>
        `;
    }
});
