const nock = require('nock');

beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
});

afterEach(() => {
    nock.enableNetConnect();
});

module.exports = {
    get fetchStub() {
        return fetchStub;
    },
};
