global.console.time = jest.fn();
global.console.timeEnd = jest.fn();
global.console.log = jest.fn();

// set async time out to 50 seconds
// God knows why sometimes request takes so long
jest.setTimeout(50000);
