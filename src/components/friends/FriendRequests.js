import React, { useState, useEffect } from "react";
import { updateFriendRequest, subscribeToFriendRequests } from "./firebase";

function FriendRequests() {
  const [friendRequestsList, setFriendRequestsList] = useState([]);

    useEffect(() => {
      // Subscribe to friend requests changes when the component mounts
      const unsubscribe = subscribeToFriendRequests((data) => {
        setFriendRequestsList(data);
      });
      console.log(friendRequestsList);

      // Return a cleanup function to unsubscribe from the listener when the component unmounts
      return () => {
        unsubscribe();
      };
    }, []);


  const handleAccept = (friend) => {
    // Handle the logic for accepting the friend request
    console.log("Accepted friend request from user with UID:", friend.uid);

    // Remove the accepted friend request UID from the database and add the friend to the user's friends list
    updateFriendRequest(friend.uid, "accept")
      .then(() => {
        console.log("Friend request accepted and friend added to database.");
        // Now, you can update the UI accordingly or fetch the friend requests again to update the list
      })
      .catch((error) => {
        console.error("Error accepting friend request:", error);
      });
  };

  const handleDecline = (friendUid) => {
    // Handle the logic for declining the friend request
    console.log("Declined friend request from user with UID:", friendUid);

    // Remove the declined friend request UID from the database
    updateFriendRequest(friendUid, "decline")
      .then(() => {
        console.log("Friend request removed from database.");
        // Now, you can update the UI accordingly or fetch the friend requests again to update the list
      })
      .catch((error) => {
        console.error("Error removing friend request:", error);
      });
  };

  return (
    <div>
      <h2>Friend Requests</h2>
      {friendRequestsList.length === 0 ? (
        <p>No friend requests at the moment.</p>
      ) : (
        <ul>
          {/* Display the list of friend requests with accept and decline buttons */}
          {friendRequestsList.map((friend, index) => (
            <li key={index}>
              {friend.username}
              <button onClick={() => handleAccept(friend)}>Accept</button>
              <button onClick={() => handleDecline(friend.uid)}>Decline</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FriendRequests;
