import Property, { IProperty } from './property.model';
import { AppError } from '../../core/utils/AppError';
import mongoose from 'mongoose';
import AgentProfile from '../agentProfile/agentProfile.model';

export const createProperty = async (propertyData: Partial<IProperty>, ownerId: string): Promise<IProperty> => {
  const property = await Property.create({
    ...propertyData,
    ownerId,
  });
  return property;
};

export const queryProperties = async (filters: any, options: any) => {
  const query: any = {};

  if (filters.type) query.propertyType = filters.type;
  if (filters.city) query['location.city'] = new RegExp(filters.city as string, 'i');
  if (filters.agentId) query.agentId = new mongoose.Types.ObjectId(filters.agentId as string);
  if (filters.status) query.status = filters.status;
  
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
  }

  const page = parseInt(options.page as string, 10) || 1;
  const limit = parseInt(options.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const sortOption: { [key: string]: mongoose.SortOrder } = { [sortBy as string]: sortOrder };

  const properties = await Property.find(query)
    .populate('ownerId', 'firstName lastName email')
    .populate('agentId', 'firstName lastName email')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Property.countDocuments(query);

  // Attach AgentProfile to each property where applicable
  const propertiesWithProfiles = await Promise.all(properties.map(async (prop) => {
    const propObj = prop.toObject();
    if (propObj.agentId && propObj.agentId._id) {
      const profile = await AgentProfile.findOne({ user: propObj.agentId._id });
      if (profile) {
        (propObj.agentId as any).agentProfile = profile;
      }
    }
    return propObj;
  }));

  return {
    properties: propertiesWithProfiles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPropertyById = async (id: string): Promise<IProperty> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid property ID format', 400);
  }

  const property = await Property.findById(id)
    .populate('ownerId', 'firstName lastName email')
    .populate('agentId', 'firstName lastName email');

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const propObj = property.toObject();
  if (propObj.agentId && propObj.agentId._id) {
    const profile = await AgentProfile.findOne({ user: propObj.agentId._id });
    if (profile) {
      (propObj.agentId as any).agentProfile = profile;
    }
  }

  return propObj as IProperty;
};

export const updatePropertyById = async (id: string, updateBody: Partial<IProperty>, user: any): Promise<IProperty> => {
  const property = await Property.findById(id);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId?.toString() === user._id.toString();
  const isAgent = property.agentId?.toString() === user._id.toString();
  const isAdmin = user.role === 'Admin';

  if (!isOwner && !isAgent && !isAdmin) {
    throw new AppError('User not authorized to update this property', 403);
  }

  // Business Logic: Prevent invalid status transitions
  if (updateBody.status && updateBody.status !== property.status) {
    if (property.status === 'Sold' || property.status === 'Rented') {
      throw new AppError(`A ${property.status.toLowerCase()} property cannot have its status changed.`, 400);
    }
  }

  Object.assign(property, updateBody);
  await property.save();

  return property;
};

export const deletePropertyById = async (id: string, user: any): Promise<void> => {
  const property = await Property.findById(id);
  
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId?.toString() === user._id.toString();
  const isAgent = property.agentId?.toString() === user._id.toString();
  const isAdmin = user.role === 'Admin';

  if (!isOwner && !isAgent && !isAdmin) {
    throw new AppError('User not authorized to delete this property', 403);
  }

  await Property.findByIdAndDelete(id);
};

export const assignAgentToProperty = async (propertyId: string, agentId: string, ownerId: string): Promise<IProperty> => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
     throw new AppError('Invalid agent ID format', 400);
  }

  const property = await Property.findById(propertyId);
  
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  if (property.ownerId?.toString() !== ownerId.toString()) {
    throw new AppError('Only the owner can assign an agent', 403);
  }

  property.agentId = new mongoose.Types.ObjectId(agentId);
  await property.save();

  return property;
};

export const getAgentPropertyStats = async (agentId: string) => {
  const stats = await Property.aggregate([
    { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        sold: { $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] } },
        rented: { $sum: { $cond: [{ $eq: ["$status", "Rented"] }, 1, 0] } }
      }
    }
  ]);

  if (stats.length > 0) {
    const { _id, ...rest } = stats[0];
    return rest;
  }

  return { total: 0, available: 0, pending: 0, sold: 0, rented: 0 };
};
