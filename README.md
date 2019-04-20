# Awesome-SchedulAR

> Note: the credit of the name goes to [OAHC2022](https://github.com/OAHC2022)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/awesome-schedule/Awesome-SchedulAR.svg?branch=master)](https://travis-ci.org/awesome-schedule/)

A website which helps UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters. (After you click the "+" button, the course you selected will be added to the section below automatically. Delete your input from Course Title to view the change.) Once finalize your class selection, hit "Generate" button and get all the possible schedules satisfying to your requirements.

## Demo

[https://awesome-schedule.github.io/](https://awesome-schedule.github.io/)

This site is a pure front-end build. It fetches data from Lou's list on page load.

## Development

> Note: We recommend [VS Code](https://code.visualstudio.com/) for development

### Install Dependencies

- Node.js >= 8.10

Clone the repository

```bash
git clone https://github.com/awesome-schedule/Awesome-SchedulAR
```

Install front end dependencies and launch the development server

```bash
cd Awesome-SchedulAR
npm install
npm run serve
```

Then you can view the development server at [http://127.0.0.1:8080](http://127.0.0.1:8080/).

Note: The back-end is currently abandoned. It has the following dependencies

- Python >= 3.5
- Flask >= 1.0
- Requests >= 2.1
- Schedule >= 0.50

which can be installed with

```bash
pip install flask flask-cors requests schedule
```

## Built With

- [Vue.js](https://vuejs.org) - Front-end framework
- [Bootstrap](https://getbootstrap.com/) - Front-end component library
- <s>[Flask](http://flask.pocoo.org/) - Back-end framework</s>

## Contributors

Please refer to our [Contribution Log](docs/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## Contributing

Please refer to [our contribution guide](docs/CONTRIBUTING.md).

## License

This project is licensed under the GPL-3.0 - see the [LICENSE](LICENSE) file for details
