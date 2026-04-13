/**
 * Smart Rules Validation Utilities
 * Validates smart album rules before sending to backend
 */

import type { SmartRule } from '@/types';
import { validateUUID } from './validation';

/**
 * Validates smart album rules
 * @param rules - Smart rules object to validate
 * @throws Error if validation fails
 */
export const validateSmartRules = (rules: SmartRule): void => {
  const validTypes = ['person', 'date_range', 'tag', 'child', 'location', 'advanced'] as const;

  // Validate rule type
  if (!rules.type || !validTypes.includes(rules.type)) {
    throw new Error(`无效的规则类型: ${rules.type}`);
  }

  // Validate config
  if (!rules.config || typeof rules.config !== 'object') {
    throw new Error('规则配置无效');
  }

  // Type-specific validation
  switch (rules.type) {
    case 'person':
      if (!rules.config.personId) {
        throw new Error('人物规则缺少 personId');
      }
      validateUUID(rules.config.personId as string, '人物ID');
      break;

    case 'date_range':
      if (!rules.config.startDate || !rules.config.endDate) {
        throw new Error('日期范围规则缺少日期');
      }
      const start = new Date(rules.config.startDate as string);
      const end = new Date(rules.config.endDate as string);
      if (start >= end) {
        throw new Error('开始日期必须早于结束日期');
      }
      break;

    case 'tag':
      if (!Array.isArray(rules.config.tags) || rules.config.tags.length === 0) {
        throw new Error('标签规则至少需要一个标签');
      }
      if (rules.config.tags.length > 50) {
        throw new Error('标签数量不能超过50个');
      }
      break;

    case 'child':
      if (!rules.config.childId) {
        throw new Error('孩子规则缺少 childId');
      }
      validateUUID(rules.config.childId as string, '孩子ID');
      break;

    case 'location':
      if (!rules.config.location) {
        throw new Error('位置规则缺少 location');
      }
      break;

    case 'advanced':
      const conditions = rules.config.conditions as Array<{
        field: string;
        operator: string;
        value: unknown;
      }>;

      if (!Array.isArray(conditions) || conditions.length === 0) {
        throw new Error('高级规则至少需要一个条件');
      }

      // Validate each condition
      for (const condition of conditions) {
        if (!condition.field || !condition.operator) {
          throw new Error('条件缺少字段或操作符');
        }
      }
      break;
  }
};

/**
 * Validates smart rules array (for albums with multiple rules)
 * @param rulesArray - Array of smart rules
 * @throws Error if any rule is invalid
 */
export const validateSmartRulesArray = (rulesArray: SmartRule[]): void => {
  if (!Array.isArray(rulesArray) || rulesArray.length === 0) {
    throw new Error('智能规则不能为空');
  }

  if (rulesArray.length > 10) {
    throw new Error('智能规则不能超过10条');
  }

  rulesArray.forEach((rules, index) => {
    try {
      validateSmartRules(rules);
    } catch (error) {
      throw new Error(`第 ${index + 1} 条规则验证失败: ${(error as Error).message}`);
    }
  });
};
