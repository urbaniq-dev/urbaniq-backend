import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import * as propertyService from './property.service';

// @desc    Get all properties (with pagination and filters)
// @route   GET /api/properties
export const getProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await propertyService.queryProperties(req.query, req.query);
  
  res.status(200).json({
    success: true,
    data: result.properties,
    meta: result.meta,
  });
});

// @desc    Get single property
// @route   GET /api/properties/:id
export const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const property = await propertyService.getPropertyById(req.params.id as string);
  
  res.status(200).json({
    success: true,
    data: property,
  });
});

// @desc    Create a property
// @route   POST /api/properties
export const createProperty = catchAsync(async (req: Request, res: Response) => {
  const ownerId = (req as any).user._id.toString();
  const property = await propertyService.createProperty(req.body, ownerId);
  
  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: property,
  });
});

// @desc    Update a property
// @route   PUT /api/properties/:id
export const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const property = await propertyService.updatePropertyById(req.params.id as string, req.body, (req as any).user);
  
  res.status(200).json({
    success: true,
    message: 'Property updated successfully',
    data: property,
  });
});

// @desc    Assign an agent to a property
// @route   PUT /api/properties/:id/assign
export const assignAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.body;
  const ownerId = (req as any).user._id.toString();
  
  const property = await propertyService.assignAgentToProperty(req.params.id as string, agentId, ownerId);
  
  res.status(200).json({
    success: true,
    message: 'Agent assigned successfully',
    data: property,
  });
});
