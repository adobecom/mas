import { expect } from '@esm-bundle/chai';
import { createOdinTelemetry } from '../../src/utils/odin-telemetry.js';
import { ODIN_PREVIEW_ORIGIN } from '../../src/constants.js';

function odinEntry(status, path = '/adobe/contentFragments/byPath?path=/content/dam/mas/acom/settings/index') {
    return { name: `${ODIN_PREVIEW_ORIGIN}${path}`, responseStatus: status };
}

function setup() {
    const calls = [];
    const telemetry = createOdinTelemetry({ log: (message, options) => calls.push({ message, options }) });
    return { telemetry, calls };
}

function sessionOf({ message }) {
    return message.match(/¶session=([^¶]+)/)?.[1];
}

function withoutSession({ message }) {
    return message.replace(/¶session=[^¶]+/, '');
}

describe('createOdinTelemetry', () => {
    it('summarizes odinpreview statuses in one log on flush', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200), odinEntry(200), odinEntry(429)]);
        telemetry.flush();
        expect(calls).to.have.length(1);
        expect(withoutSession(calls[0])).to.equal('Odin preview requests¶total=3¶429=1¶unknown=0¶statuses=200:2,429:1');
    });

    it('links every summary of one page session with the same session id', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        telemetry.observe([odinEntry(429)]);
        telemetry.flush();
        expect(calls).to.have.length(2);
        expect(sessionOf(calls[1])).to.be.a('string').and.equal(sessionOf(calls[0]));
    });

    it('starts a new session id for each page load', () => {
        const first = setup();
        const second = setup();
        first.telemetry.observe([odinEntry(200)]);
        first.telemetry.flush();
        second.telemetry.observe([odinEntry(200)]);
        second.telemetry.flush();
        expect(sessionOf(first.calls[0])).to.be.a('string').and.not.equal(sessionOf(second.calls[0]));
    });

    it('logs at warning severity when any request was throttled', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(429)]);
        telemetry.flush();
        expect(calls[0].options.severity).to.equal('warning');
    });

    it('logs at info severity when nothing was throttled', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        expect(calls[0].options.severity).to.equal('info');
    });

    it('ignores resources from other origins', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([{ name: 'https://www.adobe.com/libs/utils/lana.js', responseStatus: 200 }]);
        telemetry.flush();
        expect(calls).to.be.empty;
    });

    it('counts a blocked response (status 0) as unknown, not as confirmed unthrottled', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(0)]);
        telemetry.flush();
        expect(withoutSession(calls[0])).to.equal('Odin preview requests¶total=1¶429=0¶unknown=1¶statuses=0:1');
    });

    it('counts a missing responseStatus as unknown, separately from blocked responses', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([{ name: `${ODIN_PREVIEW_ORIGIN}/adobe/contentFragments/abc` }]);
        telemetry.flush();
        expect(withoutSession(calls[0])).to.equal('Odin preview requests¶total=1¶429=0¶unknown=1¶statuses=none:1');
    });

    it('does not log twice when flushed twice', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        telemetry.flush();
        expect(calls).to.have.length(1);
    });

    it('does not log when no odinpreview requests were seen', () => {
        const { telemetry, calls } = setup();
        telemetry.flush();
        expect(calls).to.be.empty;
    });

    it('tags the log for Studio Odin preview filtering', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        expect(calls[0].options.tags).to.equal('studio,odin-preview');
    });

    it('sends every summary instead of the LANA default 1% sample', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        expect(calls[0].options.sampleRate).to.equal(100);
    });

    it('does not mark the summary as an implicit (unhandled) error', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200)]);
        telemetry.flush();
        expect(calls[0].options).to.not.have.property('errorType');
    });
});
