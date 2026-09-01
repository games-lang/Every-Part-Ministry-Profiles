import { Router, type IRouter } from "express";
import healthRouter from "./health";
import churchesRouter from "./churches";
import dashboardRouter from "./dashboard";
import profilesRouter from "./profiles";
import storageRouter from "./storage";
import teamsRouter from "./teams";
import youthProfilesRouter from "./youth-profiles";
import journeysRouter from "./journeys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(churchesRouter);
router.use(dashboardRouter);
router.use(profilesRouter);
router.use(storageRouter);
router.use(teamsRouter);
router.use(youthProfilesRouter);
router.use(journeysRouter);

export default router;
