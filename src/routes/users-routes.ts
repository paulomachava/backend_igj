import { Router } from "express";

import { UsersController } from "../controllers/user-controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";





const userRoutes = Router()
const usersController = new UsersController()   

userRoutes.use((req, res, next) => {
	ensureAuthenticated(req, res, next).catch(next);
});// Uncomment this line to ensure authentication for all user routes
userRoutes.get("/", usersController.getUsers)
userRoutes.get("/:id", usersController.getUserById)   
userRoutes.post("/", usersController.createUser)
userRoutes.patch("/:id", usersController.updateUser)
userRoutes.delete("/:id", usersController.deleteUser)
userRoutes.get("/role", usersController.filterUsersByRole)
userRoutes.get("/status", usersController.filterUsersByStatus)


export { userRoutes } 