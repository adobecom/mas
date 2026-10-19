import sessionManager from '../services/chat-session-manager.js';
import { MasaClient, MasaClientError } from './masa-client.js';

const sessions = new Map();
const running = (record) => ['queued', 'running'].includes(record.status);
const retryable = (error) => [0, 429, 502, 503, 504].includes(error.status);

/** Persist text and opaque control IDs only; files, grants, URLs and resumable upload bodies stay in memory. */
export function investigationHistory(records) {
    return records.map(({ id, sessionId, question, text, status, files, limitedContext }) => ({
        id,
        sessionId,
        question,
        text,
        status,
        limitedContext,
        files: files.map(({ name }) => ({ name })),
    }));
}

/** Render structured MASA findings as text without adding a second knowledge or action interpreter. */
export function findingText(result) {
    if (!result) return '';
    if (result.withheld) return 'MASA could not share this finding with this audience.';
    const answer = result.answer;
    if (!answer) return 'No final finding is available.';
    if (answer.type === 'decline') return 'MASA can investigate Merch at Scale questions only.';
    return [
        answer.answer ?? answer.question,
        ...(answer.points ?? []).map((point) => `• ${point}`),
        ...(answer.steps ?? []).map((step, index) => `${index + 1}. ${step}`),
        ...Object.entries(answer.readout ?? {}).map(([label, value]) => `${label}: ${value}`),
        ...Object.entries(answer.alert ?? {}).map(([label, value]) => `${label}: ${value}`),
        ...Object.entries(answer.route ?? {}).map(([label, value]) => `${label}: ${value}`),
        answer.layer && `Layer: ${answer.layer}`,
        answer.confidence && `Confidence: ${answer.confidence}`,
        answer.verdict && `Verdict: ${answer.verdict}`,
        answer.next_check && `Next check: ${answer.next_check}`,
        answer.deciding,
        result.budgetExhausted && `Partial finding: ${result.budgetExhaustedBy ?? 'investigation'} budget reached.`,
        ...(result.evidence ?? []).map((evidence) => `[${evidence.id}] ${evidence.summary}`),
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
        this.downloads = new Map();
        this.error = null;
        this.busy = false;
        this.ending = false;
        this.retryAt = 0;
        this.pollAfter = 0;
        this.renewedAt = 0;
        this.epoch = 0;
        this.foreground = 0;
    }

    notify() {
        this.save(investigationHistory(this.records), {
            sessionId: this.session?.id ?? this.restoreId,
            createKey: this.createKey,
            pending: this.pending ? this.submissionFields(this.pending) : null,
        });
        this.dispatchEvent(new Event('change'));
    }

    async perform(task) {
        if (this.busy || this.ending || this.now() < this.retryAt) return;
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
            for (const record of this.records.filter(running)) record.status = 'interrupted';
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
            for (const record of this.records.filter(running)) record.status = 'interrupted';
        }
        this.notify();
    }

    async addImage(file) {
        await this.perform(async () => {
            if (
                this.images.length >= 3 ||
                file.size < 1 ||
                file.size > 5000000 ||
                !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)
            ) {
                throw new MasaClientError(
                    'invalid-image',
                    'Choose up to three PNG, JPEG, GIF or WebP images, each no larger than 5 MB.',
                );
            }
            await this.ensureSession();
            this.uploadIntent = { file, key: crypto.randomUUID() };
            await this.completeUpload();
        });
    }

    async completeUpload() {
        const intent = this.uploadIntent;
        let attachment;
        try {
            attachment = await this.client.upload(this.conversationId, this.session.id, intent);
        } catch (error) {
            if (error instanceof MasaClientError && error.code === 'transfer-expired') {
                intent.descriptor = null;
                intent.key = crypto.randomUUID();
            }
            throw error;
        }
        if (this.session.status !== 'active') return;
        this.images.push({ id: attachment.id, name: intent.file.name, preview: URL.createObjectURL(intent.file) });
        this.uploadIntent = null;
    }

    async retryUpload() {
        await this.perform(async () => {
            if (!this.uploadIntent) return;
            if (this.uploadIntent.descriptor && Date.parse(this.uploadIntent.descriptor.expiresAt) <= this.now()) {
                this.uploadIntent.key = crypto.randomUUID();
                this.uploadIntent.descriptor = null;
            }
            await this.completeUpload();
        });
    }

    removeImage(id) {
        const image = this.images.find((item) => item.id === id);
        URL.revokeObjectURL(image.preview);
        this.images = this.images.filter((item) => item !== image);
        this.notify();
    }

    async submit(question, context) {
        await this.perform(async () => {
            if (this.pending || this.records.some(running)) return;
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
            const previous = this.records.filter((record) => record.text);
            let included = 0;
            for (const record of previous.slice(-3).reverse()) {
                const candidate = `${context}\n\nEarlier question: ${record.question}\nEarlier finding: ${record.text}`;
                if (!fits(candidate)) break;
                context = candidate;
                included++;
            }
            this.pending.context = context;
            this.pending.limitedContext = included < previous.length;
            this.notify();
            await this.completeSubmission();
        });
    }

    submissionFields({ sessionId, idempotencyKey, question, context, attachmentIds, limitedContext }) {
        return { sessionId, idempotencyKey, question, context, attachmentIds, limitedContext };
    }

    async completeSubmission() {
        const intent = this.pending;
        const { limitedContext, ...fields } = this.submissionFields(intent);
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
            limitedContext,
        });
        this.pending = null;
        this.updateJob(result);
        this.pollAfter = this.now() + Math.max(10, retryAfter) * 1000;
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
            progress: result.progress,
            text: findingText(result.result),
            failure: result.error?.code,
            artifacts: result.result?.artifacts ?? [],
            lists: result.result?.lists ?? [],
            limitations: result.result?.limitations ?? [],
        });
        if (result.result?.artifacts.length)
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
            for (const record of this.records.filter(running)) {
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
                this.pollAfter = this.now() + Math.max(10, retryAfter) * 1000;
            }
            if (!this.pending && !this.uploadIntent) this.error = null;
        } catch (error) {
            if (signal.aborted) return;
            if (!(error instanceof MasaClientError)) throw error;
            this.fail(error);
            if ([404, 410].includes(error.status)) {
                for (const record of this.records.filter(running)) record.status = 'interrupted';
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

    async end() {
        this.ending = true;
        this.epoch++;
        this.polling?.abort();
        this.notify();
        try {
            await this.inFlight;
            if (this.now() < this.retryAt) throw this.error;
            if (this.createKey) await this.ensureSession();
            const ids = new Set(
                [this.session?.id, this.restoreId, ...this.records.map((item) => item.sessionId)].filter(Boolean),
            );
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
            if (this.session) this.session = { ...this.session, status: 'ended' };
            for (const record of this.records.filter(running)) record.status = 'cancelled';
            this.error = null;
        } finally {
            this.ending = false;
            this.notify();
        }
    }

    attach() {
        this.foreground++;
        if (this.foreground === 1) {
            this.timer = setInterval(() => this.tick(), 3000);
            void this.tick();
        }
        return () => {
            if (--this.foreground === 0) clearInterval(this.timer);
        };
    }

    async tick() {
        if (document.hidden || this.ending) return;
        if ([401, 403].includes(this.error?.status)) return;
        if (this.restoreId) await this.perform(() => this.restore());
        if (this.session?.status === 'active' && Date.parse(this.session.expiresAt) <= this.now()) this.expire();
        if (this.records.some(running)) await this.refresh();
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
