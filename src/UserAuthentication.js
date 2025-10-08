import React, { useState } from 'react';
import './UserAuthentication.css';
import UserDashboard from './UserDashboard';
import CreateNewUser from './CreateNewUser';

function UserAuthentication() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page reload

    const request = { username, password };
    try {
      const response = await fetch("http://localhost:8080/users/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.result === "Failure") {
        alert("Invalid Credentials");
      } else {
        setAuthenticated(true);
      }
    } catch (err) {
      console.error("Authentication failed", err);
    }
  };

  if (authenticated) {
    return <UserDashboard username={username} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit">Login</button>
        </form>

        <div className="auth-or">----------------OR----------------</div>

        <div>
          <button onClick={CreateNewUser}>Create New User</button>
        </div>
      </div>
    </div>
  );
}

export default UserAuthentication;
