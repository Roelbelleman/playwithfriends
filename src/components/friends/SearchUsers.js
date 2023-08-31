import React, { useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { fetchFriendsList } from "./firebase";

function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);

  const db = getDatabase();
  const user = JSON.parse(localStorage.getItem("user"));
  const usersRef = ref(db, "userNames");

  // Handle search input and fetch search results
  const handleSearch = async (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    const friendsList = await fetchFriendsList();
    try {
      setPendingFriendRequests(
        Object.values(
          (
            await get(ref(db, "users/" + user.uid + "/pendingFriendRequests"))
          ).val()
        )
      );
    } catch {
      setPendingFriendRequests([]);
    }

    searchUsernames(searchTerm, friendsList);
  };

  // Search for usernames that match the search term and are not in the friends list
  const searchUsernames = (searchTerm, friendsList) => {
    const friendsListUsernames = friendsList.map((item) => item.username);
    get(usersRef)
      .then((snapshot) => {
        const results = snapshot.val();
        if (results) {
          const usernames = Object.keys(results).filter(
            (username) =>
              username.includes(searchTerm) &&
              !friendsListUsernames.includes(username) &&
              username !== localStorage.getItem("username")
          );
          setSearchResults(usernames);
        } else {
          setSearchResults([]);
        }
      })
      .catch((error) => {
        console.error("Error searching for users:", error);
      });
  };


  // Send a friend request to the selected user
  const sendInvite = (username) => {
    const friendUserIdRef = ref(db, "userNames/" + username);
    get(friendUserIdRef)
      .then((snapshot) => {
        const friendUserId = snapshot.val();
        const currentUser = JSON.parse(localStorage.getItem("user"));
        get(ref(db, "users/" + friendUserId + "/username")).then((snapshot) => {
          const friendUsername = snapshot.val();
          update(ref(db, "users/" + friendUserId + "/friendRequests"), {
            [currentUser.uid]: friendUsername,
          });
          update(
            ref(db, "users/" + currentUser.uid + "/pendingFriendRequests"),
            {
              [friendUserId]: friendUsername,
            }
          );
          setPendingFriendRequests([...pendingFriendRequests, username]);
          
        });
      })
      .catch((error) => {
        console.error("Error fetching friendUserId:", error);
      });
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search users..."
      />
      {searchResults.length > 0 && (
        <ul>
          {searchResults.map((username) => (
            <li key={username}>
              {username}
              <button onClick={() => sendInvite(username)}>
                {pendingFriendRequests.includes(username)
                  ? "Request sent"
                  : "Send Request"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchUsers;
