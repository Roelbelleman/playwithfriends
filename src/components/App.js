import React, { useState, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import Home from "./rooms/JoinRoom";
import Signup from "./Signup";
import Login from "./Login";
import Lobby from "./Lobby";
import Friends from "./friends/friends";
import Pictionary from "./games/pictionary/pictionary";
import {
  Navigate,
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const socket = io.connect("http://localhost:3001");

function App() {
  const { currentUser } = useContext(AuthContext);
  const [gameStarted, setGameStarted] = useState(false);

  const requireAuth = (element) => {
    return currentUser ? element : <Navigate to="/login" />;
  };

  useEffect(() => {
    function onGame_started() {
      console.log("started");
      setGameStarted(true); // Assuming setGameStarted is a function that sets the gameStarted variable
    }

    socket.on("game_started", onGame_started);

    return () => {
      socket.off("game_started", onGame_started);
    };
  }, []);


  return (
    <Router>
      <div>
        <section>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/home"
              element={requireAuth(
                <>
                  <Home />
                  <Friends />
                </>
              )}
            />
            <Route
              path="/play"
              element={gameStarted ? <Pictionary /> : <Lobby />}
            />
            <Route path="/" element={<Navigate to="/home" />} />
          </Routes>
        </section>
      </div>
    </Router>
  );
}

export default App;
