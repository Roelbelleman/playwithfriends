import React, { useState, useEffect } from "react";
import CreateRoomForm from "./CreateRoomForm";
import JoinRoomList from "./RoomList";
import { socket } from "../App";
import { getDatabase, ref, get, update, onValue, off } from "firebase/database";

const Home = () => {
  socket.emit("leave-rooms");
  storeUsername();

  const [roomFormIsShown, setRoomFormIsShown] = useState(false);
  const [joinRoomIsShown, setJoinRoomIsShown] = useState(false);

  const createRoom = () => {
    setRoomFormIsShown(true);
  };

  const joinRoom = () => {
    setJoinRoomIsShown(true);
  };

  return (
    <>
      <button onClick={joinRoom}>Join Room</button>
      {joinRoomIsShown && <JoinRoomList />}
      <button onClick={createRoom}>Create Room</button>
      {roomFormIsShown && <CreateRoomForm />}
    </>
  );
};

async function storeUsername() {
  const db = getDatabase();
  const user = JSON.parse(localStorage.getItem("user"));
  console.log((await get(ref(db, "users/" + user.uid + "/username"))).val())
  localStorage.setItem(
    "username",
    (await get(ref(db, "users/" + user.uid + "/username"))).val()
  );
}

export default Home;
