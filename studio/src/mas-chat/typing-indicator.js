import { html } from 'lit';

/** The glowing three-dot bubble shown while a reply is on its way; chat.css styles it in the light DOM. */
export const typingIndicator = html`<div class="typing-indicator">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
</div>`;
