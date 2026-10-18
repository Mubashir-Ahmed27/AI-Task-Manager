import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskIdParam,
} from './task.validation.js';
import {
  createTaskHandler,
  listTasksHandler,
  getTaskByIdHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from './task.controller.js';

const router = Router();

router
  .route('/')
  .get(listTasksHandler)
  .post(validateRequest(validateCreateTask), createTaskHandler);

router
  .route('/:id')
  .get(validateRequest(validateTaskIdParam), getTaskByIdHandler)
  .put(validateRequest(validateUpdateTask), updateTaskHandler)
  .delete(validateRequest(validateTaskIdParam), deleteTaskHandler);

export default router;
