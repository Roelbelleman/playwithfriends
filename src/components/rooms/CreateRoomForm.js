
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../App";
import { getDatabase, ref, set, get, child, update } from "firebase/database";

function CreateRoomForm() {
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [error, setError] = useState("");
  const [privateRoom, setPrivateRoom] = useState(false);
  const [privateRoomPassword, setPrivateRoomPassword] = useState("");

  const navigate = useNavigate();
  const db = getDatabase();

  const fetchAllRooms = async () => {
    let allRooms = [];

    try {
      const snapshot = await get(child(ref(db), "rooms"));

      if (snapshot.exists()) {
        allRooms = Object.keys(snapshot.val());
      } else {
        console.log("No data available");
      }
    } catch (error) {
      console.error(error);
    }

    return allRooms;
  };

  const validateRoomParameters = (allRooms) => {
    if (
      roomName === "" ||
      allRooms.includes(roomName) ||
      maxPlayers < 2 ||
      maxPlayers > 15
    ) {
      setError("Invalid room parameters");
      return false;
    }

    if (
      privateRoom &&
      (privateRoomPassword.length < 4 || privateRoomPassword.length > 16)
    ) {
      setError("Password must be between 4 and 16 characters");
      return false;
    }

    return true;
  };

  const createRoom = async (user, allRooms) => {
    socket.emit("join_room", roomName, user.uid);

    const newRoomData = {
      maxPlayers: maxPlayers,
      currentPlayers: 1,
      leader: user.uid,
      privateroom: { enabled: privateRoom, password: privateRoomPassword },
    };

     await set(ref(db, `rooms/${roomName}`), newRoomData);
    update(ref(db, `users/${user.uid}`), {
      roomName,
    });

    navigate("/play");
  };

  const startRoom = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const allRooms = await fetchAllRooms();

    if (validateRoomParameters(allRooms)) {
      await createRoom(user, allRooms);
    }
  };

  return (
    <>
      <form>
        <div>
          <label htmlFor="room-name">Room name</label>
          <input
            id="room-name"
            name="room-name"
            type="text"
            required
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <label htmlFor="max-players">Maximum Players</label>
          <input
            id="max-players"
            name="max-players"
            type="number"
            required
            placeholder="2"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="private-room">Private room</label>
          <input
            id="private-room"
            name="private-room"
            type="checkbox"
            checked={privateRoom}
            onChange={(e) => setPrivateRoom(e.target.checked)}
          />
        </div>
        {privateRoom && (
          <div>
            <label htmlFor="private-room-password">Password</label>
            <input
              id="private-room-password"
              name="private-room-password"
              type="password"
              required
              placeholder="Enter password (4-16 characters)"
              value={privateRoomPassword}
              onChange={(e) => setPrivateRoomPassword(e.target.value)}
            />
          </div>
        )}
      </form>
      <div>
        <button onClick={startRoom}>Create</button>
        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}

export default CreateRoomForm;