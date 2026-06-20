import Property, { IProperty } from './property.model';
import { AppError } from '../../core/utils/AppError';
import mongoose from 'mongoose';

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

export const getPropertyById = async (id: string): Promise<IProperty> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid property ID format', 400);
  }

  const property = await Property.findById(id)
    .populate('ownerId', 'firstName lastName email phone profileImage')
    .populate('agentId', 'firstName lastName email phone profileImage');

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  return property;
};

export const updatePropertyById = async (id: string, updateBody: Partial<IProperty>, user: any): Promise<IProperty> => {
  const property = await getPropertyById(id);

  if (property.ownerId._id.toString() !== user._id.toString() && user.role !== 'Admin') {
    throw new AppError('User not authorized to update this property', 403);
  }

  Object.assign(property, updateBody);
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
