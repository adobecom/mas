import sessionManager from '../services/chat-session-manager.js';
import { MasaClient, MasaClientError } from './masa-client.js';

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 5000000;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const isRunning = (record) => ['queued', 'running'].includes(record.status);

const sessions = new Map();
const retryable = (error) => [0, 429, 502, 503, 504].includes(error.status);
/** MASA asks for a check every 3 seconds while it answers; the session ticks at the same pace. */
const POLL_SECONDS = 3;
/** Ticks already space checks; only a longer Retry-After needs its own wait. */
const nextPoll = (now, retryAfter) => (retryAfter > POLL_SECONDS ? now + retryAfter * 1000 : 0);

/** Persist text and opaque control IDs only; files, grants, URLs and resumable upload bodies stay in memory. */
export function investigationHistory(records) {
    return records.map(({ id, sessionId, question, text, status, files, followUps }) => ({
        id,
        sessionId,
        question,
        text,
        status,
        files: files.map(({ name }) => ({ name })),
        followUps: followUps ?? [],
    }));
}

const SENTENCE_END = /[.!?…)"'\]]$/;
const LOWERCASE_OPENERS = new Set([
    'a',
    'an',
    'the',
    'one',
    'your',
    'which',
    'where',
    'whether',
    'what',
    'how',
    'if',
    'any',
    'either',
]);

/** Same rule as the MASA Slack reply: end a line of prose with a full stop unless it already ends one. */
const asSentence = (text) => {
    const trimmed = String(text).trim();
    return SENTENCE_END.test(trimmed) ? trimmed : `${trimmed}.`;
};

/** An ask names the thing needed, so after "I need" an opener like "A" or "The" loses its capital; names keep it. */
const leadIn = (text) => {
    const trimmed = String(text).trim();
    const [first = ''] = trimmed.split(/\s+/, 1);
    return LOWERCASE_OPENERS.has(first.toLowerCase()) && /^[A-Z][a-z]*$/.test(first)
        ? `${first.toLowerCase()}${trimmed.slice(first.length)}`
        : trimmed;
};

const documentBlocks = (answer) => [
    `**${answer.title}**`,
    answer.summary,
    ...(answer.sections ?? []).map(({ heading, body }) => `**${heading}**\n\n${String(body).trim()}`),
    answer.gaps?.length && ['**Check before publishing:**', ...answer.gaps.map((gap) => `- ${gap}`)].join('\n'),
];

const bodyBlocks = (answer) => {
    const points = answer.points ?? [];
    const steps = answer.steps ?? [];
    const folded = [...(points.length === 1 ? points : []), ...(steps.length === 1 && points.length <= 1 ? steps : [])];
    const asks = (answer.asks ?? []).map((ask) => asSentence(leadIn(ask.text)));
    const nextCheck = answer.nextCheck ?? answer.next_check;
    return [
        folded.length ? [answer.answer, ...folded].map(asSentence).join(' ') : answer.answer,
        points.length > 1 && points.map((point) => `- ${point}`).join('\n'),
        steps.length === 1 && points.length > 1 && asSentence(steps[0]),
        steps.length > 1 && steps.map((step, index) => `${index + 1}. ${step}`).join('\n'),
        nextCheck && `**Next check:** ${nextCheck}`,
        asks.length === 1 && `To check this, I need ${asks[0]}`,
        asks.length > 1 && ['To check this, I need:', ...asks.map((ask) => `- ${ask}`)].join('\n'),
    ];
};

/**
 * Render structured MASA findings as Markdown laid out the way the MASA Slack reply is.
 * Evidence, the deciding source line, layer, verdict and confidence stay out: they are MASA's proof, not the reply.
 */
export function findingText(result) {
    if (!result) return '';
    if (result.withheld) return 'MASA could not share this finding with this audience.';
    const answer = result.answer;
    if (!answer) return 'No final finding is available.';
    if (answer.type === 'decline') return 'MASA can investigate Merch at Scale questions only.';
    if (answer.type === 'clarify') return answer.question ?? '';
    return [
        ...(answer.type === 'document' ? documentBlocks(answer) : bodyBlocks(answer)),
        result.budgetExhausted && `_Partial finding: ${result.budgetExhaustedBy ?? 'investigation'} budget reached._`,
    ]
        .filter(Boolean)
        .join('\n\n');
}

