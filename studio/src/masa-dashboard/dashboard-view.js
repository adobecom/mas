import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/action-group/sp-action-group.js';
import '@spectrum-web-components/status-light/sp-status-light.js';

const format = (value) =>
    value === null ? '—' : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, notation: 'compact' }).format(value);
const percent = (value) =>
    value === null ? '—' : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(value);
const seconds = (value) => (value === null ? '—' : `${format(value / 1000)} s`);
const entries = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1]);
const breakdown = (counts) =>
    entries(counts)
        .map(([name, count]) => `${name}: ${format(count)}`)
        .join(' · ') || '—';

function metric([label, value, note]) {
    return html`<article class="metric">
        <h3>${label}</h3>
        <strong>${value}</strong>
        <p>${note}</p>
    </article>`;
}

function dataTable(title, headings, rows) {
    return html`<section class="panel">
        <h2>${title}</h2>
        ${rows.length
            ? html`<div class="table-scroll" tabindex="0" role="region" aria-label=${title}>
                  <table>
                      <thead>
                          <tr>
                              ${headings.map((heading) => html`<th scope="col">${heading}</th>`)}
                          </tr>
                      </thead>
                      <tbody>
                          ${rows.map(
                              (row) =>
                                  html`<tr>
                                      ${row.map((cell) => html`<td>${cell}</td>`)}
                                  </tr>`,
                          )}
                      </tbody>
                  </table>
              </div>`
            : html`<p class="muted">Nothing recorded in this window.</p>`}
    </section>`;
}

function countPanel(title, counts) {
    const rows = entries(counts);
    const max = Math.max(1, ...rows.map(([, count]) => count));
    return html`<section class="panel">
        <h2>${title}</h2>
        ${rows.length
            ? html`<ul class="counts">
                  ${rows.map(
                      ([name, count]) =>
                          html`<li>
                              <span class="count-label">${name}</span><strong>${format(count)}</strong>
                              <span class="track" aria-hidden="true"
                                  ><span style=${styleMap({ width: `${(100 * count) / max}%` })}></span
                              ></span>
                          </li>`,
                  )}
              </ul>`
            : html`<p class="muted">Nothing recorded in this window.</p>`}
    </section>`;
}

function dailyChart(title, rows, key) {
    const max = Math.max(1, ...rows.map((row) => row[key]));
    return html`<section class="panel">
        <h2>${title}</h2>
        <p class="muted">UTC dates · first and last day may be partial</p>
        <div class="chart" role="list" aria-label=${title}>
            ${rows.map(
                (row) =>
                    html`<div
                        role="listitem"
                        class="column"
                        tabindex="0"
                        aria-label=${`${row.day}: ${row[key]}`}
                        title=${`${row.day}: ${row[key]}`}
                    >
                        <span class="bar" style=${styleMap({ height: `${(100 * row[key]) / max}%` })}></span>
                        <span class="chart-tooltip">${row.day}<br />${format(row[key])}</span>
                    </div>`,
            )}
        </div>
        <div class="axis"><span>${rows[0]?.day}</span><span>Peak ${format(max)}</span><span>${rows.at(-1)?.day}</span></div>
    </section>`;
}

/** Presents aggregate metrics independently of Studio authentication and snapshot transport. */
export class MasaDashboardView extends LitElement {
    static properties = {
        snapshot: { attribute: false },
        days: { type: Number },
        now: { type: Number },
    };

