import React, { useState, useEffect } from "react";
import './UserDashboard.css'; // Keep the same CSS file

function UserDashboard({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [groupQuestions, setGroupQuestions] = useState({});
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [newQuestions, setNewQuestions] = useState({});
  const [newAnswers, setNewAnswers] = useState({});
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
        if (Array.isArray(data.groups)) {
          data.groups.forEach((group) => {
            const [_, groupId] = String(group).split("::");
            fetchGroupData(groupId);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
        setError("Failed to load user info");
        setLoading(false);
      });
  }, [username]);

  const fetchGroupData = (groupId) => {
    fetch("http://localhost:8080/groups/questions/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const questions = Array.isArray(data) ? data : data.questions || [];
        setGroupQuestions((prev) => ({ ...prev, [groupId]: questions }));
        if (questions.length > 0) {
          const questionIds = questions.map((q) => q.questionId);
          fetch("http://localhost:8080/answers/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionIds }),
          })
            .then((res) => res.json())
            .then((answersData) => {
              setAnswersByQuestion((prev) => ({ ...prev, ...answersData }));
            })
            .catch((err) => console.error("Failed to fetch batch answers:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch questions:", err);
        setGroupQuestions((prev) => ({ ...prev, [groupId]: [] }));
      });
  };

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
        fetchGroupData(groupId);
      })
      .catch((err) => console.error("Failed to submit question:", err));
  };

  const handleSubmitAnswer = (questionId) => {
    const answer = newAnswers[questionId]?.trim();
    if (!answer) return;

    setNewAnswers((prev) => ({ ...prev, [questionId]: "" }));

    fetch("http://localhost:8080/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, questionId, answer }),
    })
      .then((res) => res.json())
      .then(() => {
        setAnswersByQuestion((prev) => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), { username, answer }],
        }));
      })
      .catch((err) => console.error("Failed to submit answer:", err));
  };

  const handleLogout = () => {
    window.location.href = "/"; // redirect to login page
  };

  if (loading) return <p className="loading-text">Loading user info...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!userInfo) return <p className="error-text">No user info found</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {userInfo.firstName} {userInfo.middleName} {userInfo.lastName}
        </h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="groups-container">
        {userInfo.groups.map((group, idx) => {
          const [groupName, groupId] = String(group).split("::");
          const questions = groupQuestions[groupId] || [];

          return (
            <div key={idx} className="group-card">
              <h2 className="group-title">{groupName}</h2>

              <div className="new-question">
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
                />
                <button onClick={() => handleSubmitQuestion(groupId)}>Submit</button>
              </div>

              <div className="questions-list">
                {questions.map((q) => (
                  <div key={q.questionId} className="question-card">
                    <div className="question-text">
                      <strong>{q.question}</strong> — {q.username}
                    </div>

                    <ul className="answers-list">
                      {(answersByQuestion[q.questionId] || []).map((ans, i) => (
                        <li key={i}>
                          {ans.answer} — {ans.username}
                        </li>
                      ))}
                    </ul>

                    <div className="new-answer">
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
                      />
                      <button onClick={() => handleSubmitAnswer(q.questionId)}>Submit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserDashboard;
