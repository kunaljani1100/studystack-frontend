import ReactDOM from 'react-dom/client';

function UserDashboard(props) {
    const request = {
        username: props.username
    }
    const message = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    }
    fetch("http://localhost:8080/users/get", message)
    .then(response => {
        return response.json()
    })
    .then(data => {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <div>
                <h1>Gri</h1>
                <UserInformation firstName = {data.firstName} lastName = {data.lastName} middleName = {data.middleName} groups = {data.groups}/>
            </div>
        )
    })
}

function UserInformation(props) {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    console.log(props.groups)
    root.render(
        <div>
            <h1>{props.firstName} {props.middleName} {props.lastName}</h1>
            <p>Groups you are a member of:</p>
            <p>
            {props.groups.map((group, index) => ( 
                <p><button value = {group}>{group.split("::")[0]}</button></p>
            ))}
            </p>
        </div>
    )
}

export default UserDashboard;