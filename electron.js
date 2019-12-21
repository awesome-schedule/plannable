const { app, BrowserWindow, Menu } = require('electron');
const prompt = require('electron-prompt');

let win;

function createWindow() {
    win = new BrowserWindow({ width: 1280, height: 720 });
    const contents = win.webContents;
    win.setMenu(
        Menu.buildFromTemplate([
            {
                label: 'Menu',
                submenu: [
                    {
                        label: 'Read URL',
                        click() {
                            prompt({
                                title: 'Input URL',
                                label: 'URL:',
                                value: '',
                                inputAttrs: {
                                    type: 'url'
                                },
                                type: 'input',
                                width: 640,
                                height: 150
                            }).then(res => {
                                if (res === null) {
                                    return console.log('user cancelled');
                                }
                                const url = new URL(res);
                                contents.executeJavaScript(`location.search = "${url.search}"`);
                            });
                        }
                    },
                    {
                        label: 'Exit',
                        click() {
                            app.quit();
                        }
                    }
                ]
            }
        ])
    );
    win.loadFile('dist/index.html');
    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
