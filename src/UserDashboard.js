import React, { useState, useEffect } from "react";

function UserDashboard({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [groupQuestions, setGroupQuestions] = useState({}); // { groupId: [questions] }
  const [answersByQuestion, setAnswersByQuestion] = useState({}); // { questionId: [answers] }
  const [newQuestions, setNewQuestions] = useState({}); // text field per group
  const [newAnswers, setNewAnswers] = useState({}); // text field per question
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/users/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
      .then((res) => res.json())
      .then((data) => {
        setUserInfo(data);
        setLoading(false);

        // automatically fetch questions for all groups
        if (Array.isArray(data.groups)) {
          data.groups.forEach((group) => {
            const [_, groupId] = String(group).split("::");
            fetchQuestions(groupId);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
        setError("Failed to load user info");
        setLoading(false);
      });
  }, [username]);

  // Fetch questions for a group
  const fetchQuestions = (groupId) => {
    fetch("http://localhost:8080/groups/questions/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const questions = Array.isArray(data) ? data : data.questions || [];
        setGroupQuestions((prev) => ({ ...prev, [groupId]: questions }));

        // fetch answers for each question
        questions.forEach((q) => fetchAnswers(q.questionId));
      })
      .catch((err) => {
        console.error("Failed to fetch questions:", err);
        setGroupQuestions((prev) => ({ ...prev, [groupId]: [] }));
      });
  };

  // Fetch answers for a question
  const fetchAnswers = (questionId) => {
    fetch("http://localhost:8080/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAnswersByQuestion((prev) => ({
          ...prev,
          [questionId]: Array.isArray(data) ? data : [],
        }));
      })
      .catch((err) => {
        console.error("Failed to fetch answers:", err);
        setAnswersByQuestion((prev) => ({ ...prev, [questionId]: [] }));
      });
  };

  // Submit new question
  const handleSubmitQuestion = (groupId) => {
    const question = newQuestions[groupId]?.trim();
    if (!question) return;

    fetch("http://localhost:8080/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, groupId, question }),
    })
      .then((res) => res.json())
      .then(() => {
        setNewQuestions((prev) => ({ ...prev, [groupId]: "" }));
        fetchQuestions(groupId);
      })
      .catch((err) => console.error("Failed to submit question:", err));
  };

  // Submit new answer
  const handleSubmitAnswer = (questionId) => {
    const answer = newAnswers[questionId]?.trim();
    if (!answer) return;
    console.log("Submitting answer:", { username, questionId, answer });

    fetch("http://localhost:8080/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: username, 
        questionId: questionId, 
        answer: answer }),
    })
      .then((res) => res.json())
      .then(() => {
        setNewAnswers((prev) => ({ ...prev, [questionId]: "" }));
        fetchAnswers(questionId);
      })
      .catch((err) => console.error("Failed to submit answer:", err));
  };

  if (loading) return <p>Loading user info...</p>;
  if (error) return <p>{error}</p>;
  if (!userInfo) return <p>No user info found</p>;

  return (
    <div>
      <h1>
        {userInfo.firstName} {userInfo.middleName} {userInfo.lastName}
      </h1>
      <h2>Groups:</h2>
      <ol>
        {userInfo.groups.map((group, idx) => {
          const [groupName, groupId] = String(group).split("::");
          const questions = groupQuestions[groupId] || [];

          return (
            <li key={idx} style={{ marginBottom: "2rem" }}>
              <h3>{groupName}</h3>

              <div style={{ marginTop: "0.5rem" }}>
                <input
                  type="text"
                  placeholder={`Ask a question in ${groupName}`}
                  value={newQuestions[groupId] || ""}
                  onChange={(e) =>
                    setNewQuestions((prev) => ({
                      ...prev,
                      [groupId]: e.target.value,
                    }))
                  }
                  style={{ marginRight: "0.5rem" }}
                />
                <button onClick={() => handleSubmitQuestion(groupId)}>
                  Submit Question
                </button>
              </div>

              {questions.length > 0 &&
                questions.map((q) => (
                  <div
                    key={q.questionId}
                    style={{ marginTop: "1rem", paddingLeft: "1rem" }}
                  >
                    <strong>
                      Question: {q.question} — {q.username}
                    </strong>

                    <ul style={{ marginLeft: "1rem" }}>
                      {(answersByQuestion[q.questionId] || []).map(
                        (ans, idx) => (
                          <li key={idx}>
                            {ans.answer} — {ans.username}
                          </li>
                        )
                      )}
                    </ul>

                    <div style={{ marginTop: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Answer this question"
                        value={newAnswers[q.questionId] || ""}
                        onChange={(e) =>
                          setNewAnswers((prev) => ({
                            ...prev,
                            [q.questionId]: e.target.value,
                          }))
                        }
                        style={{ marginRight: "0.5rem" }}
                      />
                      <button onClick={() => handleSubmitAnswer(q.questionId)}>
                        Submit Answer
                      </button>
                    </div>
                  </div>
                ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default UserDashboard;
