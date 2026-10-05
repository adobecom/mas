import { expect } from '@esm-bundle/chai';
import { createOdinTelemetry } from '../../src/utils/odin-telemetry.js';

const ORIGIN = 'https://odinpreview.corp.adobe.com';

function odinEntry(status, path = '/adobe/contentFragments/byPath?path=/content/dam/mas/acom/settings/index') {
    return { name: `${ORIGIN}${path}`, responseStatus: status };
}

function setup() {
    const calls = [];
    const telemetry = createOdinTelemetry({
        origin: ORIGIN,
        log: (message, options) => calls.push({ message, options }),
    });
    return { telemetry, calls };
}

describe('createOdinTelemetry', () => {
    it('summarizes odinpreview statuses in one log on flush', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(200), odinEntry(200), odinEntry(429)]);
        telemetry.flush();
        expect(calls).to.have.length(1);
        expect(calls[0].message).to.equal('Odin preview requests¶total=3¶429=1¶statuses=200:2,429:1');
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

    it('counts blocked responses reported as status 0', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([odinEntry(0)]);
        telemetry.flush();
        expect(calls[0].message).to.equal('Odin preview requests¶total=1¶429=0¶statuses=0:1');
    });

    it('treats a missing responseStatus as status 0', () => {
        const { telemetry, calls } = setup();
        telemetry.observe([{ name: `${ORIGIN}/adobe/contentFragments/abc` }]);
        telemetry.flush();
        expect(calls[0].message).to.equal('Odin preview requests¶total=1¶429=0¶statuses=0:1');
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
});
