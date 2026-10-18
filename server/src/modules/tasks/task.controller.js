import { asyncHandler } from '../../utils/asyncHandler.js';
import * as taskService from './task.service.js';

export const createTaskHandler = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.validatedBody);
  res.status(201).json({
    success: true,
    task,
  });
});

export const listTasksHandler = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.query);
  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
});

export const getTaskByIdHandler = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json({
    success: true,
    task,
  });
});

export const updateTaskHandler = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskById(req.params.id, req.validatedBody);
  res.status(200).json({
    success: true,
    task,
  });
});

export const deleteTaskHandler = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTaskById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Task deleted successfully.',
    task,
  });
});
