import React, { useState, useEffect } from "react";

function UserDashboard({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [groupQuestions, setGroupQuestions] = useState({}); // { groupId: [questions] }
  const [answersByQuestion, setAnswersByQuestion] = useState({}); // { questionId: [answers] }
  const [newQuestions, setNewQuestions] = useState({}); // text field per group
  const [newAnswers, setNewAnswers] = useState({}); // text field per question
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user info
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

  // Fetch questions and all answers for a group in a single batch
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

        // Batch fetch answers for all questions in this group
        if (questions.length > 0) {
          const questionIds = questions.map((q) => q.questionId);
          fetch("http://localhost:8080/answers/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionIds: questionIds }),
          })
            .then((res) => res.json())
            .then((answersData) => {
              // answersData should be in format: { questionId: [answers] }
              setAnswersByQuestion((prev) => ({
                ...prev,
                ...answersData,
              }));
            })
            .catch((err) => console.error("Failed to fetch batch answers:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch questions:", err);
        setGroupQuestions((prev) => ({ ...prev, [groupId]: [] }));
      });
  };

  // Submit a new question
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
        fetchGroupData(groupId); // Refresh questions and answers for this group
      })
      .catch((err) => console.error("Failed to submit question:", err));
  };

  // Submit a new answer (optimistic)
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

              {/* Ask new question */}
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

              {/* Display questions with answers */}
              {questions.map((q) => (
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

                  {/* Answer input */}
                  <div>
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
