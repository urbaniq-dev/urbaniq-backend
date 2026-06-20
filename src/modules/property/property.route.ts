import { Router, Request, Response, NextFunction } from 'express';
import { getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, assignAgent, getAgentStats, getAgentProperties } from './property.controller';
import { protect, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import * as propertyValidation from './property.validation';
import { upload } from '../../core/middlewares/upload.middleware';

const router = Router();

const parseFormDataFields = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body.location === 'string') req.body.location = JSON.parse(req.body.location);
  if (typeof req.body.features === 'string') req.body.features = JSON.parse(req.body.features);
  if (typeof req.body.amenities === 'string') req.body.amenities = JSON.parse(req.body.amenities);

  // Handle image combining here before Joi validation
  let combinedImages: string[] = [];
  if (typeof req.body.existingImages === 'string') {
    try {
      combinedImages = JSON.parse(req.body.existingImages);
    } catch (e) {
      combinedImages = [];
    }
  }

  if (req.files && Array.isArray(req.files)) {
    const newImages = req.files.map((file: any) => `/uploads/properties/${file.filename}`);
    combinedImages = [...combinedImages, ...newImages];
  }
  
  req.body.images = combinedImages;
  delete req.body.existingImages; // Remove this before Joi validation
  
  next();
};

router.route('/')
  .get(validate(propertyValidation.getProperties), getProperties)
  .post(protect, authorize('Owner', 'Admin', 'Agent'), upload.array('images', 10), parseFormDataFields, validate(propertyValidation.createProperty), createProperty);

router.route('/agent')
  .get(protect, authorize('Agent', 'Admin'), getAgentProperties);

router.route('/stats/agent')
  .get(protect, authorize('Agent', 'Admin'), getAgentStats);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('Owner', 'Admin', 'Agent'), upload.array('images', 10), parseFormDataFields, validate(propertyValidation.updateProperty), updateProperty)
  .delete(protect, authorize('Owner', 'Admin', 'Agent'), deleteProperty);

router.route('/:id/assign')
  .put(protect, authorize('Owner'), validate(propertyValidation.assignAgent), assignAgent);

export default router;