/** Own one conversation's active lease and requests independently of a mounted drawer or browser tab visibility. */
export class InvestigationSession extends EventTarget {
    constructor({ conversationId, client = new MasaClient(), history = [], state = {}, save = () => {}, now = Date.now }) {
        super();
        this.conversationId = conversationId;
        this.client = client;
        this.records = investigationHistory(history);
        this.save = save;
        this.now = now;
        this.session = null;
        this.restoreId = state.sessionId;
        this.createKey = state.createKey;
        this.pending = state.pending ? this.submissionFields(state.pending) : null;
        this.images = [];
        this.uploads = [];
        this.uploadChain = Promise.resolve();
        this.downloads = new Map();
        this.error = null;
        this.busy = false;
        this.ending = false;
        this.retryAt = 0;
        this.pollAfter = 0;
        this.renewedAt = 0;
        this.epoch = 0;
        this.foreground = 0;
        this.onVisibilityChange = () => void this.tick();
    }

    /** A lease MASA has not confirmed ended; only these are resumed after reload or revoked on end. */
    get leaseId() {
        return this.session?.status === 'ended' ? null : this.session?.id;
    }

    /** True while a submission is in flight or any job is queued or running. */
    get isBusy() {
        return Boolean(this.pending) || this.records.some(isRunning);
    }

    /** True while perform() would skip a task: another task runs, the session is ending, or MASA asked Studio to wait. */
    get blocked() {
        return this.busy || this.ending || this.now() < this.retryAt;
    }

    notify() {
        this.save(investigationHistory(this.records), {
            sessionId: this.leaseId ?? this.restoreId,
            createKey: this.createKey,
            pending: this.pending ? this.submissionFields(this.pending) : null,
        });
        this.dispatchEvent(new Event('change'));
    }

    async perform(task) {
        if (this.blocked) return;
        this.busy = true;
        this.error = null;
        this.notify();
        this.inFlight = (async () => {
            try {
                await task();
            } catch (error) {
                if (!(error instanceof MasaClientError)) throw error;
                this.fail(error);
            } finally {
                this.busy = false;
                this.notify();
            }
        })();
        await this.inFlight;
    }

    fail(error) {
        this.error = error;
        this.retryAt = this.now() + error.retryAfter * 1000;
        const closedSession = ['session-unavailable', 'session-expired', 'session-ended', 'session-scope-changed'].includes(
            error.code,
        );
        if (closedSession || [401, 403].includes(error.status)) this.clearMedia();
        if (closedSession) {
            this.session = { ...this.session, status: 'expired' };
            this.pending = null;
            for (const record of this.records.filter(isRunning)) record.status = 'interrupted';
        }
    }

    applySession(session) {
        this.session = session;
        this.restoreId = null;
        clearTimeout(this.expiryTimer);
        if (session.status !== 'active' || Date.parse(session.expiresAt) <= this.now()) this.expire();
        else this.expiryTimer = setTimeout(() => this.expire(), Date.parse(session.expiresAt) - this.now());
    }

    expire() {
        this.clearMedia();
        this.pending = null;
        if (this.session) this.session = { ...this.session, status: this.session.status === 'ended' ? 'ended' : 'expired' };
        this.notify();
    }

    clearMedia() {
        for (const image of this.images) URL.revokeObjectURL(image.preview);
        for (const item of this.downloads.values()) URL.revokeObjectURL(item.url);
        this.images = [];
        this.downloads.clear();
        this.uploadIntent = null;
        for (const record of this.records) {
            record.artifacts = [];
            record.files = record.files.map(({ name }) => ({ name }));
        }
    }

    async ensureSession() {
        if (this.restoreId) await this.restore();
        if (this.session?.status === 'active') return this.session;
        this.createKey ??= crypto.randomUUID();
        this.notify();
        try {
            return await this.createSession();
        } catch (error) {
            // MASA allows two sessions per person; another conversation's unused lease may hold one of them.
            if (error.code !== 'session-capacity' || !(await endIdleSessions(this.conversationId))) throw error;
            return this.createSession();
        }
    }

