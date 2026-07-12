import Property, { IProperty } from './property.model';
import Assignment from './assignment.model';
import { AppError } from '../../core/utils/AppError';
import mongoose from 'mongoose';

export const createProperty = async (propertyData: Partial<IProperty>, ownerId: string): Promise<IProperty> => {
  const property = await Property.create({
    ...propertyData,
    ownerId,
  });
  return property;
};

export const queryProperties = async (filters: any, options: any, user?: any) => {
  console.log("queryProperties called with filters:", filters, "user:", user ? user.role : "undefined");
  const query: any = {};

  if (filters.type) query.propertyType = filters.type;
  if (filters.city) query['location.city'] = new RegExp(filters.city as string, 'i');
  if (filters.ownerId) query.ownerId = filters.ownerId;
  if (filters.agentId) query.agentId = filters.agentId;
  if (filters.status) query.status = filters.status;
  
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
  }

  if (filters.bedrooms) {
    query['features.bedrooms'] = { $gte: Number(filters.bedrooms) };
  }

  if (filters.minArea || filters.maxArea) {
    query['features.area'] = {};
    if (filters.minArea) query['features.area'].$gte = Number(filters.minArea);
    if (filters.maxArea) query['features.area'].$lte = Number(filters.maxArea);
  }

  if (filters.amenities) {
    const amenitiesList = (filters.amenities as string).split(',').map(a => a.trim());
    if (amenitiesList.length > 0) {
      query.amenities = { $all: amenitiesList };
    }
  }

  // If the query contains private filters, enforce authentication
  if (filters.ownerId || filters.agentId || (filters.status && !['Approved', 'Published'].includes(filters.status))) {
    if (!user) {
      throw new AppError('Not authorized to access these properties', 401);
    }
  }

  // Security: Only show Approved or Published properties to the public/buyers
  if (!user || user.role === 'Buyer') {
    // If a specific public status is requested, use it. Otherwise default to both.
    if (filters.status && ['Approved', 'Published'].includes(filters.status)) {
       query.status = filters.status;
    } else {
       query.status = { $in: ['Approved', 'Published'] };
    }
  } else if (user.role === 'Owner') {
    // Owners can only see their own pending properties, unless they are specifically requesting their own properties.
    if (!filters.ownerId || filters.ownerId !== user._id.toString()) {
       query.status = { $in: ['Approved', 'Published'] };
    }
  } else if (user.role === 'Agent') {
    if (!filters.agentId || filters.agentId !== user._id.toString()) {
       query.status = { $in: ['Approved', 'Published'] };
    }
  }

  const page = parseInt(options.page as string, 10) || 1;
  const limit = parseInt(options.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const sortOption: { [key: string]: mongoose.SortOrder } = { [sortBy as string]: sortOrder };

  const properties = await Property.find(query)
    .populate('ownerId', 'firstName lastName email profileImage')
    .populate('agentId', 'firstName lastName email profileImage')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Property.countDocuments(query);

  return {
    properties,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPropertyById = async (id: string, user?: any): Promise<any> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid property ID format', 400);
  }

  const property = await Property.findById(id)
    .populate('ownerId', 'firstName lastName email phone profileImage')
    .populate('agentId', 'firstName lastName email phone profileImage');

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Find the latest assignment request for this property
  const assignment = await Assignment.findOne({ propertyId: id })
    .populate('agentId', 'firstName lastName email phone profileImage')
    .sort({ createdAt: -1 });

  // Security checks: if property is not Approved/Published, restrict to Admin or the Property Owner
  if (property.status !== 'Approved' && property.status !== 'Published') {
    if (!user) {
      throw new AppError('Not authorized to view this property', 401);
    }
    const isOwner = property.ownerId._id.toString() === user._id.toString();
    const isAssignedAgent = property.agentId && property.agentId._id.toString() === user._id.toString();
    const isPendingAgent = assignment && assignment.agentId._id.toString() === user._id.toString() && assignment.status === 'Pending';
    
    if (user.role !== 'Admin' && !isOwner && !isAssignedAgent && !isPendingAgent) {
      throw new AppError('Not authorized to view this property', 403);
    }
  }

  return {
    ...property.toObject(),
    latestAssignment: assignment || null,
  };
};

export const updatePropertyById = async (id: string, updateBody: Partial<IProperty>, user: any): Promise<IProperty> => {
  const property = await Property.findById(id);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId.toString() === user._id.toString();
  const isAssignedAgent = property.agentId && property.agentId.toString() === user._id.toString();
  const isAdmin = user.role === 'Admin';

  if (!isAdmin) {
    if (isOwner && property.agentId) {
      throw new AppError('Cannot edit property while it is managed by an agent', 403);
    }
    if (!isOwner && !isAssignedAgent) {
      throw new AppError('User not authorized to update this property', 403);
    }
  }

  property.set(updateBody);
  await property.save();

  return property;
};

export const assignAgentToProperty = async (propertyId: string, agentId: string, ownerId: string): Promise<IProperty> => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
     throw new AppError('Invalid agent ID format', 400);
  }

  const property = await getPropertyById(propertyId);

  if (property.ownerId._id.toString() !== ownerId.toString()) {
    throw new AppError('Only the owner can assign an agent', 403);
  }

  property.agentId = new mongoose.Types.ObjectId(agentId);
  await property.save();

  return property;
};

export const updatePropertyStatus = async (propertyId: string, status: string): Promise<IProperty> => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    throw new AppError('Invalid property ID format', 400);
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  property.status = status as any;
  await property.save();
  return property;
};

export const deletePropertyById = async (propertyId: string, user: any): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    throw new AppError('Invalid property ID format', 400);
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId.toString() === user._id.toString();
  const isAdmin = user.role === 'Admin';
  const isAssignedAgent = property.agentId && property.agentId.toString() === user._id.toString();

  if (!isAdmin && !isOwner && !isAssignedAgent) {
    throw new AppError('Not authorized to delete this property', 403);
  }

  // Also remove associated assignments
  await Assignment.deleteMany({ propertyId });
  await Property.findByIdAndDelete(propertyId);
};
