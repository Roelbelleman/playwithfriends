import React, { useState, useEffect } from "react";
import SearchUsers from "./SearchUsers";
import { fetchFriendsList, fetchFriendRequests } from "./firebase";
import FriendRequests from "./FriendRequests";
import AllFriends from "./AllFriends";

function Friends() {
  const [uiState, setUiState] = useState("friends");
  const [friendsList, setFriendsList] = useState([]);

  const showFriendListUi = () => {
    fetchFriendsList().then((data) => {
      setFriendsList(data);
    });
    setUiState("friendList");
  };

  const showAddFriendsUi = () => {
    setUiState("addFriends");
  };
    const showFriendsRequestsUi = () => {
      setUiState("friendRequests");
    };

  return (
    <div>
      <button onClick={showFriendListUi}>friends List</button>
      <button onClick={showAddFriendsUi}>add friends</button>
      <button onClick={showFriendsRequestsUi}>Friend Requests</button>
      <br />
      {/* Render the appropriate UI based on the state */}
      {uiState === "addFriends" && <SearchUsers />}
      {uiState === "friendRequests" && (
        <>
          <h2>Friend Requests</h2>
          <FriendRequests />
        </>
      )}
      {uiState === "friendList" && (
        <>
          <h2>All Friends</h2>
          <AllFriends friendsList={friendsList} invite={false} />
        </>
      )}
    </div>
  );
}

export default Friends;
