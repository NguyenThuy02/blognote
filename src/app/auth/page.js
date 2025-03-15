import React from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import { UserOutlined } from "@ant-design/icons";

function AuthPage() {
  return (
    <Router>
      <header>
        <nav>
          <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
            <li style={{ marginRight: "20px" }}>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/profile">
                <UserOutlined />
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/profile" component={Profile} />
        </Switch>
      </main>
    </Router>
  );
}

export default AuthPage;
