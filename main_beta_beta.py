from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
import os
import datetime
import random
from sentence_transformers import SentenceTransformer, util
import numpy as np

app = Flask(__name__)
CORS(app)

"""
Notes:
1. print() statements were used in order to isolate errors which were present
2. User Login is stored with date and time in a .txt file every time a user logs in
3. The login history is a file called LOGIN_HISTORY.txt
"""

# Configure your MySQL connection
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Hayabusa@2004',
    'database': 'mcq'
}

import mysql.connector
import datetime


def check_user_and_password(username, password):
    """
    Verify if a user exists and if the provided password matches the stored password.

    Args:
        username (str): The username to check.
        password (str): The password to validate.

    Returns:
        tuple: A tuple containing two boolean values:
            - True if the user exists, False otherwise.
            - True if the password is correct, False otherwise.

    Side Effects:
        Logs the user's login attempt with the exact date and time to 'LOGIN_HISTORY.txt'.
    """
    try:
        conn = mysql.connector.connect(**mysql_config)
        cursor = conn.cursor()

        # Query to check if username exists
        cursor.execute('USE mcq;')
        query_user = "SELECT COUNT(*) FROM user WHERE user_name = %s"
        cursor.execute(query_user, (username,))
        user_exists = cursor.fetchone()[0] > 0

        # Query to check if the username and password match
        query_password = "SELECT COUNT(*) FROM user WHERE user_name = %s AND user_password = %s"
        cursor.execute(query_password, (username, password))
        password_correct = cursor.fetchone()[0] > 0

        cursor.close()
        conn.close()

        # Log the login attempt
        with open('LOGIN_HISTORY.txt', 'a+') as login_history_file:
            login_record = f'User {username} logged in at {datetime.datetime.now()}\n\n'
            login_history_file.write(login_record)

        return user_exists, password_correct

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return False, False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False, False


import mysql.connector


def get_user_id(username):
    """
    Retrieve the user ID for a given username.

    Args:
        username (str): The username to look up.

    Returns:
        int or None: The user ID if found, otherwise None.
    """
    try:
        conn = mysql.connector.connect(**mysql_config)
        cursor = conn.cursor()

        query = "SELECT user_id FROM User WHERE user_name = %s"
        cursor.execute(query, (username,))
        user_id = cursor.fetchone()

        cursor.close()
        conn.close()

        if user_id:
            return user_id[0]
        return None

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


def get_config_ids(user_id):
    """
    Retrieve a list of configuration IDs associated with a given user ID.

    Args:
        user_id (int): The user ID to look up.

    Returns:
        list: A list of configuration IDs if found, otherwise None.
    """
    try:
        conn = mysql.connector.connect(**mysql_config)
        cursor = conn.cursor()
        cursor.execute("SELECT config_id FROM user_config_map WHERE user_id = %s", (user_id,))
        config_ids = cursor.fetchall()
        cursor.close()
        conn.close()
        return [config_id[0] for config_id in config_ids] if config_ids else None

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


cutoff = None
validity_start = None
validity_end = None
number_of_questions = None
duration = None

import mysql.connector


def get_config_ids(user_id):
    """
    Retrieve a list of configuration IDs associated with a given user ID.

    Args:
        user_id (int): The user ID to look up.

    Returns:
        list: A list of configuration IDs if found, otherwise None.
    """
    try:
        conn = mysql.connector.connect(**mysql_config)
        cursor = conn.cursor()
        cursor.execute("SELECT config_id FROM user_config_map WHERE user_id = %s", (user_id,))
        config_ids = cursor.fetchall()
        cursor.close()
        conn.close()
        return [config_id[0] for config_id in config_ids] if config_ids else None

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


cutoff = None
validity_start = None
validity_end = None
number_of_questions = None
duration = None


