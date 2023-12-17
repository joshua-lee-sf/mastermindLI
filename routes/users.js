import { Router } from "express";
import { createNewUser, loginUser, getCurrentUser, updateUserScore } from "../controllers/users.js";


const userRouter = Router();

userRouter.get('/getcurrentuser', getCurrentUser);
userRouter.post('/login', loginUser);
userRouter.post('/register', createNewUser);
userRouter.post('/updateuserscore', updateUserScore);

export default userRouter;