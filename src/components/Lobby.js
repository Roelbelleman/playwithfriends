import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue, get } from "firebase/database";
import AllFriends from "./friends/AllFriends";
import { fetchFriendsList } from "./friends/firebase";
import { socket } from "./App";

function Lobby() {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(0);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [leader, setLeader] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);


  useEffect(() => {
    const db = getDatabase();
    const user = JSON.parse(localStorage.getItem("user"));
    const roomNameRef = ref(db, "users/" + user.uid + "/roomName");

    // Fetch the user's friends when the component mounts
    fetchFriendsList().then((data) => {
      setFriendsList(data);
    });

    // Set up the real-time listener for the roomName node
    const roomNameListener = onValue(roomNameRef, async (snapshot) => {
      console.log("Room Info Listener Triggered");
      const roomNameValue = snapshot.val();
      console.log(snapshot.val());
      setRoomName(roomNameValue);

      if (roomNameValue) {
        const roomInfoRef = ref(db, "rooms/" + roomNameValue);

        // Set up the real-time listener for the roomInfo node
        const roomInfoListener = onValue(roomInfoRef, async (snapshot) => {
          const roomInfoValue = snapshot.val();
          console.log(roomInfoValue);
          setRoomInfo(roomInfoValue); // Update roomInfo state

          if (roomInfoValue && roomInfoValue.currentPlayers) {
            const count = roomInfoValue.currentPlayers;
            setPlayerCount(count);

            // Fetch usernames for all user IDs in parallel
            if (roomInfoValue.users) {
              const userIDs = Object.values(roomInfoValue.users);
              const usernamePromises = userIDs.map(async (userID) => {
                const usernameSnapshot = await get(
                  ref(db, "users/" + userID + "/username")
                );
                return usernameSnapshot.val();
              });

              // Wait for all promises to resolve and update the state with usernames
              const usernames = await Promise.all(usernamePromises);
              setUsersInRoom(usernames);
            }
          } else {
            navigate("/home");
          }
        });

        if (
          (await get(ref(db, `/rooms/${roomNameValue}/leader`))).val() ===
          user.uid
        ) {
          setLeader(true);
        }

        // Clean up both listeners when the component unmounts
        return () => {
          roomInfoListener();
          roomNameListener();
        };
      }
    });
  }, []);

  return (
    <>
      <div>
        <button
          onClick={() => {
            setShowFriendsList(!showFriendsList);
          }}
        >
          invite friend
        </button>
        {showFriendsList && (
          <AllFriends friendsList={friendsList} invite={true} />
        )}
      </div>
      <div>
        <p>playercount: {playerCount}</p>
        <ul>
          {usersInRoom.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div>
        {leader && (
          <button
            onClick={() => {
              socket.emit("start_game", roomName); // Emit the "start game" event
            }}
          >
            Start Game
          </button>
        )}
      </div>
    </>
  );
}

export default Lobby;