@app.route('/api/get-test-config-by-user', methods=['POST'])
def get_test_config_by_user():
    """
    Retrieve test configuration details for a given user.

    Returns:
        JSON response: A list of test configuration details or an error message if not found.
    """
    data = request.get_json()
    username = data['username']

    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor()

    # Get user_id by username
    cursor.execute("SELECT user_id FROM user WHERE user_name = %s", (username,))
    user_id = cursor.fetchone()
    if not user_id:
        cursor.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    user_id = user_id[0]

    # Get config_ids by user_id
    cursor.execute("SELECT config_id FROM user_config_map WHERE user_id = %s", (user_id,))
    config_ids = cursor.fetchall()
    if not config_ids:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Config not found'}), 404
    config_ids = [config_id[0] for config_id in config_ids]

    # Get test configs by config_ids
    test_configs = []
    for config_id in config_ids:
        cursor.execute(
            "SELECT cutoff, validity_start, validity_end, number_of_questions, duration FROM test_config WHERE config_id = %s",
            (config_id,)
        )
        test_config = cursor.fetchone()
        if test_config:
            test_configs.append({
                'cutoff': test_config[0],
                'validity_start': test_config[1],
                'validity_end': test_config[2],
                'number_of_questions': test_config[3],
                'duration': str(test_config[4])
            })
            global number_of_questions
            number_of_questions = test_config[3]

    cursor.close()
    conn.close()

    if not test_configs:
        return jsonify({'error': 'Test config not found'}), 404

    return test_configs


@app.route('/api/check-user-password', methods=['POST'])
def check_user_password():
    """
    Verify if a user's password is correct.

    Returns:
        JSON response: Whether the user exists and if the password is correct.
    """
    data = request.get_json()
    username = data['username']
    password = data['password']

    user_exists, password_correct = check_user_and_password(username, password)

    return jsonify({'exists': user_exists, 'password_correct': password_correct})


# Initialize global variables
model = SentenceTransformer('all-mpnet-base-v2')
db_connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Hayabusa@2004",  # Replace with your actual password
    database="mcq"
)
cur = db_connection.cursor()


def fetch_questions_from_db():
    """
    Fetch all questions and their associated details from the database.

    Returns:
        list: A list of dictionaries containing question details including question text, options, and correct answer.
    """
    cur.execute('SELECT question, option_1, option_2, option_3, option_4, correct_answer FROM question;')
    questions = []
    for row in cur.fetchall():
        questions.append({
            'question': row[0],
            'option_1': row[1],
            'option_2': row[2],
            'option_3': row[3],
            'option_4': row[4],
            'correct_answer': row[5]
        })
    return questions


# Fetch all questions once and store them in a global variable
questions = fetch_questions_from_db()


def choose_dissimilar_qns(n, expected_similarity):
    """
    Select a list of dissimilar questions based on semantic similarity.

    Args:
        n (int): Number of questions to select.
        expected_similarity (float): Threshold for similarity to ensure selected questions are dissimilar.

    Returns:
        list: A list of selected dissimilar questions.
    """
    encoded_MCQs = []
    selected_questions = []
    while len(selected_questions) < n:
        random_question = random.choice(questions)
        encoded_random_question = model.encode(random_question['question'])

        if len(encoded_MCQs) == 0:
            encoded_MCQs.append(encoded_random_question)
            selected_questions.append(random_question)
        else:
            similarities = util.semantic_search(encoded_random_question, np.array(encoded_MCQs), top_k=1)
            similarity_score = similarities[0][0]['score']

            if similarity_score < expected_similarity:
                encoded_MCQs.append(encoded_random_question)
                selected_questions.append(random_question)

    return selected_questions


@app.route('/api/get-questions', methods=['GET'])
def get_questions():
    """
    Retrieve a list of questions for the quiz based on the test configuration.

    Returns:
        JSON response: A list of selected questions.
    """
    n = number_of_questions  # Number of questions from the test configuration
    expected_similarity = 0.8  # Adjust the expected similarity threshold as needed
    selected_questions = choose_dissimilar_qns(n, expected_similarity)
    return jsonify({'questions': selected_questions})


if __name__ == '__main__':
    app.run(debug=True)  # Use debug mode for more detailed logs
