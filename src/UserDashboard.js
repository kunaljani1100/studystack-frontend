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

  // 1️⃣ Fetch user info once on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch("http://localhost:8080/users/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();

        // Remove duplicates just in case
        const uniqueGroups = data.groups ? [...new Set(data.groups)] : [];
        setUserInfo({ ...data, groups: uniqueGroups });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError("Failed to load user info");
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [username]);

  // 2️⃣ Fetch questions for all groups whenever userInfo.groups changes
  useEffect(() => {
    if (!userInfo || !userInfo.groups) return;

    userInfo.groups.forEach((group) => {
      const [_, groupId] = String(group).split("::");
      fetchGroupData(groupId);
    });
  }, [userInfo]);

  // Fetch questions and batch answers for a group
  const fetchGroupData = async (groupId) => {
    try {
      const res = await fetch("http://localhost:8080/groups/questions/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      const questions = Array.isArray(data) ? data : data.questions || [];
      setGroupQuestions((prev) => ({ ...prev, [groupId]: questions }));

      // Batch fetch answers for all questions in this group
      if (questions.length > 0) {
        const questionIds = questions.map((q) => q.questionId);
        const ansRes = await fetch("http://localhost:8080/answers/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIds }),
        });
        const answersData = await ansRes.json();
        setAnswersByQuestion((prev) => ({ ...prev, ...answersData }));
      }
    } catch (err) {
      console.error("Failed to fetch questions or answers:", err);
      setGroupQuestions((prev) => ({ ...prev, [groupId]: [] }));
    }
  };

  // Submit a new question
  const handleSubmitQuestion = async (groupId) => {
    const question = newQuestions[groupId]?.trim();
    if (!question) return;

    try {
      await fetch("http://localhost:8080/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, groupId, question }),
      });
      setNewQuestions((prev) => ({ ...prev, [groupId]: "" }));
      fetchGroupData(groupId); // refresh questions
    } catch (err) {
      console.error("Failed to submit question:", err);
    }
  };

  // Submit a new answer (optimistic update)
  const handleSubmitAnswer = async (questionId) => {
    const answer = newAnswers[questionId]?.trim();
    if (!answer) return;

    setNewAnswers((prev) => ({ ...prev, [questionId]: "" }));

    try {
      await fetch("http://localhost:8080/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, questionId, answer }),
      });
      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), { username, answer }],
      }));
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  const handleLogout = () => {
    window.location.href = "/"; // redirect to login
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
