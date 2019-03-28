# Awesome-SchedulAR

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A website which allows UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters. (After you click the "+" button, the course you selected will be added to the section below automatically. Delete your input from Course Title to view the change.) Once finalize your class selection, hit "Create" button and get all the possible schedules corresponding to your requirements.

## Website Demo IP Address

Copy the following IP address and paste on the web browser to view the website.

```
http://54.162.226.166:8000/
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

- Node.js >= 8.10
- Python >= 3.5
- Flask >= 1.0
- Requests >= 2.1
- Schedule >= 0.50

```
pip install flask flask-cors requests schedule
```

We recommend [VS Code](https://code.visualstudio.com/) for development

## How to Use

Install necessary python packages

```
pip install flask flask-cors requests schedule
```

Install development dependencies

```
git clone https://github.com/OAHC2022/UVaAutoScheduler
cd UVaAutoScheduler
```

Install front end dependencies and compile assets

```bash
cd templates
npm install
npm run build
```

To launch the server

```bash
python run.py
```

Then you can view the UVaAutoScheduler from your [127.0.0.1](http://127.0.0.1:8000/).

## Built With

- [Vue.js](https://vuejs.org) - Front-end framework
- [Bootstrap](https://getbootstrap.com/) - Front-end component library
- [Flask](http://flask.pocoo.org/) - Back-end framework

## Contributors

Please refer to our [Contribution Log](/Contribution.md) or [GitHub contribution statistics](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
