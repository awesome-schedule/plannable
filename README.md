# Awesome-SchedulAR

> Note: the credit of the name goes to [OAHC2022](https://github.com/OAHC2022)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b323d65880a148aa85e5a811e4791d53)](https://app.codacy.com/app/hanzhi713/Awesome-SchedulAR?utm_source=github.com&utm_medium=referral&utm_content=awesome-schedule/Awesome-SchedulAR&utm_campaign=Badge_Grade_Dashboard)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Build Status](https://travis-ci.org/awesome-schedule/Awesome-SchedulAR.svg?branch=master)](https://travis-ci.org/awesome-schedule/)

A website which helps UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters and sorting options. Once you've finalized your class selection, hit "Generate" button and get all the possible schedules satisfying to your requirements.

## Demo

[https://awesome-schedule.github.io/](https://awesome-schedule.github.io/)

This site is a pure front-end build. It fetches data from Lou's list on page load.

## Development

> Note: We recommend [VS Code](https://code.visualstudio.com/) for development

### Install Dependencies

-   Node.js >= 8.10

Clone the repository and data

```bash
git clone https://github.com/awesome-schedule/Awesome-SchedulAR
cd Awesome-SchedulAR
mkdir -p backend
cd backend
git clone https://github.com/awesome-schedule/data
cd ..
```

Install front end dependencies and launch the development server

```bash
npm install
npm run serve
```

Then you can view the development server at [http://127.0.0.1:8080](http://127.0.0.1:8080/).

You probably need to serve the static files in backend/data. To do so, we recommend using `http-server`. If it is not installed, you can run `npm install -g http-server`

Then, you can run `sh run.sh` in the project root to launch the static file server.

## Built With

-   [Vue.js](https://vuejs.org) - Front-end framework
-   [Bootstrap](https://getbootstrap.com/) - Front-end component library

## Contributors

Please refer to our [Contribution Log](docs/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## Contributing

Please refer to [our contribution guide](docs/CONTRIBUTING.md).

## License

This project is licensed under the GPL-3.0 - see the [LICENSE](LICENSE) file for details
