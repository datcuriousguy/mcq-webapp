function checkUserAndPassword() {
    const username = document.getElementById('username_id').value;
    const password = document.getElementById('password_id').value; // Capture password input

    fetch('http://127.0.0.1:5000/api/check-user-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password }) // Include both username and password
    })
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            if (data.password_correct) {
                // preparing for the next screen (configs) on the same target page
                document.getElementById('result').innerText = 'Login successful!';
                document.getElementById('form_id').style.display = 'none';
                document.getElementById('quiz_id').style.display = 'block';
                document.getElementById('quiz_id').style.width = '100%';
                document.getElementById('quiz_id').style.height = '100%';
                getTestConfig();
            } else {
                document.getElementById('result').innerText = 'Incorrect password.';
            }
        } else {
            document.getElementById('result').innerText = 'User does not exist.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    checkUserAndPassword();
});






















function getTestConfig() {

    const username = document.getElementById('username_id').value;

    fetch('http://127.0.0.1:5000/api/get-test-config-by-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('quiz_id'); // Assuming there's a container div to hold multiple quiz_id divs
        container.innerHTML = ''; // Clear any existing content

        if (data.error) {
            container.innerHTML = data.error;
        } else {
            const logoutButton = document.createElement('button');
            logoutButton.classList.add('logout_button');
            logoutButton.innerHTML = 'Log Out';
            document.getElementById('body_id').appendChild(logoutButton);
            console.log('logout btn created & added.')
            logoutButton.addEventListener('click', function() {
                location.reload();
            });

            // SUBMIT BUTTON

            const submitButton = document.createElement('button');
            submitButton.id = 'submit_button_id';
        submitButton.innerText = 'Submit';
        submitButton.classList.add('submit_button');
        document.getElementById('body_id').appendChild(submitButton);
        console.log('submit button added.');
        //loads qns then sudddenly stops from scrolling up
        
        // END OF SUBMIT FUNCTION

            // Create and set the configs_header element
            const configs_header = document.createElement('div');
            configs_header.id = 'configs_header_id';
            configs_header.innerHTML = '<h1>Your Quizzes</h1>';
            configs_header.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
          
            container.appendChild(configs_header);

            const configsContainer = document.createElement('div');
            configsContainer.className = 'configs-container';
            container.appendChild(configsContainer);

            data.forEach((config, index) => {
                const module_name_name = config.module_name;
                const quizDiv = document.createElement('div');
                const validityStart = new Date(config.validity_start);
                const validityStartTime = validityStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const validityEnd = new Date(config.validity_end);
                const validityEndTime = validityEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                quizDiv.className = 'config-widget'; // Ensure class name matches the CSS class you want to style
                quizDiv.innerHTML = `
                    <h1>Quiz ${index+1} On ${module_name_name}</h1>
                    <p>You must score a minimum of: ${config.cutoff}% to pass this quiz.</p>
                    <p>Valid from ${validityStartTime} to ${validityEndTime}.</p>
                    <p>Number of Questions: ${config.number_of_questions}</p>
                    <p>You must complete this quiz within ${config.duration} hours</p>
                    <p style="color:red">Note: You can only submit a question ONCE.</p>
                    <p class="config_button_style" id='take_quiz_id'>Take Quiz</p>
                `;

                configsContainer.appendChild(quizDiv);
                //const config_button = document.createElement('button');
                //config_button.innerHTML = 'Take Quiz';
                //config_button.classList.add('config_button_style')
                //config_button.appendChild(config_button);
                


                //document.getElementById(`take_quiz_id${index+1}`).addEventListener('click', fetchAndDisplayQuestions);
                quizDiv.addEventListener('click', fetchAndDisplayQuestions);
                //document.getElementById('take_quiz_id').addEventListener('click', quizDiv.click());


                console.log(`take_quiz_id${index+1}`);
                //document.getElementById('take_quiz_id').addEventListener('click', function() {
                //    console.log('fetchqns called.');
                //    configsContainer.style.visibility = 'hidden';
                //    fetchAndDisplayQuestions(); // Call fetchAndDisplayQuestions when quizDiv is clicked
                //});
            container.style.visibility = 'visible';
            container.style.display = 'flex';
            container.style.paddingTop = '0px';
            container.style.flexDirection = 'column'; // Arrange the header and quizzes in a column
            container.style.backgroundColor = 'rgba(255, 255, 255, 0)'; // Set background color with opacity
            configsContainer.style.display = 'flex';
            configsContainer.style.flexWrap = 'wrap';
            

            
            });

        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
























//// BETA QN FETCH ////


function fetchAndDisplayQuestions() {
    document.getElementById('qdiv_id').style.marginTop = '1400px';
    // Fetch questions and dynamically create question elements
    fetch('http://127.0.0.1:5000/api/get-questions', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('form_id');
        console.log('identified container.');

        const qDiv = document.getElementById('qdiv_id');
        qDiv.innerHTML = ''; // Clear any existing content just incase.

        data.questions.forEach((questionData, index) => {

            // For each new question, information about that question is retrieved and 4 options are added to the dynamically created divs.

            console.log('for each loop accessed.');
            const questionDiv = document.createElement('div');
            console.log('questiondiv created.');
            questionDiv.className = 'question';
            questionDiv.dataset.correctAnswer = questionData.correct_answer;

            const questionTitle = document.createElement('h2');
            questionTitle.innerText = `${index + 1}. ${questionData.question}`;
            questionDiv.appendChild(questionTitle);
            console.log(`questiontitle created: ${questionData.question}`);

            for (let i = 1; i <= 4; i++) {
                const option = document.createElement('input');
                console.log(`correct answer: ${questionData.correct_answer}`);
                option.type = 'radio';
                option.name = `option${index}`; // Set different names for each group of radio buttons
                option.value = questionData[`option_${i}`]; // Set the value for each option
                const optionLabel = document.createElement('label');
                optionLabel.innerText = `Option ${i}: ${questionData[`option_${i}`]}`;

                questionDiv.appendChild(option);
                questionDiv.appendChild(optionLabel);
                questionDiv.appendChild(document.createElement('br')); // Add a line break for spacing
            }

            qDiv.appendChild(questionDiv);
            console.log('questionDiv appended to container.');
        });

        console.log('submit');
    })
    .catch(error => {
        console.error('Error:', error);
    });

    // defining the submit button and giving it an event listener for click. Making it display the score on the button itself
    // and remove its previous functionality

    const submitButton = document.getElementById('submit_button_id');
    submitButton.addEventListener('click', function() {
        // Count the number of questions with a checked radio button and check if the selected answer is correct
        const questionDivs = document.querySelectorAll('.question');
        let checkedCount = 0;
        let correctCount = 0;

        questionDivs.forEach(questionDiv => {
            const checkedOption = questionDiv.querySelector('input[type="radio"]:checked');
            if (checkedOption) {
                checkedCount++;
                const correctAnswer = questionDiv.dataset.correctAnswer;
                if (checkedOption.value === correctAnswer) {
                    correctCount++;
                    console.log(`Question ${checkedCount}: Correct`);
                } else {
                    console.log(`Question ${checkedCount}: Incorrect`);
                }
            }
        });

        console.log(`Number of questions with a checked radio button: ${checkedCount}`);
        console.log(`Number of correct answers: ${correctCount}`);
        submitButton.innerHTML = `Score: ${correctCount}/${questionDivs.length}`;
        submitButton.addEventListener('click', function(){
            console.log('submit button clicked again post test');
        });
        submitButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        submitButton.style.backdropFilter = "blur(10px)";
        submitButton.style.borderRadius = "20px";
        submitButton.style.fontSize = "70px";
        submitButton.style.transitionDuration = "1s";
        submitButton.style.marginTop = "-500px";
        submitButton.style.marginLeft = "700px";


        /// Sending score to mySQL DB code did not run as importing const express = require('express'); failed.

    });
}






