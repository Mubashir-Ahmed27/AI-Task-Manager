import { asyncHandler } from '../../utils/asyncHandler.js';
import { planTaskFromDescription } from './ai.service.js';

export const planTaskHandler = asyncHandler(async (req, res) => {
  const { description } = req.validatedBody;
  const plan = await planTaskFromDescription(description);

  res.status(200).json({
    success: true,
    plan,
  });
});
