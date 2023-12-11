import { Router } from "express";
import { createNewUser, loginUser } from "../controllers/users.js";


const userRouter = Router();

userRouter.post('/login', loginUser);
userRouter.post('/register', createNewUser);

export default userRouter;