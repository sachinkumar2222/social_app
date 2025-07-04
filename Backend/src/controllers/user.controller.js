import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUser = await User.find({
      $and: [
        {
          _id: { $ne: currentUserId },
        },
        {
          _id: { $nin: currentUser.friends },
        },
        {
          isOnboarded: true,
        },
      ],
    });

    return res.status(200).json(recommendedUser);
  } catch (error) {
    console.log("Error in getRecommendedUsers controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage location"
    );
    return res.status(200).json(user.friends);

  } catch (error) {
    console.log("Error in getMyFriends controller", error);
    return res.status(500).json({ message: "Internal server error" });    
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
   const myId = req.user.id;
   const {id:recipientId} = req.params;

   if(myId===recipientId){
     return res.status(400).json({ message: "You can't send friend request to yourself"});
   }

   const recipient = await User.findById(recipientId);
   if(!recipientId){
     return res.status(404).json({ message: "Recipicent not found" });
   }

   if(recipient.friends.includes(myId)){
     return res.status(400).json({ message: "You are already friends with this user"});
   }

   const existingRequest = await FriendRequest.findOne({
    $or:[
        {sender : myId, recipient : recipientId},
        {sender : recipientId, recipient : myId}
    ]
   });

   if(existingRequest){
    return res.status(400).json({ message: "A friend request already exists between you and this user"});
   }
   
   const friendRequest = await FriendRequest.create({
    sender : myId, 
    recipient : recipientId
   })

   return res.status(201).json(friendRequest);
  } catch (error) {
    console.log("Error in sendFriendRequest controller", error);
    return res.status(500).json({ message: "Internal server error" });    
  }
};

export const acceptFriendRequest = async(req,res) => {
    try {
        const { id: requestId} = req.params;

        const friendRequest = await FriendRequest.findById(requestId);
        if(!friendRequest){
           return res.status(404).json({ message: "Friend Request not found"});    
        }
        
        if(friendRequest.recipient.toString() !== req.user.id){
            return res.status(403).json({ message: "You are not authorized to accept this request"});    
        }

        friendRequest.status = "accepted"
        await friendRequest.save();

        await User.findByIdAndUpdate(friendRequest.sender,{
            $addToSet : {friends: friendRequest.recipient}
        })
        await User.findByIdAndUpdate(friendRequest.recipient,{
            $addToSet : {friends: friendRequest.sender}
        })

        return res.status().json({message: "Friend request accepted"})
    } catch (error) {
        console.log("Error in acceptFriendRequest controller", error);
        return res.status(500).json({ message: "Internal server error" });    
    }
}

export const getFriendRequest = async(req,res) =>{
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending",
        }).populate("sender","fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient","fullName profilePic ");

        return res.status(200).json(incomingReqs,acceptedReqs)
    } catch (error) {
        console.log("Error in getFriendRequest controller", error);
        return res.status(500).json({ message: "Internal server error" });  
    }
}

export const getOutgoingFriendReqs = async(req,res) =>{
    try {
        const outgoningRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage");

        return res.status(200).json(outgoningRequests);
    } catch (error) {
        console.log("Error in getOutgoingFriendReqs controller", error);
        return res.status(500).json({ message: "Internal server error" }); 
    }
}