    async createSession() {
        try {
            const { result } = await this.client.control(this.conversationId, 'session.create', {
                idempotencyKey: this.createKey,
            });
            this.applySession(result);
            this.createKey = null;
            this.renewedAt = this.now();
            return result;
        } catch (error) {
            if (error instanceof MasaClientError && !retryable(error)) this.createKey = null;
            throw error;
        }
    }

    async restore() {
        const sessionId = this.restoreId;
        try {
            this.applySession((await this.client.control(this.conversationId, 'session.get', { sessionId })).result);
        } catch (error) {
            if (!(error instanceof MasaClientError) || ![404, 410].includes(error.status)) throw error;
            this.restoreId = null;
            this.session = { id: sessionId, status: 'expired' };
            this.pending = null;
            this.expire();
            for (const record of this.records.filter(isRunning)) record.status = 'interrupted';
        }
        this.notify();
    }

    imageRejection(file) {
        if (this.images.length + this.uploads.length >= MAX_IMAGES) return `You can attach up to ${MAX_IMAGES} images.`;
        if (!IMAGE_TYPES.includes(file.type) || file.size < 1) return 'Only PNG, JPEG, GIF or WebP images can be attached.';
        if (file.size > MAX_IMAGE_BYTES) return `Images must be ${MAX_IMAGE_BYTES / 1000000} MB or smaller.`;
        return null;
    }

    /**
     * Uploads run one at a time; those waiting or running count toward the image limit and show as uploading.
     * Resolves with the error for a file refused up front, since a running upload may clear `error` meanwhile.
     */
    async addImage(file) {
        const rejection = this.imageRejection(file);
        if (rejection) {
            const error = new MasaClientError('invalid-image', rejection);
            this.fail(error);
            this.notify();
            return error;
        }
        const entry = { id: crypto.randomUUID(), name: file.name };
        this.uploads = [...this.uploads, entry];
        this.notify();
        const run = this.uploadChain.then(() =>
            this.perform(async () => {
                await this.ensureSession();
                this.uploadIntent = { file, key: crypto.randomUUID() };
                await this.completeUpload();
            }),
        );
        this.uploadChain = run.catch(() => {});
        try {
            await run;
        } finally {
            this.uploads = this.uploads.filter((upload) => upload !== entry);
            this.notify();
        }
    }

    async completeUpload() {
        const intent = this.uploadIntent;
        const attachment = await this.client.upload(this.conversationId, this.session.id, intent);
        if (this.session.status !== 'active') return;
        this.images.push({ id: attachment.id, name: intent.file.name, preview: URL.createObjectURL(intent.file) });
        this.uploadIntent = null;
    }

    removeImage(id) {
        const image = this.images.find((item) => item.id === id);
        if (!image) return;
        URL.revokeObjectURL(image.preview);
        this.images = this.images.filter((item) => item !== image);
        this.notify();
    }

    async submit(question, context) {
        await this.perform(async () => {
            if (this.pending || this.records.some(isRunning)) return;
            if (!question.trim() || question.length > 6000 || context.length > 6000) {
                throw new MasaClientError('invalid-question', 'Enter a question of up to 6,000 characters.');
            }
            await this.ensureSession();
            this.pending = {
                sessionId: this.session.id,
                idempotencyKey: crypto.randomUUID(),
                question,
                context,
                attachmentIds: this.images.map((image) => image.id),
            };
            const fits = (candidate) =>
                candidate.length <= 6000 &&
                new TextEncoder().encode(
                    JSON.stringify({
                        formatVersion: 1,
                        ...this.submissionFields({ ...this.pending, context: candidate }),
                    }),
                ).byteLength <= 15500;
            if (!fits(context)) {
                this.pending = null;
                throw new MasaClientError(
                    'question-too-large',
                    'This question and page context exceed the request limit. Shorten the question and try again.',
                );
            }
            for (const record of this.records
                .filter((item) => item.text)
                .slice(-3)
                .reverse()) {
                const candidate = `${context}\n\nEarlier question: ${record.question}\nEarlier finding: ${record.text}`;
                if (!fits(candidate)) break;
                context = candidate;
            }
            this.pending.context = context;
            this.notify();
            await this.completeSubmission();
        });
    }

