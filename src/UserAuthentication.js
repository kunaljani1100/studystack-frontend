import './UserAuthentication.css';
import React, { useState } from 'react';
import UserDashboard from './UserDashboard';

function AuthPage() {
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
    <div className="UserAuth" id="user-auth-page">
      <h1 style={{ textAlign: 'center' }}>User Login Page</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center' }}>
          <table id="login-table">
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <button type="submit" id="submit-button">Submit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', margin: '1em 0' }}>
          ----------------OR----------------
        </div>

        <div style={{ textAlign: 'center' }}>
          <table>
            <tbody>
              <tr>
                <td>Forgot password?</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}

export default AuthPage;
