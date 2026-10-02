const { expect } = require('chai');

let attachRequestId;
let getResponseHeaders;

/**
 * Every bug reported today was diagnosed by instrumenting the browser, because
 * a user report could not be tied to a server-side trace.
 *
 * The logging itself is fine: each turn writes structured lines carrying a
 * `req` field, and that value is the activation id, so one id retrieves the
 * whole trace. What was missing was any way to learn the id. `activation list`
 * returns almost nothing, the id rides on the x-openwhisk-activation-id header
 * which CORS does not expose to page JS, and the body carried requestId only
 * when the response failed to parse — never for a response that parsed and was
 * merely wrong, which is what every report was.
 */
describe('ai-chat/requestId reaches the caller', () => {
    before(async () => {
        ({ attachRequestId, getResponseHeaders } = await import('../../src/ai-chat/index.js'));
    });

    it('adds the id to a response body', () => {
        const result = attachRequestId({ statusCode: 200, body: { type: 'guided_step', message: 'pick one' } }, 'abc123');

        expect(result.body.requestId).to.equal('abc123');
        expect(result.body.type, 'the rest of the body survives').to.equal('guided_step');
    });

    it('adds it to an error response too, which is when it matters most', () => {
        const result = attachRequestId({ statusCode: 500, body: { error: 'something broke' } }, 'abc123');

        expect(result.body.requestId).to.equal('abc123');
    });

    it('leaves an id the action already set alone', () => {
        const result = attachRequestId({ statusCode: 200, body: { requestId: 'set-by-hand' } }, 'abc123');

        expect(result.body.requestId).to.equal('set-by-hand');
    });

    it('does nothing without an id', () => {
        const original = { statusCode: 200, body: { type: 'message' } };

        expect(attachRequestId(original, null)).to.deep.equal(original);
    });

    it('leaves a non-object body untouched', () => {
        expect(attachRequestId({ statusCode: 200, body: 'plain text' }, 'abc').body).to.equal('plain text');
        expect(attachRequestId({ statusCode: 204 }, 'abc').body).to.equal(undefined);
        expect(attachRequestId(null, 'abc')).to.equal(null);
    });

    it('exposes the activation id header, so it is readable even when the body is not', () => {
        // The browser cannot read x-openwhisk-activation-id unless CORS says so.
        expect(getResponseHeaders()['Access-Control-Expose-Headers']).to.include('x-openwhisk-activation-id');
    });
});
