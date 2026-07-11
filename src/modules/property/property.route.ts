import { Router } from 'express';
import { getProperties, getPropertyById, createProperty, updateProperty, assignAgent, updatePropertyStatus, deleteProperty } from './property.controller';
import { protect, authorize, optionalAuth } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import * as propertyValidation from './property.validation';

const router = Router();

router.route('/')
  .get(optionalAuth, validate(propertyValidation.getProperties), getProperties)
  .post(protect, authorize('Owner', 'Admin'), validate(propertyValidation.createProperty), createProperty);

router.route('/:id/status')
  .put(protect, authorize('Admin'), updatePropertyStatus);

router.route('/:id')
  .get(optionalAuth, getPropertyById)
  .put(protect, authorize('Owner', 'Admin', 'Agent'), validate(propertyValidation.updateProperty), updateProperty)
  .delete(protect, authorize('Owner', 'Admin', 'Agent'), deleteProperty);

router.route('/:id/assign')
  .put(protect, authorize('Owner'), validate(propertyValidation.assignAgent), assignAgent);

export default router;
