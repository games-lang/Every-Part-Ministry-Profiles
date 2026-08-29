import { Router, type IRouter } from "express";
import healthRouter from "./health";
import churchesRouter from "./churches";
import dashboardRouter from "./dashboard";
import profilesRouter from "./profiles";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(churchesRouter);
router.use(dashboardRouter);
router.use(profilesRouter);
router.use(storageRouter);

export default router;
