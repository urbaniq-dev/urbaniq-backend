import { Router } from 'express';
import { getProperties, getPropertyById, createProperty, updateProperty, assignAgent } from './property.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import * as propertyValidation from './property.validation';

const router = Router();

router.route('/')
  .get(validate(propertyValidation.getProperties), getProperties)
  .post(protect, authorize('Owner', 'Admin'), validate(propertyValidation.createProperty), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('Owner', 'Admin'), validate(propertyValidation.updateProperty), updateProperty);

router.route('/:id/assign')
  .put(protect, authorize('Owner'), validate(propertyValidation.assignAgent), assignAgent);

export default router;
