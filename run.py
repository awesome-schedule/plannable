import csv
from flask import Flask, render_template, jsonify

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/semesters')
def get_semesters():
    semesters = {
        "s1": {
            "name": "Spring 2019"
        }
    }
    return jsonify(semesters)


@app.route('/api/classes')
def get_classes():
    pass


@app.route('/<any_text>')
def default_handler(any_text):
    return render_template('errors/404.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
