# UVaAutoScheduler

A website which allows UVa students to schedule their classes more efficiently. Get your class selection done with the searching field and customize them with filters. (After you click the "+" button, the course you selected will be added to the section below automatically. Delete your input from Course Title to view the change.) Once finalize your class selection, hit "Create" button and get all the possible schedules corresponding to your requirements.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

-   Node.js >= 8.10
-   Python >= 3.5
-   Flask >= 1.0
-   xlrd >= 1.0

## How to Use

Install necessary python packages

```
pip install xlrd flask
```

Install development dependencies

```
git clone https://github.com/OAHC2022/UVaAutoScheduler
cd UVaAutoScheduler
npm install
```

Install front end dependencies and compile assets

```
cd templates
npm install
npm run build
```

To launch the server

```
python run.py
```

Then you can view the UVaAutoScheduler from your [127.0.0.1](http://127.0.0.1:8000/).

## Built With

-   [Vue.js](https://vuejs.org) - JavaScript framework used
-   [Bootstrap](https://getbootstrap.com/) - The web template used
-   [Flask](http://flask.pocoo.org/) - Python framwork used

## Authors

-   **Zichao Hu** - _Initial work_ - [OAHC2022](https://github.com/OAHC2022)
-   **Hanzhi Zhou** - _Initial work_ - [hanzhi713](https://github.com/hanzhi713)-
-   **Kaiying Shan** - _Initial work_ - [kaiyingshan](https://github.com/kaiyingshan)
-   **Minjun Long** - _Initial work_ - [Elena6918](https://github.com/Elena6918)

See also the list of [contributors](https://github.com/OAHC2022/UVaAutoScheduler/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

-   [schedule-template](https://github.com/CodyHouse/schedule-template) for making schedule template.
