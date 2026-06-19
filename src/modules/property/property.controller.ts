import { Request, Response } from 'express';
import Property from './property.model';

// @desc    Get all properties
// @route   GET /api/properties
export const getProperties = async (req: Request, res: Response) => {
  try {
    const { type, minPrice, maxPrice, city } = req.query;
    let query: any = {};

    if (type) query.propertyType = type;
    if (city) query['location.city'] = new RegExp(city as string, 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const properties = await Property.find(query).populate('ownerId', 'firstName lastName').populate('agentId', 'firstName lastName');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('ownerId', 'firstName lastName email phone profileImage')
      .populate('agentId', 'firstName lastName email phone profileImage');

    if (property) {
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a property
// @route   POST /api/properties
export const createProperty = async (req: Request, res: Response) => {
  try {
    const property = new Property({
      ...req.body,
      ownerId: (req as any).user._id,
    });

    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(400).json({ message: 'Invalid property data', error });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Ensure only owner or admin can update
    if (property.ownerId.toString() !== (req as any).user._id.toString() && (req as any).user.role !== 'Admin') {
      return res.status(403).json({ message: 'User not authorized to update this property' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProperty);
  } catch (error) {
    res.status(400).json({ message: 'Invalid property data' });
  }
};

// @desc    Assign an agent to a property
// @route   PUT /api/properties/:id/assign
export const assignAgent = async (req: Request, res: Response) => {
    try {
      const { agentId } = req.body;
      const property = await Property.findById(req.params.id);
  
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
  
      // Only owner can assign agent
      if (property.ownerId.toString() !== (req as any).user._id.toString()) {
        return res.status(403).json({ message: 'Only owner can assign an agent' });
      }
  
      property.agentId = agentId;
      await property.save();
      
      res.json({ message: 'Agent assigned successfully', property });
    } catch (error) {
      res.status(400).json({ message: 'Error assigning agent' });
    }
};
