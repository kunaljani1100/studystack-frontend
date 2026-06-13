import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function UserInformation(props) {
    const [questions, setQuestions] = useState([]); // State to store questions
    const [answers, setAnswers] = useState({}); // State to store answers mapped by questionId
    const [selectedGroup, setSelectedGroup] = useState(''); // State to store the selected group

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <div>
            <h1>{props.firstName} {props.middleName} {props.lastName}</h1>
            <p>Groups you are a member of:</p>
            <div>
                {props.groups.map((group, index) => (
                    <div key={index}>
                        <button value={group} onClick={() => ViewQuestionsAsked({ group, setQuestions, setAnswers, setSelectedGroup })}>
                            {group.split("::")[0]}
                        </button>
                    </div>
                ))}
            </div>
            {selectedGroup && (
                <div>
                    <h2>Questions for {selectedGroup.split("::")[0]}:</h2>
                    {questions.length > 0 ? (
                        <ul>
                            {questions.map((question) => (
                                <li key={question.questionId}>
                                    <p><strong>Question:</strong> {question.question}</p>
                                    {answers[question.questionId] && answers[question.questionId].length > 0 ? (
                                        <ul>
                                            {answers[question.questionId].map((answer, index) => (
                                                <li key={index}>
                                                    <p><strong>Answer:</strong> {answer.answer}</p>
                                                    <p><strong>By:</strong> {answer.username}</p>
                                                    <p><strong>Accuracy:</strong> {answer.accuracy}%</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No answers available for this question.</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No questions available for this group.</p>
                    )}
                </div>
            )}
        </div>
    );
}

async function ViewQuestionsAsked({ group, setQuestions, setAnswers, setSelectedGroup }) {
    const request = {
        groupId: group,
    };

    try {
        setSelectedGroup(group); // Update the selected group
        const response = await fetch('http://localhost:8080/groups/questions/view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request), // Send the groupId in the request body
        });

        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }

        const data = await response.json(); // Parse the JSON response
        const questions = data.questions || [];
        setQuestions(questions); // Update the state with the fetched questions

        // Extract question IDs
        const questionIds = questions.map((q) => q.questionId);

        // Fetch answers for the question IDs
        if (questionIds.length > 0) {
            const answersResponse = await fetch('http://localhost:8080/answers/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questionIds }), // Send the questionIds in the request body
            });

            if (!answersResponse.ok) {
                throw new Error('Failed to fetch answers');
            }

            const answersData = await answersResponse.json(); // Parse the JSON response
            setAnswers(answersData); // Update the state with the fetched answers
        } else {
            setAnswers({}); // Clear answers if no question IDs are available
        }
    } catch (error) {
        console.error('Error fetching questions or answers:', error);
        setQuestions([]); // Clear questions on error
        setAnswers({}); // Clear answers on error
    }
}

export default UserInformation;