    /** Drop a submission nobody is waiting for, so it cannot be retried later or keep the session busy. */
    discardPending() {
        this.pending = null;
        this.notify();
    }

    submissionFields({ sessionId, idempotencyKey, question, context, attachmentIds }) {
        return { sessionId, idempotencyKey, question, context, attachmentIds };
    }

    async completeSubmission() {
        const intent = this.pending;
        const fields = this.submissionFields(intent);
        let response;
        try {
            response = await this.client.control(this.conversationId, 'investigation.submit', fields);
        } catch (error) {
            if (error instanceof MasaClientError && !retryable(error)) this.pending = null;
            throw error;
        }
        const { result, retryAfter } = response;
        this.records.push({
            id: result.id,
            sessionId: intent.sessionId,
            question: intent.question,
            text: '',
            files: this.images.map(({ name }) => ({ name })),
            status: result.status,
        });
        this.pending = null;
        this.updateJob(result);
        this.pollAfter = nextPoll(this.now(), retryAfter);
    }

    retrySubmission() {
        return this.perform(async () => {
            if (this.restoreId) await this.restore();
            if (this.pending) await this.completeSubmission();
        });
    }

    updateJob(result) {
        this.applySession(result.session);
        const record = this.records.find((item) => item.id === result.id);
        Object.assign(record, {
            status: result.status,
            text: findingText(result.result),
            failure: result.error?.code,
            progress: result.progress,
            startedAt: result.startedAt ?? result.createdAt ?? record.startedAt,
            artifacts: result.result?.artifacts ?? [],
            lists: result.result?.lists ?? [],
            followUps: result.result?.answer?.followUps ?? [],
        });
        if (result.result?.artifacts?.length)
            record.files = [...record.files, ...result.result.artifacts.map(({ filename }) => ({ name: filename }))].filter(
                (file, index, files) => files.findIndex((item) => item.name === file.name) === index,
            );
    }

    async refresh() {
        if (this.polling || this.ending || this.now() < Math.max(this.pollAfter, this.retryAt)) return;
        const epoch = this.epoch;
        const controller = new AbortController();
        this.polling = controller;
        const signal = controller.signal;
        try {
            for (const record of this.records.filter(isRunning)) {
                const { result, retryAfter } = await this.client.control(
                    this.conversationId,
                    'investigation.get',
                    {
                        sessionId: record.sessionId,
                        investigationId: record.id,
                    },
                    signal,
                );
                if (epoch !== this.epoch) return;
                this.updateJob(result);
                this.pollAfter = nextPoll(this.now(), retryAfter);
            }
            if (!this.pending && !this.uploadIntent) this.error = null;
        } catch (error) {
            if (signal.aborted) return;
            if (!(error instanceof MasaClientError)) throw error;
            this.fail(error);
            if ([404, 410].includes(error.status)) {
                for (const record of this.records.filter(isRunning)) record.status = 'interrupted';
            }
            this.pollAfter = this.now() + Math.max(5, error.retryAfter) * 1000;
        } finally {
            if (this.polling === controller) this.polling = null;
            if (epoch === this.epoch) this.notify();
        }
    }

    cancel(record) {
        return this.perform(async () => {
            this.epoch++;
            this.polling?.abort();
            const { result } = await this.client.control(this.conversationId, 'investigation.cancel', {
                sessionId: record.sessionId,
                investigationId: record.id,
            });
            this.updateJob(result);
        });
    }

    renew() {
        return this.perform(async () => {
            this.applySession(
                (await this.client.control(this.conversationId, 'session.renew', { sessionId: this.session.id })).result,
            );
            this.renewedAt = this.now();
        });
    }

    download(record, artifact) {
        return this.perform(async () => {
            const blob = await this.client.download(this.conversationId, record.sessionId, record.id, artifact);
            if (this.session?.status !== 'active' || Date.parse(this.session.expiresAt) <= this.now()) return;
            const previous = this.downloads.get(artifact.id);
            if (previous) URL.revokeObjectURL(previous.url);
            this.downloads.set(artifact.id, {
                url: URL.createObjectURL(blob),
                name: artifact.filename,
                mimetype: artifact.mimetype,
            });
        });
    }

