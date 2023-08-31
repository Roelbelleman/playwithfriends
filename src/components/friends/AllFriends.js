import React from "react";
import { inviteFriend } from "./firebase";

function AllFriends({ friendsList, invite }) {
  const handleInvite = (friendUid) => {
    // Handle the logic for inviting the friend
    console.log("Invited friend with UID:", friendUid);
    // Add your invite logic here (e.g., send a notification, etc.)
  };
  console.log(friendsList);
  return (
    <div>
      {friendsList.length === 0 ? (
        <p>You currently have no friends.</p>
      ) : (
        <ul>
          {/* Display the list of all friends with invite buttons */}
          {friendsList.map((friend, index) => (
            <li key={index}>
              {friend.username}{" "}
              {/* Assuming there's a 'name' property in the friend object */}
              {invite && (
                <button onClick={() => handleInvite(friend.uid)}>Invite</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AllFriends;
