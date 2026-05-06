import '../../node_modules/mocha/mocha.js';

export async function runTests(testFn) {
    document.body.insertAdjacentHTML('afterbegin', '<div id="mocha"></div>');
    window.mocha.setup('bdd');
    await testFn();
    window.mocha.run();
}
