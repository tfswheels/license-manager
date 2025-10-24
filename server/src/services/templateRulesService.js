import db from '../config/database.js';

/**
 * Template Assignment Rules Service
 * Handles automatic template assignment based on product tags
 */

// Get all active rules for a shop, ordered by priority
export async function getActiveRules(shopId) {
  try {
    const [rules] = await db.execute(
      `SELECT * FROM template_assignment_rules 
       WHERE shop_id = ? AND is_active = TRUE 
       ORDER BY priority ASC, id ASC`,
      [shopId]
    );
    return rules;
  } catch (error) {
    console.error('Error fetching active rules:', error);
    throw error;
  }
}

// Get all rules for a shop (including inactive)
export async function getAllRules(shopId) {
  try {
    const [rules] = await db.execute(
      `SELECT r.*, t.template_name 
       FROM template_assignment_rules r
       LEFT JOIN email_templates t ON r.template_id = t.id
       WHERE r.shop_id = ? 
       ORDER BY r.priority ASC, r.id ASC`,
      [shopId]
    );
    return rules;
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
}

// Create a new rule
export async function createRule(shopId, templateId, ruleType, ruleValue, priority = 100) {
  try {
    // Generate a descriptive rule name based on type and value
    const ruleName = generateRuleName(ruleType, ruleValue);

    const [result] = await db.execute(
      `INSERT INTO template_assignment_rules
       (shop_id, template_id, rule_name, rule_type, rule_value, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shopId, templateId, ruleName, ruleType, ruleValue, priority]
    );

    console.log(`✅ Created rule: ${ruleName} → template ${templateId}`);
    return result.insertId;
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
}

// Generate a descriptive rule name
function generateRuleName(ruleType, ruleValue) {
  const typeLabels = {
    'tag': 'Tag',
    'vendor': 'Vendor',
    'price': 'Price',
    'collection': 'Collection'
  };

  const typeLabel = typeLabels[ruleType] || ruleType;
  return `${typeLabel}: ${ruleValue}`;
}

// Update a rule
export async function updateRule(ruleId, updates) {
  try {
    const fields = [];
    const values = [];

    if (updates.template_id !== undefined) {
      fields.push('template_id = ?');
      values.push(updates.template_id);
    }
    if (updates.rule_value !== undefined) {
      fields.push('rule_value = ?');
      values.push(updates.rule_value);

      // If rule_value is being updated, also update rule_name
      // First we need to get the current rule_type
      const [currentRule] = await db.execute(
        'SELECT rule_type FROM template_assignment_rules WHERE id = ?',
        [ruleId]
      );
      if (currentRule.length > 0) {
        const newRuleName = generateRuleName(currentRule[0].rule_type, updates.rule_value);
        fields.push('rule_name = ?');
        values.push(newRuleName);
      }
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }

    if (fields.length === 0) return;

    values.push(ruleId);

    await db.execute(
      `UPDATE template_assignment_rules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log(`✅ Updated rule ${ruleId}`);
  } catch (error) {
    console.error('Error updating rule:', error);
    throw error;
  }
}

// Delete a rule
export async function deleteRule(ruleId) {
  try {
    await db.execute('DELETE FROM template_assignment_rules WHERE id = ?', [ruleId]);
    console.log(`✅ Deleted rule ${ruleId}`);
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
}

// Check if a product matches a rule (tags only)
function matchesRule(product, rule) {
  // Only support tag matching
  if (rule.rule_type !== 'tag') {
    console.warn(`Unsupported rule type: ${rule.rule_type}`);
    return false;
  }

  // Product tags are stored as comma-separated string
  const productTags = (product.tags || '').toLowerCase().split(',').map(t => t.trim());
  const searchTag = rule.rule_value.toLowerCase().trim();
  return productTags.includes(searchTag);
}

// Apply rules to a single product
export async function applyRulesToProduct(shopId, productId, accessToken, shopDomain) {
  try {
    // Get product from database
    const [products] = await db.execute(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    );

    if (products.length === 0) {
      throw new Error('Product not found');
    }

    const product = products[0];

    // Check if product has exclusion tag
    const [shops] = await db.execute(
      'SELECT template_rule_exclusion_tag FROM shops WHERE id = ?',
      [shopId]
    );

    const exclusionTag = shops[0]?.template_rule_exclusion_tag;
    if (exclusionTag) {
      const productTags = (product.tags || '').toLowerCase().split(',').map(t => t.trim());
      if (productTags.includes(exclusionTag.toLowerCase().trim())) {
        console.log(`⚠️ Product ${product.product_name} has exclusion tag, skipping rules`);
        return null;
      }
    }

    // Get active rules
    const rules = await getActiveRules(shopId);
    if (rules.length === 0) {
      return null;
    }

    // Find first matching rule (rules are already ordered by priority)
    let matchedRule = null;
    for (const rule of rules) {
      if (matchesRule(product, rule)) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      // Update product with matched template
      await db.execute(
        'UPDATE products SET email_template_id = ? WHERE id = ?',
        [matchedRule.template_id, productId]
      );

      console.log(`✅ Applied rule to ${product.product_name}: ${matchedRule.rule_type} → template ${matchedRule.template_id}`);
      return matchedRule;
    }

    return null;
  } catch (error) {
    console.error('Error applying rules to product:', error);
    throw error;
  }
}

// Apply rules to all products in a shop
export async function applyRulesToAllProducts(shopId, accessToken, shopDomain) {
  try {
    console.log(`🔄 Applying template assignment rules for shop ${shopId}...`);

    // Get all products for this shop
    const [products] = await db.execute(
      'SELECT id FROM products WHERE shop_id = ?',
      [shopId]
    );

    let applied = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const result = await applyRulesToProduct(shopId, product.id, accessToken, shopDomain);
        if (result) {
          applied++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error applying rules to product ${product.id}:`, error.message);
        errors++;
      }
    }

    // Update last_rule_application timestamp
    await db.execute(
      'UPDATE shops SET last_rule_application = NOW() WHERE id = ?',
      [shopId]
    );

    console.log(`✅ Rule application complete: ${applied} applied, ${skipped} skipped, ${errors} errors`);

    return {
      total: products.length,
      applied,
      skipped,
      errors
    };
  } catch (error) {
    console.error('Error applying rules to all products:', error);
    throw error;
  }
}

// Get or set exclusion tag for a shop
export async function getExclusionTag(shopId) {
  try {
    const [shops] = await db.execute(
      'SELECT template_rule_exclusion_tag FROM shops WHERE id = ?',
      [shopId]
    );
    return shops[0]?.template_rule_exclusion_tag || null;
  } catch (error) {
    console.error('Error getting exclusion tag:', error);
    throw error;
  }
}

export async function setExclusionTag(shopId, tag) {
  try {
    await db.execute(
      'UPDATE shops SET template_rule_exclusion_tag = ? WHERE id = ?',
      [tag || null, shopId]
    );
    console.log(`✅ Set exclusion tag for shop ${shopId}: ${tag || '(none)'}`);
  } catch (error) {
    console.error('Error setting exclusion tag:', error);
    throw error;
  }
}