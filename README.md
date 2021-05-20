<p align="center"><img src="./src/assets/cover.jpg" width="560px" alt="cover"/></p>

<p align="center">
    <a href="https://www.gnu.org/licenses/gpl-3.0" rel="nofollow">
        <img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License: GPL v3" />
    </a>
    <a href="https://travis-ci.com/github/awesome-schedule/plannable" rel="nofollow">
        <img src="https://travis-ci.com/awesome-schedule/plannable.svg?branch=master" alt="Build Status" />
    </a>
    <a href="https://codecov.io/gh/awesome-schedule/plannable" rel="nofollow">
        <img src="https://codecov.io/gh/awesome-schedule/plannable/branch/master/graph/badge.svg" alt="codecov" />
    </a>
    <a href="http://makeapullrequest.com" rel="nofollow">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
    </a>
    <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fawesome-schedule%2Fplannable?ref=badge_shield"
        rel="nofollow">
        <img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fawesome-schedule%2Fplannable.svg?type=shield"
            alt="FOSSA Status" />
    </a>
</p>

# Plannable

> Previously known as Awesome-Schedule

A website which helps UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters and sort options. Once you've finalized your class selection, hit "Generate" button and get all the possible schedules satisfying to your requirements.

## Website

https://plannable.org/

Our website consists of only front-end components, i.e. all the scripts run in your browser and data are stored locally. It fetches data from [Lou's list](https://rabi.phys.virginia.edu/mySIS/CS2/) on page load and store it in browser cache.

However, optional backend storage features are available. Users can choose to login to a third-party website and store their plannable profiles. This enables cross-device profile syncing. We currently support [Hoosmyprofessor](https://match.msnatuva.org). If you wish to provide such service, please refer to our [backend specification](./docs/Backend%20Specification.md) for more details.

## Mirror

<s> To facilitate access in China, we provide a mirror: https://cn.plannable.org/. It is synchronized with https://plannable.org/ once per hour.</s>

> Note: due to technical issues, the synchronization must be performed manually, so the mirror might not be up-to-date. I suggest to use the main website https://plannable.org/.

### Supported browsers

Since Plannable uses some of the cutting-edge features of CSS and Javascript, it requires relatively recent versions of the mainstream browsers. Specifically, Edge >= 16, Firefox >= 52, Chrome >= 57, Safari >= 11, Opera >= 44 are supported. IE is not supported. Plannable might also work on browsers not mentioned above, as long as the newer features such as ES6, WebAssembly and CSS Grid are supported. 

## Desktop App

> powered by electron

The desktop app of plannable can be downloaded from [releases](https://github.com/awesome-schedule/plannable/releases).

### Note for Windows and MacOS users

Your operating system may block the execution of the app because it is unrecognized/unsigned. We do not have the signed certificates which cost at least 200\$ per year. You can proceed safely because there is no security risk.

### Note for Linux users

If you use AppImage, you need to add execution permission before launching the file

```bash
chmod +x plannable-x.x.x.AppImage
```

If you use snap, you can install plannable from the snap store

```
sudo snap install plannable
```

## Development

> Note: We recommend [VS Code](https://code.visualstudio.com/) and a Unix-like environment for development

### Note for Windows users

Most of our scripts assumed a bash-like shell. If you're using windows, you can use git bash, cygwin, or WSL bash shell. Make sure to change npm's default shell by using

```bash
npm config set script-shell YOURSHELL
```

### Install Dependencies and Launch Development Server

> On Linux, you may need to increase you system file watcher limit

-   Node.js >= 12.x

Clone this repository. The `updatedata` script will automatically clone `https://github.com/awesome-schedule/data` into `scripts` so the data (e.g. course catalog) can be access locally. The `getwasm` script will clone the pre-build wasm binary. Note that if you want to build wasm yourself, please refer to the Build WASM section below.

```bash
git clone https://github.com/awesome-schedule/plannable && cd plannable
npm run updatedata
npm run getwasm
```

Install dependencies and launch the development server

```bash
npm install
npm run serve
```

You need to serve the static files in scripts/data, because we only load local data in local development mode. To do so, open a new terminal and run `npm run data`. This will open a static http server listening to port `8000` with cross origin headers. This static server must run on `localhost:8000`.

Then you can visit the development server shown in the terminal.

### Build Desktop App

You can use `npx electron .` to launch the native application powered by electron.

You can use `npx electron-builder --win` (or `--mac`, `--linux`) to build the native executable for your platform.

### Build WebAssembly (WASM)

> Plannable utilizes WASM to speed up some of its compute-intensive part

Make sure that you have [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) installed. Also make sure that emsdk_env.sh is sourced before running the following scripts.

Before you can build the binary, you need to download dependencies (parallel-hashmap and GLPK) and compile GLPK. This only needs to be done once, with the following script:

```bash
npm run getdep
```

Then, each time you modify any cpp file, you can simply do

```bash
npm run wasm -- dev
```

to build the wasm binary and js glue code, which will be moved to public/js.

## Contributors

Please refer to our [Contribution Log](docs/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## Contributing

Please refer to our [documentation](docs/README.md) and [contributing guide](docs/CONTRIBUTING.md).

## Integrate with other schools/custom data source

Some efforts have been made to make it easier to integrate plannable with other universities. If you want to use plannable to create course-scheduling websites for other universities, you probably need to:

1. Fork this repository
2. Overwrite src/config.ts with your custom configuration. See [src/config.example.ts](src/config.example.ts) for reference
3. Write your custom data loader that returns the correct objects in config.ts
4. Make some tweaks to the source code in other places if needed.
5. Build and deploy to some other places

If you have questions when integrating plannable with other schools or want to deploy your favor of plannable to a subdomain of plannable (e.g. yourschool.plannable.org), feel free to contact us by GitHub issue or email.

## License

This project is licensed under GPL-3.0 - see the [LICENSE](LICENSE) file for details
