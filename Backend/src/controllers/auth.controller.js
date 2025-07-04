import User from "../models/User.js";
import {upsertStreamUser} from "../lib/stream.js"
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const idx = Math.floor(Math.random() * 100) + 1;
        const randomAvt = `https://avatar.iran.liara.run/public/${idx}.png`;

        const newUser = await User.create({
            fullName,
            email,
            password,
            profilePic: randomAvt,
        });

        try {
            await upsertStreamUser({
                id:newUser._id.toString(),
                name:newUser.fullName,
                image:newUser.profilePic || ""
            })
            console.log(`stream user Created ${newUser.fullName}`);
        }catch (error) {
            console.log("error creating upsert user",error);
        }


        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(201).json({ success: true, user: newUser });
    } catch (err) {
        console.log("Signup controller error", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async(req, res) => {
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({ message: "Invaild credentials" });
        } 
    
        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect){
            return res.status(401).json({ message: "Invaild credentials" });
        } 

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({ success: true,user})
    } catch (err) {
        console.log("login controller error", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }  
};

export const logout = (req, res) => {
    res.clearCookie("jwt")
    return res.status(200).json({ success: true,message: "Logout successful"})
};

export const onboard = async(req, res) => {
    try {
        const userId = req.user._id;

        const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body;

        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({
                message: "All field are required",
                missingFields: [
                  !fullName && "Full Name",
                  !bio && "Bio", 
                  !nativeLanguage && "Native Language",
                  !learningLanguage && "Learning Language", 
                  !location && "Location"
                ].filter(Boolean)
            })
        }

        const updateUser = await User.findByIdAndUpdate(
            userId,
           {
            ...req.body,
            isOnboarded: true
           },
           { new:true }
        );
        if(!updateUser){
            return res.status(404).json({ message: "user not found"});
        }
        
        try {
            await upsertStreamUser({
                id:updateUser._id.toString(),
                name:updateUser.fullName,
                image:updateUser.profilePic || ""
            })
            console.log(`stream user Updated ${updateUser.fullName}`);
        }catch (error) {
            console.log("Error updating stream user",error);
        }
         
        return res.status(200).json({success: true, updateUser});

    } catch (error) {
        console.log("Error Onboarding controller:",error)
        return res.status(500).json({message: "Internal server error"})
    }
};
