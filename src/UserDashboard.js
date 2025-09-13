import React, { useState, useEffect } from "react";
import './UserDashboard.css';

function UserDashboard({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [groupQuestions, setGroupQuestions] = useState({});
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [newQuestions, setNewQuestions] = useState({});
  const [newAnswers, setNewAnswers] = useState({});
  const [newGroupName, setNewGroupName] = useState("");
  const [addUserInputs, setAddUserInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const res = await fetch("http://localhost:8080/users/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      const uniqueGroups = data.groups ? [...new Set(data.groups)] : [];
      setUserInfo({ ...data, groups: uniqueGroups });
      setLoading(false);
    } catch (err) {
      console.error("Failed to load user info:", err);
      setError("Failed to load user info");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [username]);

  // Fetch questions and answers for all groups
  useEffect(() => {
    if (!userInfo?.groups?.length) return;

    const fetchAllGroups = async () => {
      try {
        const results = await Promise.all(
          userInfo.groups.map(async (groupKey) => {
            const res = await fetch("http://localhost:8080/groups/questions/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ groupId: groupKey }),
            });
            const data = await res.json();
            const questions = Array.isArray(data) ? data : data.questions || [];

            let answersData = {};
            if (questions.length > 0) {
              const questionIds = questions.map((q) => q.questionId);
              const ansRes = await fetch("http://localhost:8080/answers/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionIds }),
              });
              answersData = await ansRes.json();
            }

            return { groupKey, questions, answersData };
          })
        );

        const questionsState = {};
        const answersState = {};
        results.forEach(({ groupKey, questions, answersData }) => {
          questionsState[groupKey] = questions;
          Object.assign(answersState, answersData);
        });

        setGroupQuestions(questionsState);
        setAnswersByQuestion(answersState);
      } catch (err) {
        console.error("Failed to fetch groups/questions:", err);
      }
    };

    fetchAllGroups();
  }, [userInfo?.groups]);

  // Submit new question
  const handleSubmitQuestion = async (groupKey) => {
    const question = newQuestions[groupKey]?.trim();
    if (!question) return;

    try {
      await fetch("http://localhost:8080/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, groupId: groupKey, question }),
      });

      // Optimistically update state
      setGroupQuestions((prev) => ({
        ...prev,
        [groupKey]: [...(prev[groupKey] || []), { username, question, questionId: Date.now().toString() }],
      }));
      setNewQuestions((prev) => ({ ...prev, [groupKey]: "" }));
    } catch (err) {
      console.error("Failed to submit question:", err);
    }
  };

  // Submit new answer
  const handleSubmitAnswer = async (questionId, groupKey) => {
    const answer = newAnswers[questionId]?.trim();
    if (!answer) return;
    console.log(questionId);

    try {
      const result = await fetch("http://localhost:8080/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, questionId, answer }),
      });

      const data = await result.json();
      const accuracy = data.accuracy;
      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), { username, answer, accuracy }],
      }));
      setNewAnswers((prev) => ({ ...prev, [questionId]: "" }));
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  // Create new group
  const handleCreateGroup = async () => {
    const groupName = newGroupName.trim();
    if (!groupName) return;

    try {
      const createGroupResponse = await fetch("http://localhost:8080/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName }),
      });
      const data = await createGroupResponse.json();
      const groupId = data.groupId;
      const groupKey = groupId;

      // Add current user to the group
      await fetch("http://localhost:8080/groups/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupKey, username }),
      });

      setNewGroupName("");
      setUserInfo((prev) => ({
        ...prev,
        groups: [...(prev.groups || []), groupKey],
      }));
    } catch (err) {
      console.error("Failed to create or join group:", err);
    }
  };

  // Add new user to a group
  const handleAddUser = async (groupKey) => {
    const newUser = addUserInputs[groupKey]?.trim();
    if (!newUser) return;

    try {
      await fetch("http://localhost:8080/groups/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupKey, username: newUser }),
      });
      setAddUserInputs((prev) => ({ ...prev, [groupKey]: "" }));
      alert(`User "${newUser}" added to group successfully.`);
    } catch (err) {
      console.error("Failed to add user:", err);
      alert("Failed to add user. See console for details.");
    }
  };

  const handleLogout = () => {
    window.location.href = "/";
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

      <div className="create-group">
        <input
          type="text"
          className="input-text"
          placeholder="Enter new group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button className="logout-button" onClick={handleCreateGroup}>
          Create & Join Group
        </button>
      </div>

      <div className="groups-container">
        {userInfo.groups.map((groupKey) => {
          const [groupName] = groupKey.split("::");
          const questions = groupQuestions[groupKey] || [];

          return (
            <div key={groupKey} className="group-card">
              <h2 className="group-title">{groupName}</h2>

              {/* Add User Section */}
              <div className="add-user">
                <input
                  type="text"
                  className="input-text add-user-input"
                  placeholder="Enter username to add"
                  value={addUserInputs[groupKey] || ""}
                  onChange={(e) =>
                    setAddUserInputs((prev) => ({
                      ...prev,
                      [groupKey]: e.target.value,
                    }))
                  }
                />
                <button
                  className="add-user-button"
                  onClick={() => handleAddUser(groupKey)}
                >
                  ➕ Add User
                </button>
              </div>

              {/* New Question Section */}
              <div className="new-question">
                <input
                  type="text"
                  placeholder={`Ask a question in ${groupName}`}
                  value={newQuestions[groupKey] || ""}
                  onChange={(e) =>
                    setNewQuestions((prev) => ({
                      ...prev,
                      [groupKey]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleSubmitQuestion(groupKey)}>Submit</button>
              </div>

              {/* Questions List */}
              <div className="questions-list">
                {questions.map((q) => (
                  <div key={q.questionId} className="question-card">
                    <div className="question-text">
                      <strong>{q.question}</strong> — {q.username}
                    </div>

                    <ul className="answers-list">
                      {(answersByQuestion[q.questionId] || []).map((ans, i) => (
                        <li key={i} className="answer-card">
                        <p className="answer-text">{ans.answer}</p>
                        <p className="answer-meta">
                          <span className="answer-user">{ans.username}</span> — 
                          <span className="answer-accuracy">Accuracy: {ans.accuracy}</span>
                        </p>
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
                      <button onClick={() => handleSubmitAnswer(q.questionId, groupKey)}>
                        Submit
                      </button>
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
