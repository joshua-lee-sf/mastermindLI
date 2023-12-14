import { Router } from "express";
import { createNewUser, loginUser, getCurrentUser } from "../controllers/users.js";


const userRouter = Router();

userRouter.post('/login', loginUser);
userRouter.get('/getcurrentuser', getCurrentUser);
userRouter.post('/register', createNewUser);

export default userRouter;