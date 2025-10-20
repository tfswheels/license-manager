import express from 'express';
import db from '../config/database.js';
import * as templateRulesService from '../services/templateRulesService.js';

const router = express.Router();

// Get all rules for a shop
router.get('/shops/:shopId/template-rules', async (req, res) => {
  try {
    const { shopId } = req.params;
    const rules = await templateRulesService.getAllRules(shopId);
    res.json(rules);
  } catch (error) {
    console.error('Error fetching template rules:', error);
    res.status(500).json({ error: 'Failed to fetch template rules' });
  }
});

// Create a new rule
router.post('/shops/:shopId/template-rules', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { template_id, rule_type, rule_value, priority } = req.body;

    // Validate required fields
    if (!template_id || !rule_type || !rule_value) {
      return res.status(400).json({ 
        error: 'Missing required fields: template_id, rule_type, rule_value' 
      });
    }

    // Only allow 'tag' rule type
    if (rule_type !== 'tag') {
      return res.status(400).json({ 
        error: 'Only "tag" rule type is supported' 
      });
    }

    const ruleId = await templateRulesService.createRule(
      shopId, 
      template_id, 
      rule_type, 
      rule_value.trim(), // Trim whitespace
      priority || 100
    );

    res.json({ 
      success: true, 
      rule_id: ruleId,
      message: 'Rule created successfully' 
    });
  } catch (error) {
    console.error('Error creating template rule:', error);
    res.status(500).json({ error: 'Failed to create template rule' });
  }
});

// Update a rule
router.put('/shops/:shopId/template-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    // Validate rule ownership
    const [rules] = await db.execute(
      'SELECT shop_id FROM template_assignment_rules WHERE id = ?',
      [ruleId]
    );

    if (rules.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    if (rules[0].shop_id !== parseInt(req.params.shopId)) {
      return res.status(403).json({ error: 'Not authorized to update this rule' });
    }

    // Trim rule_value if present
    if (updates.rule_value) {
      updates.rule_value = updates.rule_value.trim();
    }

    await templateRulesService.updateRule(ruleId, updates);

    res.json({ 
      success: true, 
      message: 'Rule updated successfully' 
    });
  } catch (error) {
    console.error('Error updating template rule:', error);
    res.status(500).json({ error: 'Failed to update template rule' });
  }
});

// Delete a rule
router.delete('/shops/:shopId/template-rules/:ruleId', async (req, res) => {
  try {
    const { shopId, ruleId } = req.params;

    // Validate rule ownership
    const [rules] = await db.execute(
      'SELECT shop_id FROM template_assignment_rules WHERE id = ?',
      [ruleId]
    );

    if (rules.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    if (rules[0].shop_id !== parseInt(shopId)) {
      return res.status(403).json({ error: 'Not authorized to delete this rule' });
    }

    await templateRulesService.deleteRule(ruleId);

    res.json({ 
      success: true, 
      message: 'Rule deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting template rule:', error);
    res.status(500).json({ error: 'Failed to delete template rule' });
  }
});

// Apply rules to all products
router.post('/shops/:shopId/template-rules/apply', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Get shop details for Shopify API access
    const [shops] = await db.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shop_domain, access_token } = shops[0];

    // Apply rules to all products
    const result = await templateRulesService.applyRulesToAllProducts(
      shopId,
      access_token,
      shop_domain
    );

    res.json({
      success: true,
      message: 'Rules applied to all products',
      ...result
    });
  } catch (error) {
    console.error('Error applying template rules:', error);
    res.status(500).json({ error: 'Failed to apply template rules' });
  }
});

// Get exclusion tag
router.get('/shops/:shopId/template-rules/exclusion-tag', async (req, res) => {
  try {
    const { shopId } = req.params;
    const tag = await templateRulesService.getExclusionTag(shopId);
    res.json({ exclusion_tag: tag });
  } catch (error) {
    console.error('Error fetching exclusion tag:', error);
    res.status(500).json({ error: 'Failed to fetch exclusion tag' });
  }
});

// Set exclusion tag
router.put('/shops/:shopId/template-rules/exclusion-tag', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { tag } = req.body;

    await templateRulesService.setExclusionTag(shopId, tag);

    res.json({ 
      success: true, 
      message: 'Exclusion tag updated',
      exclusion_tag: tag 
    });
  } catch (error) {
    console.error('Error setting exclusion tag:', error);
    res.status(500).json({ error: 'Failed to set exclusion tag' });
  }
});

export default router;