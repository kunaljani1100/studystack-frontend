import React, { useState } from 'react';
import './UserAuthentication.css';

function CreateNewUser({ onBack }) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const request = {
      firstName,
      middleName: middleName || '',
      lastName,
      phoneNumber,
      username,
      password,
      textingIndicator: true,
      emailIndicator: true,
    };

    try {
      const response = await fetch('http://localhost:8080/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || data.result === 'Failure') {
        alert('Failed to create user. Please try again.');
      } else {
        alert('User created successfully!');
        onBack();
      }
    } catch (err) {
      console.error('User creation failed', err);
      alert('Failed to create user. See console for details.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Create New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Middle Name (Optional)"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
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
          <button type="submit" className="auth-submit">
            Create User
          </button>
        </form>

        <div className="auth-or">----------------OR----------------</div>

        <button type="button" className="auth-submit" onClick={onBack}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default CreateNewUser;
