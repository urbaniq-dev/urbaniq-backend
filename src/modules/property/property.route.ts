import { Router } from 'express';
import { getProperties, getPropertyById, createProperty, updateProperty, assignAgent } from './property.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('Owner', 'Admin'), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('Owner', 'Admin'), updateProperty);

router.route('/:id/assign')
  .put(protect, authorize('Owner'), assignAgent);

export default router;