    static styles = css`
        :host {
            display: block;
            color: var(--spectrum-gray-900, #222);
            font: 14px/1.5 var(--spectrum-font-family, Arial, sans-serif);
        }
        * {
            box-sizing: border-box;
        }
        h2,
        h3,
        p {
            margin: 0;
        }
        h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
        }
        h3 {
            font-size: 13px;
            font-weight: 500;
        }
        .muted,
        .metric p,
        .axis {
            color: var(--spectrum-gray-700, #595959);
        }
        .controls {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
        }
        .freshness p {
            font-size: 12px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .metric,
        .panel {
            background: var(--spectrum-gray-50, #fff);
            border: 1px solid var(--spectrum-gray-200, #e5e5e5);
            border-radius: 12px;
            padding: 20px;
            min-width: 0;
        }
        .metric strong {
            display: block;
            font-size: 30px;
            font-weight: 700;
            margin: 6px 0;
            font-variant-numeric: tabular-nums;
        }
        .metric p {
            font-size: 12px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .section-title + .muted {
            margin-bottom: 16px;
        }
        .panel > .muted {
            font-size: 12px;
            margin: -4px 0 16px;
        }
        .section-title {
            margin: 32px 0 16px;
            font-size: 20px;
        }
        .panel {
            margin-bottom: 16px;
        }
        .grid .panel {
            margin-bottom: 0;
        }
        table {
            min-width: 640px;
            border-collapse: collapse;
            width: 100%;
            font-size: 13px;
            font-variant-numeric: tabular-nums;
        }
        th,
        td {
            text-align: left;
            padding: 12px 14px;
            border-bottom: 1px solid var(--spectrum-gray-200, #e5e5e5);
            vertical-align: top;
        }
        th {
            font-weight: 600;
            white-space: nowrap;
            color: var(--spectrum-gray-700, #595959);
        }
        td {
            overflow-wrap: anywhere;
        }
        td:first-child {
            white-space: nowrap;
        }
        tr:last-child td {
            border-bottom: 0;
        }
        th:first-child,
        td:first-child {
            padding-left: 0;
        }
        .table-scroll {
            overflow-x: auto;
        }
        .counts {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: 14px;
        }
        .counts li {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 6px 16px;
            font-size: 13px;
        }
        .count-label {
            overflow-wrap: anywhere;
        }
        .track {
            grid-column: 1 / -1;
            height: 6px;
            border-radius: 4px;
            background: var(--spectrum-gray-100, #f5f5f5);
            overflow: hidden;
        }
        .track span {
            display: block;
            height: 100%;
            background: var(--spectrum-blue-700, #1473e6);
            border-radius: 4px;
        }
        .chart {
            height: 128px;
            display: flex;
            gap: 5px;
            align-items: end;
            margin-top: 28px;
        }
        .column {
            flex: 1;
            min-width: 0;
            height: 100%;
            display: flex;
            align-items: end;
            position: relative;
        }
        .bar {
            display: block;
            width: 100%;
            background: var(--spectrum-blue-700, #1473e6);
            border-radius: 4px 4px 0 0;
        }
        .chart-tooltip {
            display: none;
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: var(--spectrum-gray-900, #222);
            color: var(--spectrum-gray-50, #fff);
            padding: 6px;
            border-radius: 4px;
            white-space: nowrap;
            font-size: 12px;
            z-index: 1;
        }
        .column:hover .chart-tooltip,
        .column:focus-visible .chart-tooltip {
            display: block;
        }
        .axis {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-top: 8px;
        }
        .empty {
            padding: 24px;
            margin-bottom: 24px;
            border: 1px dashed var(--spectrum-gray-400, #bcbcbc);
            border-radius: 12px;
        }
        details > summary {
            cursor: pointer;
            font-weight: 600;
            padding: 16px 0;
        }
        @media (max-width: 900px) {
            .metrics {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }
        @media (max-width: 560px) {
            .grid {
                grid-template-columns: 1fr;
            }
            .metric,
            .panel {
                padding: 16px;
            }
            .metrics {
                gap: 10px;
            }
            .metric strong {
                font-size: 24px;
            }
        }
    `;

    constructor() {
        super();
        this.snapshot = null;
        this.days = 7;
        this.now = Date.now();
    }

    get data() {
        return this.snapshot.windows[this.days];
    }

    get controlsTemplate() {
        const age = Math.max(0, this.now - Date.parse(this.snapshot.generatedAt));
        const stale = age >= 600000;
        return html`<div class="controls">
            <sp-action-group selects="single" label="Time window">
                ${[1, 7, 30].map(
                    (days) =>
                        html`<sp-action-button
                            ?selected=${days === this.days}
                            aria-pressed=${days === this.days}
                            @click=${() => {
                                this.days = days;
                            }}
                            >${days === 1 ? '24 hours' : `${days} days`}</sp-action-button
                        >`,
                )}
            </sp-action-group>
            <div class="freshness" role="status">
                <sp-status-light variant=${stale ? 'notice' : 'positive'}
                    >${stale ? 'Snapshot is stale' : 'Snapshot up to date'}</sp-status-light
                >
                <p>Updated ${new Date(this.snapshot.generatedAt).toLocaleString()} · ${Math.floor(age / 60000)} min ago</p>
            </div>
        </div>`;
    }

    get summaryTemplate() {
        const { summary: s, learning, queue } = this.data;
        return html`<div class="metrics">
            ${[
                ['Questions', format(s.questions), `${format(s.requesters)} people · ${format(s.jobs)} total jobs`],
                [
                    'Answers returned',
                    percent(s.answeredShare),
                    `${format(s.outcomesRecorded)} recorded outcomes · not a resolution score`,
                ],
                [
                    'Median response time',
                    seconds(s.wallMsP50),
                    `90th percentile ${seconds(s.wallMsP90)} · 95th ${seconds(s.wallMsP95)}`,
                ],
                [
                    'Total tokens',
                    format(s.promptTokens + s.completionTokens),
                    `${format(s.promptTokens)} prompt · ${format(s.completionTokens)} output`,
                ],
                [
                    'Outcome coverage',
                    percent(learning.labelledShare),
                    `${format(learning.labelled)} of ${format(learning.recorded)} answers labelled`,
                ],
                [
                    'Queue at snapshot',
                    format(queue.queued),
                    `${format(queue.running)} running · oldest wait ${seconds(queue.oldestQueuedAgeMs)}`,
                ],
                ['Prompt cache share', percent(s.cachedShare), 'Share of prompt tokens served from cache'],
                ['Prompt tokens / job', format(s.promptTokensPerJobMean), `90th percentile ${format(s.promptTokensPerJobP90)}`],
            ].map(metric)}
        </div>`;
    }

