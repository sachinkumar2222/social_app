import express from "express";
import {login,logout,signup,onboard} from "../controllers/auth.controller.js"
import {protectRoute} from "../middleware/auth.middleware.js"

const router = express.Router();

router.post('/login',login);
router.post('/signup',signup);
router.post('/logout',logout);

router.post('/onboarding',protectRoute,onboard);

export default router;