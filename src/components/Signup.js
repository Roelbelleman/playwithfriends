import React, { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import { getDatabase, ref, set, update, get } from "firebase/database";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function writeUserData(userId, name, email) {
    const db = getDatabase();
    const usernameRef = ref(db, "userNames");
    const snapshot = await get(usernameRef);
    const usernames = Object.keys(snapshot.val() || {});
    console.log(usernames);

    let newUsername =
      username + "|" + String(Math.floor(1000 + Math.random() * 9000));

    // Generate a different random number if the username already exists
    while (usernames.includes(newUsername)) {
      newUsername =
        username + "|" + String(Math.floor(1000 + Math.random() * 9000));
    }

    setUsername(newUsername);
    update(ref(db, "userNames"), { [newUsername]: userId });
    set(ref(db, `users/${userId}`), {
      username: newUsername,
      email: email,
      room: null,
    });
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const db = getDatabase();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      dispatch({ type: "LOGIN", payload: user });
      console.log(user);
      await writeUserData(user.uid, username, user.email);
      navigate("/home");
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    }
  };

const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log(user);
    dispatch({ type: "LOGIN", payload: user });
    await writeUserData(user.uid, user.displayName, user.email);
    navigate("/home");
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData ? error.customData.email : null;
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.log(errorCode, errorMessage);
  }
};


  const facebookLogin = () => {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        const credential = FacebookAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = FacebookAuthProvider.credentialFromError(error);
        console.log(errorCode, errorMessage);
      });
  };

  return (
    <main>
      <section>
        <div>
          <div>
            <h1>FocusApp</h1>
            <form>
              <div>
                <label htmlFor="email-address">Email address</label>
                <input
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Username"
                />
              </div>
              <div>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  label="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                />
              </div>
              <button type="submit" onClick={onSubmit}>
                Sign up
              </button>
            </form>
            <button onClick={googleLogin}>Google</button>
            <button onClick={facebookLogin}>Facebook</button>
            <p>
              Already have an account? <NavLink to="/login">Sign in</NavLink>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Signup;
