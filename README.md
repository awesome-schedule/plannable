# Plannable

> Previously known as Awesome-Schedule

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b323d65880a148aa85e5a811e4791d53)](https://app.codacy.com/app/hanzhi713/plannable?utm_source=github.com&utm_medium=referral&utm_content=awesome-schedule/plannable&utm_campaign=Badge_Grade_Dashboard)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Build Status](https://travis-ci.org/awesome-schedule/plannable.svg?branch=master)](https://travis-ci.org/awesome-schedule/)
[![codecov](https://codecov.io/gh/awesome-schedule/plannable/branch/master/graph/badge.svg)](https://codecov.io/gh/awesome-schedule/plannable)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fawesome-schedule%2Fplannable.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fawesome-schedule%2Fplannable?ref=badge_shield)

A website which helps UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters and sorting options. Once you've finalized your class selection, hit "Generate" button and get all the possible schedules satisfying to your requirements.

## Website

https://plannable.org/

Our website consists of only front-end components, i.e. all the scripts run in your browser and data are stored locally. It fetches data from [Lou's list](https://rabi.phys.virginia.edu/mySIS/CS2/) on page load and store it in browser cache.

## Mirror

To facilitate access in China, we provide a mirror: https://cn.plannable.org/. It is synchronized with https://plannable.org/ once per hour.

## Development

> Note: We recommend [VS Code](https://code.visualstudio.com/) for development

### Install Dependencies

-   Node.js >= 8.10

Clone the repository and data

```bash
git clone https://github.com/awesome-schedule/plannable
cd plannable/scripts
git clone https://github.com/awesome-schedule/data
cd ..
```

Install Vue cli and other dependencies. Then, launch the development server

```bash
npm install -g @vue/cli http-server
npm install
npm run serve
```

You need to serve the static files in scripts/data, because we only load local data in local development mode. To do so, you can run `sh run.sh` in the project root, which will basically open a static http server listening to port `8000` with cross origin header.

Then you can visit the development server at [http://127.0.0.1:8080](http://127.0.0.1:8080/).

## Built With

-   [Vue.js](https://vuejs.org) - Front-end framework
-   [Bootstrap](https://getbootstrap.com/) - Front-end component library
-   [Vuetify](https://vuetifyjs.com/en/) - Front-end component library

## Contributors

Please refer to our [Contribution Log](docs/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## Acknowledgement

Prof. Lou Bloomfield for providing data

## Contributing

Please refer to our [documentation](docs/README.md) and [contributing guide](docs/CONTRIBUTING.md).

## License

This project is licensed under GPL-3.0 - see the [LICENSE](LICENSE) file for details
