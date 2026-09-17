import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import { testRulesAgainstApplications } from '../services/rulesEngine.js';

export const getSchemes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.level && req.query.level !== 'all') {
      filter.level = req.query.level;
    }
    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === 'true';
    }

    const schemes = await Scheme.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: schemes.length, schemes });
  } catch (error) {
    next(error);
  }
};

export const getSchemeById = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }
    res.json({ success: true, scheme });
  } catch (error) {
    next(error);
  }
};

export const createScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.create(req.body);

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'CREATE_SCHEME',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      after: scheme.toObject(),
      reason: `Created new scheme ${scheme.name} (${scheme.code})`,
      ip: req.ip || '127.0.0.1'
    });

    res.status(201).json({ success: true, message: 'Scheme created successfully.', scheme });
  } catch (error) {
    next(error);
  }
};

export const updateScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    const beforeState = scheme.toObject();
    const updated = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'UPDATE_SCHEME_RULES',
      entityType: 'Scheme',
      entityId: scheme._id.toString(),
      before: beforeState,
      after: updated.toObject(),
      reason: req.body.updateReason || `Updated configuration and rules for scheme ${scheme.code}`,
      ip: req.ip || '127.0.0.1'
    });

    res.json({ success: true, message: 'Scheme rules updated successfully.', scheme: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Dry-run test scheme rules against existing applications in the database.
 * Crucial for the 30-second live demo!
 */
export const testRules = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eligibilityRules } = req.body;

    let rulesToTest = eligibilityRules;
    if (!rulesToTest) {
      const scheme = await Scheme.findById(id);
      if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
      rulesToTest = scheme.eligibilityRules;
    }

    const applications = await Application.find({ schemeId: id }).populate('applicantId');
    const simulationResult = testRulesAgainstApplications(rulesToTest, applications);

    res.json({
      success: true,
      simulation: simulationResult
    });
  } catch (error) {
    next(error);
  }
};
