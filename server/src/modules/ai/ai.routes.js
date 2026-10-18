import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { validatePlanTaskRequest } from './ai.validation.js';
import { planTaskHandler } from './ai.controller.js';

const router = Router();

router.post('/plan-task', validateRequest(validatePlanTaskRequest), planTaskHandler);

export default router;