    get usageTemplate() {
        return html`<div class="grid">
            ${dailyChart('Jobs per day', this.data.daily, 'jobs')}
            ${dailyChart('Prompt tokens per day', this.data.daily, 'promptTokens')}
        </div>`;
    }

    get qualityTemplate() {
        const { outcomes, learning } = this.data;
        return html`<h2 class="section-title">Outcomes & reliability</h2>
            <p class="muted">Labels come from reactions, retries and review. Unlabelled answers have no confirmed outcome.</p>
            <div class="grid">
                ${countPanel('Job outcomes', outcomes.kinds)}${countPanel('Outcome labels', learning.outcomes)}
                ${countPanel('Answer types', outcomes.answerTypes)}${countPanel(
                    'Confidence reported by MASA',
                    outcomes.confidence,
                )}
            </div>
            ${dataTable(
                'Answer vs troubleshoot',
                ['Intent', 'Questions', 'Answered', 'Median time', 'p90 time', 'Mean rounds', 'Mean prompt tokens'],
                this.data.intents.rows
                    .filter((row) => row.questions)
                    .map((row) => [
                        row.intent,
                        format(row.questions),
                        percent(row.answeredShare),
                        seconds(row.wallMsP50),
                        seconds(row.wallMsP90),
                        format(row.roundsMean),
                        format(row.promptTokensMean),
                    ]),
            )}
            ${this.data.intents.unlabelled
                ? html`<p class="muted">${format(this.data.intents.unlabelled)} outcomes have no intent label.</p>`
                : nothing}`;
    }

    get diagnosticsTemplate() {
        const { model, summary, probes, outcomes } = this.data;
        return html`<h2 class="section-title">Model & tools</h2>
            <div class="metrics">
                ${[
                    ['Model latency', seconds(model.durationMsP50), `Successful calls · p95 ${seconds(model.durationMsP95)}`],
                    ['Model errors', format(model.errors), `Of ${format(model.calls)} calls`],
                    ['Rate limited', format(model.rateLimited), 'Model calls receiving HTTP 429'],
                    [
                        'Wait before model',
                        seconds(summary.queueWaitDerived.p50Ms),
                        `Includes preparation · ${format(summary.queueWaitDerived.jobs)} jobs`,
                    ],
                ].map(metric)}
            </div>
            ${dataTable(
                'Tool performance',
                ['Tool', 'Calls', 'OK', 'Other results', 'Mean', 'p90'],
                probes.map((probe) => [
                    probe.probe,
                    format(probe.calls),
                    percent(probe.okShare),
                    breakdown(Object.fromEntries(entries(probe.statuses).filter(([name]) => name !== 'ok'))),
                    seconds(probe.meanMs),
                    seconds(probe.p90Ms),
                ]),
            )}
            <details>
                <summary>Diagnostic details</summary>
                <div class="grid">
                    ${countPanel('Repairs', outcomes.repairCauses)}${countPanel('Fallback causes', outcomes.fallbackCauses)}
                    ${countPanel('Downgrades', outcomes.downgradeCauses)}${countPanel('Diagnosed layers', outcomes.layers)}
                    ${countPanel('Intent signals', this.data.intents.signals)}${countPanel(
                        'Model finish reasons',
                        model.finishReasons,
                    )}
                    ${countPanel('Label sources', this.data.learning.sources)}${countPanel('Job statuses', summary.jobStatuses)}
                </div>
                ${dataTable(
                    'Served models',
                    ['Model', 'Successful calls'],
                    entries(model.servedModels).map(([name, count]) => [name, format(count)]),
                )}
                ${dataTable(
                    'Rejected tool calls',
                    ['Reason / tool', 'Calls'],
                    this.data.rejections.map((row) => [row.key, format(row.count)]),
                )}
                ${dataTable(
                    'Highest prompt-token jobs',
                    ['Job ID', 'Model calls', 'Prompt tokens', 'Output tokens', 'Outcome', 'Tools'],
                    this.data.costliest.map((job) => [
                        job.jobId,
                        format(job.modelCalls),
                        format(job.promptTokens),
                        format(job.completionTokens),
                        job.outcome ?? '—',
                        job.probes.join(', ') || '—',
                    ]),
                )}
            </details>`;
    }

    render() {
        if (!this.snapshot) return nothing;
        return html`${this.controlsTemplate}
        ${this.data.summary.jobs === 0
            ? html`<div class="empty">
                  <h2>No activity in this window</h2>
                  <p>Choose a longer window or check back after MASA answers a question.</p>
              </div>`
            : nothing}
        ${this.summaryTemplate}${this.usageTemplate}${this.qualityTemplate}${this.diagnosticsTemplate}`;
    }
}

customElements.define('masa-dashboard-view', MasaDashboardView);
