import { Request, Response } from 'express';
import Assignment from './assignment.model';
import Property from './property.model';
import { emitToUser } from '../../socket';

// @desc    Create an assignment request
// @route   POST /api/assignments
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { propertyId, agentId, commissionInfo } = req.body;
    const ownerId = (req as any).user._id;

    // Verify property belongs to owner
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign agent to this property' });
    }

    const assignment = new Assignment({
      propertyId,
      ownerId,
      agentId,
      commissionInfo,
      status: 'Pending'
    });

    const createdAssignment = await assignment.save();
    
    // Emit event to the specific agent
    emitToUser(agentId.toString(), 'new_assignment_request', createdAssignment);

    res.status(201).json(createdAssignment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating assignment request' });
  }
};

// @desc    Get assignments for a user
// @route   GET /api/assignments
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;
    const userId = (req as any).user._id;

    let assignments;
    if (role === 'Owner') {
      assignments = await Assignment.find({ ownerId: userId })
        .populate('propertyId', 'title location price status')
        .populate('agentId', 'firstName lastName email phone');
    } else if (role === 'Agent') {
      assignments = await Assignment.find({ agentId: userId })
        .populate('propertyId', 'title location price status')
        .populate('ownerId', 'firstName lastName email phone');
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Respond to an assignment request (Agent only)
// @route   PUT /api/assignments/:id/respond
export const respondToAssignment = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Verify the logged in user is the agent assigned
    if (assignment.agentId.toString() !== (req as any).user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    assignment.status = status;
    await assignment.save();

    // If accepted, update the property to assign the agent
    if (status === 'Accepted') {
      await Property.findByIdAndUpdate(assignment.propertyId, { agentId: assignment.agentId });
    }

    // Emit event to the owner who created the assignment
    emitToUser(assignment.ownerId.toString(), 'assignment_responded', assignment);

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
