import React, { useState, useEffect } from 'react';

function UserDashboard({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
        setError("Failed to load user info");
        setLoading(false);
      });
  }, [username]);

  const handleViewQuestions = (groupId) => {
    setSelectedGroup(groupId);
    setQuestions([]);

    fetch("http://localhost:8080/groups/questions/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }), // ✅ only send groupId
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // ✅ handle both cases (array or {questions: [...]})
        setQuestions(Array.isArray(data) ? data : data.questions || []);
      })
      .catch((err) => {
        console.error("Failed to fetch questions:", err);
        setQuestions([]);
      });
  };

  if (loading) return <p>Loading user info...</p>;
  if (error) return <p>{error}</p>;
  if (!userInfo) return <p>No user info found</p>;

  return (
    <div>
      <h1>
        {userInfo.firstName} {userInfo.middleName} {userInfo.lastName}
      </h1>
      <p>Groups you are a member of:</p>
      <div>
        {Array.isArray(userInfo.groups) && userInfo.groups.length > 0 ? (
          userInfo.groups.map((group, index) => {
            const [groupName, groupId] = String(group).split("::"); // assume "Name::ID"
            return (
              <div key={index}>
                <button onClick={() => handleViewQuestions(group)}>
                  {groupName}
                </button>
              </div>
            );
          })
        ) : (
          <p>You are not in any groups.</p>
        )}
      </div>

      {selectedGroup && (
        <div>
          <h2>Questions for Group {selectedGroup}:</h2>
          {questions.length > 0 ? (
            <ul>
              {questions.map((q) => (
                <li key={q.questionId}>
                  {q.question} <small>— {q.username}</small>
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

export default UserDashboard;
