import { Router, type IRouter } from "express";
import healthRouter from "./health";
import churchesRouter from "./churches";
import dashboardRouter from "./dashboard";
import profilesRouter from "./profiles";
import storageRouter from "./storage";
import teamsRouter from "./teams";
import teamScheduleRouter from "./team-schedule";
import youthProfilesRouter from "./youth-profiles";
import journeysRouter from "./journeys";
import peopleRouter from "./people";
import feedbackRouter from "./feedback";
import assistantRouter from "./assistant";
import profileHelperRouter from "./profile-helper";
import partFinderRouter from "./partfinder";
import partFinderLeadershipProfileRouter from "./partfinder-leadership-profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(churchesRouter);
router.use(dashboardRouter);
router.use(profilesRouter);
router.use(storageRouter);
router.use(teamsRouter);
router.use(teamScheduleRouter);
router.use(youthProfilesRouter);
router.use(journeysRouter);
router.use(peopleRouter);
router.use(feedbackRouter);
router.use(assistantRouter);
router.use(profileHelperRouter);
router.use(partFinderRouter);
router.use(partFinderLeadershipProfileRouter);

export default router;
