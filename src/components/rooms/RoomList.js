import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, get, update } from "firebase/database";
import { socket } from "../App";
import { useNavigate } from "react-router-dom";

function JoinRoomList() {
  const navigate = useNavigate();
  const db = getDatabase();
  const roomsRef = ref(db, "rooms/");
  const [rooms, setRooms] = useState([]);
  const [joinPrivateRoom, setJoinPrivateRoom] = useState(false);
  const [joinRoomName, setJoinRoomName] = useState("");
  const [joinRoomNamePassword, setJoinRoomNamePassword] = useState("");
  const [joinRoomError, setJoinRoomError] = useState(null);

  useEffect(() => {
    const roomsListener = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      if (roomsData) {
        const filteredRooms = Object.keys(roomsData).filter((roomName) => {
          return !roomsData[roomName]?.privateroom?.enabled;
        });
        setRooms(filteredRooms);
      } else {
        setRooms([]);
      }
    });

    return () => {
      // Clean up the listener when the component is unmounted
      roomsListener();
    };
  }, []);

  const user = JSON.parse(localStorage.getItem("user"));

  async function connectRoom(userId, roomName) {
    try {
      const roomInfoRef = ref(db, "rooms/" + roomName);
      const snapshot = await get(roomInfoRef); // Wait for the snapshot to be retrieved
      const roomInfo = snapshot.val();
      
      console.log(roomInfo);
      if (
        roomInfo.maxPlayers > roomInfo.currentPlayers &&
        !Object.values(roomInfo.users).includes(user.uid)
        ) {
        await update(ref(db, "/users/" + userId), { roomName: roomName }).then(()=>{
          socket.emit("join_room", roomName, userId);
          navigate("/play");
        });
      } else {
        if (Object.values(roomInfo.users).includes(user.uid))
          setJoinRoomError("you are alredy in this room");
        else setJoinRoomError("Room is full");
      }
    } catch (error) {
      console.error("Error connecting to room:", error);
      // Handle the error accordingly
    }
  }

  function handleJoinPrivateRoom(roomName, roomPassword) {
    const roomRef = ref(db, `rooms/${roomName}`);
    const privateRoomEnabledRef = ref(
      db,
      `rooms/${roomName}/privateroom/enabled`
    );
    const privateRoomPasswordRef = ref(
      db,
      `rooms/${roomName}/privateroom/password`
    );

    get(roomRef).then((roomSnapshot) => {
      if (roomSnapshot.exists()) {
        get(privateRoomEnabledRef).then((enabledSnapshot) => {
          if (enabledSnapshot.exists() && enabledSnapshot.val() === true) {
            get(privateRoomPasswordRef).then((passwordSnapshot) => {
              if (
                passwordSnapshot.exists() &&
                passwordSnapshot.val() === roomPassword
              ) {
                connectRoom(user.uid, roomName);
              } else {
                setJoinRoomError("Invalid room password");
              }
            });
          } else {
            setJoinRoomError("Private room is not enabled");
          }
        });
      } else {
        setJoinRoomError("Room does not exist");
      }
    });
  }

  return (
    <>
      <br />
      <input
        type="checkbox"
        onChange={(e) => setJoinPrivateRoom(e.target.checked)}
      />
      <div>
        {!joinPrivateRoom &&
          rooms.map((roomName) => (
            <button
              onClickCapture={() => connectRoom(user.uid, roomName)}
              href="/play"
              key={roomName}
            >
              {roomName}
            </button>
          ))}
        {joinPrivateRoom && (
          <>
            <label htmlFor="join-room-name">Room name</label>
            <input
              id="join-room-name"
              name="join-room-name"
              type="text"
              required
              placeholder="Room name"
              onChange={(e) => setJoinRoomName(e.target.value)}
            />
            <label htmlFor="join-room-name-password">Password</label>
            <input
              id="join-room-name-password"
              name="join-room-name-password"
              type="password"
              required
              placeholder="Password"
              onChange={(e) => setJoinRoomNamePassword(e.target.value)}
            />
            <button
              onClick={() =>
                handleJoinPrivateRoom(joinRoomName, joinRoomNamePassword)
              }
            >
              Join
            </button>
          </>
        )}
        {joinRoomError && <p>{joinRoomError}</p>}
      </div>
    </>
  );
}

export default JoinRoomList;