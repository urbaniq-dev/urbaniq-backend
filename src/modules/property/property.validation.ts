import Joi from 'joi';

const locationSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().optional().allow(''),
});

const featuresSchema = Joi.object({
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().min(0).required(),
  area: Joi.number().positive().required(),
});

export const createProperty = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().required(),
  location: locationSchema.required(),
  features: featuresSchema.required(),
  amenities: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  status: Joi.string().valid('Available', 'Pending', 'Sold', 'Rented').default('Available'),
  propertyType: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse').required(),
});

export const updateProperty = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10),
  price: Joi.number().positive(),
  location: locationSchema,
  features: featuresSchema,
  amenities: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()),
  status: Joi.string().valid('Available', 'Pending', 'Sold', 'Rented'),
  propertyType: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse'),
}).min(1);

export const getProperties = Joi.object({
  type: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse'),
  city: Joi.string(),
  minPrice: Joi.number().positive(),
  maxPrice: Joi.number().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const assignAgent = Joi.object({
  agentId: Joi.string().hex().length(24).required(),
});
