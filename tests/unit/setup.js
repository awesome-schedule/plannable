// global.console = {
//     // log: jest.fn(),

// };
global.console.time = jest.fn();
global.console.timeEnd = jest.fn();
global.console.log = jest.fn();
