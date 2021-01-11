<p align="center"><img src="./src/assets/cover.jpg" width="560px" alt="cover"/></p>

<p align="center">
    <a href="https://www.codacy.com/manual/hanzhi713/plannable?utm_source=github.com&utm_medium=referral&utm_content=awesome-schedule/plannable&utm_campaign=Badge_Grade"
        rel="nofollow">
        <img src="https://api.codacy.com/project/badge/Grade/255cd2c2c4d4459f81bbd9c685471ef8" alt="Codacy Badge" />
    </a>
    <a href="https://www.gnu.org/licenses/gpl-3.0" rel="nofollow">
        <img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License: GPL v3" />
    </a>
    <a href="https://travis-ci.org/awesome-schedule/" rel="nofollow">
        <img src="https://travis-ci.org/awesome-schedule/plannable.svg?branch=master" alt="Build Status" />
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

## Mirror

To facilitate access in China, we provide a mirror: https://cn.plannable.org/. It is synchronized with https://plannable.org/ once per hour.

## Desktop App

> powered by electron

The desktop app of plannable can be downloaded from [releases](https://github.com/awesome-schedule/plannable/releases). 

### Note for Windows and MacOS users

Your operating system may block the execution of the app because it is unrecognized/unsigned. We do not have the signed certificates which cost at least 200$ per year. You can proceed safely because there is no security risk. 

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

> Note: We recommend [VS Code](https://code.visualstudio.com/) for development

### Install Dependencies and Launch Development Server

-   Node.js >= 10.16

Clone the repository and update data

```bash
git clone https://github.com/awesome-schedule/plannable
npm run updatedata
```

Install Vue cli and other dependencies. Then, launch the development server

```bash
npm install -g @vue/cli
npm install
npm run serve
```

You need to serve the static files in scripts/data, because we only load local data in local development mode. To do so, open a new terminal and run

```bash
npm run data
```

in the project root, which will basically open a static http server listening to port `8000` with cross origin header.

Then you can visit the development server at [http://127.0.0.1:8080](http://127.0.0.1:8080/).

### Build Desktop App

You can use `npx electron .` to launch the native application powered by electron. 

You can use `npx electron-builder --win` (or `--mac`, `--linux`) to build the native executable for your platform. 


## Built With

-   [TypeScript](https://www.typescriptlang.org)
-   [Vue.js](https://vuejs.org)
-   [Bootstrap](https://getbootstrap.com/)

## Contributors

Please refer to our [Contribution Log](docs/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## Contributing

Please refer to our [documentation](docs/README.md) and [contributing guide](docs/CONTRIBUTING.md).

## Integrate with other schools/custom data source

Some efforts have been made to make it easier to integrate plannable with other universities. If you want to use plannable to create course-scheduling websites for other universities, you probably need to:

1. Fork this repository
2. Overwrite src/config.ts with your custom configuration. See src/config.example.ts for reference
3. Write your custom data loader that returns the correct objects in config.ts
4. Make some tweaks to the source code in other places if needed. 
5. Build and deploy to some other places

If you have questions when integrating plannable with other schools or want to deploy your favor of plannable to a subdomain of plannable (e.g. yourschool.plannable.org), feel free to contact us by GitHub issue or email. 

## License

This project is licensed under GPL-3.0 - see the [LICENSE](LICENSE) file for details
