import './UserAuthentication.css';
import ReactDOM from 'react-dom/client';
import UserDashboard from './UserDashboard';

function AuthPage() {
    return (
        <div className="UserAuth" id = "user-auth-page">
                <center><h1>User Login Page</h1></center>
                <form>
                    <center>
                        <table id = 'login-table'>
                            <tr>
                                <td><input type = 'text' placeholder='Username' id='username-field' /></td>
                            </tr>
                            <tr>
                                <td><input type = 'password' placeholder='Password' id = 'password-field'/></td>
                            </tr>
                            <tr>
                                <td><input type = 'button' value = "Submit" onClick = {AuthenticateUser} id = 'submit-button' /></td>
                            </tr>
                        </table>
                    </center>
                    <center>----------------OR----------------</center>
                    <center>
                        <table>
                            <tr>
                                <td>Forgot password?</td>
                            </tr>
                        </table>
                    </center>
                </form>
        </div>
    )
}

function AuthenticateUser() {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    const request = {
        username: document.getElementById("username-field").value,
        password: document.getElementById("password-field").value
    }
    const message = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    }
    fetch("http://localhost:8080/users/authenticate", message)
    .then(response => {
        return response.json()
    })
    .then(data => {
        if (data.result === "Failure") {
            alert("Invalid Credentials")
        } else {
            root.render (
                <UserDashboard username = {document.getElementById("username-field").value} />
            )
        }
    })
}

export default AuthPage;