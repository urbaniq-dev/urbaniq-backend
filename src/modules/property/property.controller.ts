import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import * as propertyService from './property.service';

// @desc    Get all properties (with pagination and filters)
// @route   GET /api/properties
export const getProperties = catchAsync(async (req: Request, res: Response) => {
  // Public listing should only show Available or Pending properties
  const filters = { 
    ...req.query, 
    status: { $in: ['Available', 'Pending'] } 
  };
  const result = await propertyService.queryProperties(filters, req.query);
  
  res.status(200).json({
    success: true,
    data: result.properties,
    meta: result.meta,
  });
});

// @desc    Get properties for the logged-in agent
// @route   GET /api/properties/agent
export const getAgentProperties = catchAsync(async (req: Request, res: Response) => {
  const agentId = (req as any).user._id.toString();
  const filters = { ...req.query, agentId };
  
  const result = await propertyService.queryProperties(filters, req.query);
  
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
  const user = (req as any).user;
  let data = { ...req.body };

  // If user is agent, set agentId. Otherwise set ownerId.
  if (user.role === 'Agent') {
    data.agentId = user._id;
    // Agent must specify an ownerId, or we fallback to themselves as owner for simplicity
    if (!data.ownerId) data.ownerId = user._id; 
  } else {
    data.ownerId = user._id;
  }

  const property = await propertyService.createProperty(data, data.ownerId);
  
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

// @desc    Delete a property
// @route   DELETE /api/properties/:id
export const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  await propertyService.deletePropertyById(req.params.id as string, (req as any).user);
  
  res.status(200).json({
    success: true,
    message: 'Property deleted successfully',
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

// @desc    Get property statistics for an agent
// @route   GET /api/properties/stats/agent
export const getAgentStats = catchAsync(async (req: Request, res: Response) => {
  const agentId = (req as any).user._id.toString();
  
  const stats = await propertyService.getAgentPropertyStats(agentId);
  
  res.status(200).json({
    success: true,
    data: stats,
  });
});
