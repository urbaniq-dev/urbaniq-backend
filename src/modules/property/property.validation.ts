import Joi from 'joi';

const locationSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().optional().allow(''),
});

const featuresSchema = Joi.object({
  area: Joi.number().positive().required(),
  bedrooms: Joi.number().integer().min(0).optional(),
  bathrooms: Joi.number().min(0).optional(),
  furnishing: Joi.string().valid('Furnished', 'Semi-Furnished', 'Unfurnished').optional(),
  suitableFor: Joi.array().items(Joi.string()).optional(),
  zoning: Joi.string().valid('Residential', 'Commercial', 'Agricultural', 'Industrial').optional(),
});

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

const imageSchema = Joi.object({
  original: Joi.string().uri().required(),
  thumbnail: Joi.string().uri().required(),
});

export const createProperty = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().required(),
  location: locationSchema.required(),
  features: featuresSchema.required(),
  amenities: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(imageSchema).min(1).required(),
  documents: Joi.array().items(Joi.string().uri()).optional(),
  contactDetails: contactSchema.optional(),
  status: Joi.string().valid('Draft', 'Pending Approval', 'Approved', 'Published', 'Sold', 'Rented', 'Available', 'Pending').default('Pending Approval'),
  propertyType: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse', 'Land').required(),
});

export const updateProperty = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10),
  price: Joi.number().positive(),
  location: locationSchema,
  features: featuresSchema,
  amenities: Joi.array().items(Joi.string()),
  images: Joi.array().items(imageSchema),
  documents: Joi.array().items(Joi.string().uri()),
  contactDetails: contactSchema,
  status: Joi.string().valid('Draft', 'Pending Approval', 'Approved', 'Published', 'Sold', 'Rented', 'Available', 'Pending'),
  propertyType: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse', 'Land'),
}).min(1);

export const getProperties = Joi.object({
  type: Joi.string().valid('Villa', 'Apartment', 'Penthouse', 'Commercial', 'Townhouse', 'Land'),
  city: Joi.string(),
  minPrice: Joi.number().positive(),
  maxPrice: Joi.number().positive(),
  ownerId: Joi.string().hex().length(24),
  agentId: Joi.string().hex().length(24),
  status: Joi.string().valid('Draft', 'Pending Approval', 'Approved', 'Published', 'Sold', 'Rented'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const assignAgent = Joi.object({
  agentId: Joi.string().hex().length(24).required(),
});
