import {
  getDatabase,
  ref,
  get,
  update,
  onValue,
  off,
  remove,
} from "firebase/database";

export function subscribeToFriendRequests(onChange) {
  const db = getDatabase();
  const user = JSON.parse(localStorage.getItem("user"));
  const friendRequestsUidsRef = ref(
    db,
    "users/" + user.uid + "/friendRequests"
  );

  // Subscribe to friend requests changes
  onValue(friendRequestsUidsRef, (snapshot) => {
    const friendRequestsUids = snapshot.val();

    if (!friendRequestsUids) {
      onChange([]); // Return an empty array when there are no friend requests
      return;
    }

    const friendRequestsListUids = Object.keys(friendRequestsUids);
    const friendRequestsList = [];

    // Loop through friend requests to get user data
    Promise.all(
      friendRequestsListUids.map(async (friendUid) => {
        const friendDataRef = ref(db, "users/" + friendUid.trim());
        const friendDataSnapshot = await get(friendDataRef);
        const friendData = friendDataSnapshot.val();
        friendRequestsList.push({ uid: friendUid, ...friendData });
      })
    ).then(() => {
      onChange(friendRequestsList);
    });
  });

  // Return a cleanup function to unsubscribe from the listener when the component unmounts
  return () => {
    off(friendRequestsUidsRef);
  };
}

export async function fetchFriendsList() {
  const db = getDatabase();
  const user = JSON.parse(localStorage.getItem("user"));
  const friendsRef = ref(db, "users/" + user.uid + "/friends");
  const friendsSnapshot = await get(friendsRef);
  const friendsData = friendsSnapshot.val();

  if (!friendsData) {
    return []; // Return an empty array when there are no friends
  }

  const friendsList = Object.values(friendsData);
  return friendsList;
}

export async function updateFriendRequest(friendUid, action) {
  const db = getDatabase();
  const user = JSON.parse(localStorage.getItem("user"));

  const updates = {};
  const removeUpdates = {};
  console.log("users/" + friendUid + "/pendingFriendRequests/" + user.uid);

  updates["users/" + user.uid + "/friendRequests/" + friendUid] = null;

  removeUpdates["users/" + friendUid + "/pendingFriendRequests/" + user.uid] =
    null;

  if (action === "accept") {
    // Add the friend to the user's friends list with UID and username
    const friendDataRef = ref(db, "users/" + friendUid.trim());
    const friendDataSnapshot = await get(friendDataRef);
    const friendData = friendDataSnapshot.val();

    updates["users/" + user.uid + "/friends/" + friendUid] = {
      uid: friendUid,
      username: friendData.username,
    };

    updates["users/" + friendUid + "/friends/" + user.uid] = {
      uid: user.uid,
      username: localStorage.getItem("username"),
    };
  }

  await update(ref(db), updates);
  await update(ref(db), removeUpdates);

  return; // No need to return a value here as it's not used.
}