    /**
     * End every lease this conversation knows. A session.create MASA never
     * confirmed is not retried: an unreachable MASA (prod has no masa-api)
     * would then block sign-out and delete for good, and a lease it did
     * create expires on MASA's idle timeout.
     */
    async end() {
        this.ending = true;
        this.epoch++;
        this.polling?.abort();
        this.notify();
        try {
            await this.inFlight;
            const ids = new Set(
                [this.leaseId, this.restoreId, ...this.records.filter(isRunning).map((item) => item.sessionId)].filter(Boolean),
            );
            if (ids.size && this.now() < this.retryAt) throw this.error;
            for (const sessionId of ids) {
                try {
                    await this.client.control(this.conversationId, 'session.end', { sessionId });
                } catch (error) {
                    if (!(error instanceof MasaClientError) || ![404, 410].includes(error.status)) throw error;
                }
            }
            clearTimeout(this.expiryTimer);
            this.clearMedia();
            this.pending = null;
            this.restoreId = null;
            this.createKey = null;
            if (this.session) this.session = { ...this.session, status: 'ended' };
            for (const record of this.records.filter(isRunning)) record.status = 'cancelled';
            this.error = null;
        } finally {
            this.ending = false;
            this.notify();
        }
    }

    attach() {
        this.foreground++;
        if (this.foreground === 1) {
            this.timer = setInterval(() => this.tick(), POLL_SECONDS * 1000);
            document.addEventListener('visibilitychange', this.onVisibilityChange);
            void this.tick();
        }
        return () => {
            if (--this.foreground) return;
            clearInterval(this.timer);
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
        };
    }

    async tick() {
        if (document.hidden || this.ending) return;
        if ([401, 403].includes(this.error?.status)) return;
        if (this.restoreId) await this.perform(() => this.restore());
        if (this.session?.status === 'active' && Date.parse(this.session.expiresAt) <= this.now()) this.expire();
        if (this.records.some(isRunning)) await this.refresh();
        else if (
            this.session?.status === 'active' &&
            Date.parse(this.session.expiresAt) - this.now() > 120000 &&
            this.now() - this.renewedAt >= 60000
        )
            await this.renew();
        this.dispatchEvent(new Event('change'));
    }
}

/** Reopening a drawer reuses in-memory work; reloads recover only owned job IDs and text history. */
export function getInvestigationSession(conversationId) {
    if (!sessions.has(conversationId))
        sessions.set(
            conversationId,
            new InvestigationSession({
                conversationId,
                history: sessionManager.getSession(conversationId)?.investigations ?? [],
                state: sessionManager.getSession(conversationId)?.investigationState ?? {},
                save: (investigations, investigationState) => {
                    const session = sessionManager.getSession(conversationId);
                    if (!session) return;
                    const name =
                        session.name === 'New Chat' && !session.messages.length && investigations.length
                            ? sessionManager.generateSessionName(investigations[0].question)
                            : session.name;
                    sessionManager.updateSession(conversationId, { investigations, investigationState, name });
                },
            }),
        );
    return sessions.get(conversationId);
}

/** Close known server leases before deleting a conversation or relinquishing IMS credentials. */
export async function endConversationInvestigations(conversationId) {
    const session = getInvestigationSession(conversationId);
    await session.end();
    sessions.delete(conversationId);
}

/** Explicit Studio sign-out waits for lease revocation; ordinary drawer/tab closure does not cancel work. */
export async function endAllInvestigations() {
    for (const { id } of sessionManager.listSessions()) await endConversationInvestigations(id);
}

/**
 * Free other conversations' unused leases so a new one fits under MASA's
 * per-user session cap. A lease known only from storage (after a reload)
 * counts; one that fails to end is skipped. Resolves with the number ended.
 */
export async function endIdleSessions(exceptConversationId) {
    let ended = 0;
    for (const { id } of sessionManager.listSessions()) {
        if (id === exceptConversationId) continue;
        const session = getInvestigationSession(id);
        if (!(session.leaseId ?? session.restoreId) || session.isBusy) continue;
        try {
            await endConversationInvestigations(id);
            ended++;
        } catch (error) {
            if (!(error instanceof MasaClientError)) throw error;
        }
    }
    return ended;
}
