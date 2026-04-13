import { useState } from 'react';
import { Button, Card, Input, Select, Badge } from '@/components/ui';
import { useChildStore } from '@/stores/child.store';
import type { SmartRule } from '@/types';
import { validateSmartRulesArray } from '@/lib/smart-rules-validator';

interface SmartRuleBuilderProps {
  initialRules?: SmartRule[];
  onRulesChange: (rules: SmartRule[]) => void;
  error?: string;
}

type RuleType = 'person' | 'date_range' | 'tag' | 'child' | 'location' | 'advanced';

export function SmartRuleBuilder({
  initialRules = [],
  onRulesChange,
  error,
}: SmartRuleBuilderProps) {
  const { children } = useChildStore();
  const [rules, setRules] = useState<Array<{
    id: string;
    type: RuleType;
    config: Record<string, unknown>;
  }>>(
    initialRules.map((rule, index) => ({
      id: `rule-${index}`,
      type: rule.type as RuleType,
      config: rule.config,
    }))
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const ruleTypeOptions: Array<{ value: RuleType; label: string; icon: string }> = [
    { value: 'child', label: '按宝贝', icon: '👶' },
    { value: 'date_range', label: '按日期范围', icon: '📅' },
    { value: 'tag', label: '按标签', icon: '🏷️' },
    { value: 'person', label: '按人物', icon: '👤' },
    { value: 'location', label: '按位置', icon: '📍' },
    { value: 'advanced', label: '高级条件', icon: '⚙️' },
  ];

  const childOptions = (children || []).map((child) => ({
    value: child.id,
    label: child.name,
  }));

  const addRule = () => {
    const newRule = {
      id: `rule-${Date.now()}`,
      type: 'child' as RuleType,
      config: {},
    };
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    notifyChange(updatedRules);
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    setRules(updatedRules);
    notifyChange(updatedRules);
  };

  const updateRuleType = (ruleId: string, type: RuleType) => {
    const updatedRules = rules.map((r) =>
      r.id === ruleId
        ? {
            id: r.id,
            type,
            config: getDefaultConfigForType(type),
          }
        : r
    );
    setRules(updatedRules);
    notifyChange(updatedRules);
  };

  const updateRuleConfig = (ruleId: string, key: string, value: unknown) => {
    const updatedRules = rules.map((r) =>
      r.id === ruleId
        ? {
            ...r,
            config: {
              ...r.config,
              [key]: value,
            },
          }
        : r
    );
    setRules(updatedRules);
    notifyChange(updatedRules);
  };

  const getDefaultConfigForType = (type: RuleType): Record<string, unknown> => {
    switch (type) {
      case 'child':
        return { childId: children[0]?.id || '' };
      case 'date_range':
        return {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        };
      case 'tag':
        return { tags: [], matchAll: false };
      case 'person':
        return { personId: '' };
      case 'location':
        return { location: '', radius: 10 };
      case 'advanced':
        return { conditions: [{ field: 'takenAt', operator: 'gte', value: '' }] };
      default:
        return {};
    }
  };

  const notifyChange = (updatedRules: typeof rules) => {
    try {
      const smartRules: SmartRule[] = updatedRules.map((r) => ({
        id: r.id,
        type: r.type,
        config: r.config,
      }));
      validateSmartRulesArray(smartRules);
      setValidationError(null);
      onRulesChange(smartRules);
    } catch (err) {
      setValidationError((err as Error).message);
      // Still pass the rules up, parent handles validation
      const smartRules: SmartRule[] = updatedRules.map((r) => ({
        id: r.id,
        type: r.type,
        config: r.config,
      }));
      onRulesChange(smartRules);
    }
  };

  const addTag = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.type !== 'tag') return;

    const currentTags = (rule.config.tags as string[]) || [];
    const input = document.getElementById(
      `tag-input-${ruleId}`
    ) as HTMLInputElement;
    if (input && input.value.trim()) {
      const updatedTags = [...currentTags, input.value.trim()];
      updateRuleConfig(ruleId, 'tags', updatedTags);
      input.value = '';
    }
  };

  const removeTag = (ruleId: string, tag: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.type !== 'tag') return;

    const currentTags = (rule.config.tags as string[]) || [];
    const updatedTags = currentTags.filter((t) => t !== tag);
    updateRuleConfig(ruleId, 'tags', updatedTags);
  };

  const addAdvancedCondition = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.type !== 'advanced') return;

    const conditions = (rule.config.conditions as Array<{
      field: string;
      operator: string;
      value: unknown;
    }>) || [];

    updateRuleConfig(ruleId, 'conditions', [
      ...conditions,
      { field: 'takenAt', operator: 'gte', value: '' },
    ]);
  };

  const removeAdvancedCondition = (ruleId: string, index: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.type !== 'advanced') return;

    const conditions = (rule.config.conditions as Array<{
      field: string;
      operator: string;
      value: unknown;
    }>) || [];

    updateRuleConfig(
      ruleId,
      'conditions',
      conditions.filter((_, i) => i !== index)
    );
  };

  const updateAdvancedCondition = (
    ruleId: string,
    index: number,
    key: string,
    value: unknown
  ) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.type !== 'advanced') return;

    const conditions = (rule.config.conditions as Array<{
      field: string;
      operator: string;
      value: unknown;
    }>) || [];

    updateRuleConfig(ruleId, 'conditions', conditions.map((c, i) =>
      i === index ? { ...c, [key]: value } : c
    ));
  };

  const fieldOptions = [
    { value: 'takenAt', label: '拍摄日期' },
    { value: 'uploadedAt', label: '上传日期' },
    { value: 'fileSize', label: '文件大小' },
    { value: 'mimeType', label: '文件类型' },
  ];

  const operatorOptions = [
    { value: 'equals', label: '等于' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开始于' },
    { value: 'endsWith', label: '结束于' },
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'gte', label: '大于等于' },
    { value: 'lte', label: '小于等于' },
  ];

  return (
    <div className="space-y-4">
      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🔮</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            智能规则
          </h3>
          <p className="text-gray-600 mb-6">
            添加规则让系统自动整理照片到这个相册
          </p>
          <Button onClick={addRule}>添加第一条规则</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, ruleIndex) => (
            <Card key={rule.id} className="p-5 relative">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  规则 {ruleIndex + 1}
                </Badge>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Rule Type Selector */}
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    规则类型
                  </label>
                  <Select
                    options={ruleTypeOptions.map((rt) => ({
                      value: rt.value,
                      label: `${rt.icon} ${rt.label}`,
                    }))}
                    value={rule.type}
                    onChange={(e) =>
                      updateRuleType(rule.id, e.target.value as RuleType)
                    }
                  />
                </div>

                {/* Rule Config Based on Type */}
                {rule.type === 'child' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <Select
                      label="选择宝贝"
                      options={childOptions}
                      value={rule.config.childId as string}
                      onChange={(e) =>
                        updateRuleConfig(rule.id, 'childId', e.target.value)
                      }
                      helperText="相册将自动包含该宝贝的照片"
                    />
                  </div>
                )}

                {rule.type === 'date_range' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <Input
                      label="开始日期"
                      type="date"
                      value={(rule.config.startDate as string) || ''}
                      onChange={(e) =>
                        updateRuleConfig(rule.id, 'startDate', e.target.value)
                      }
                    />
                    <Input
                      label="结束日期"
                      type="date"
                      value={(rule.config.endDate as string) || ''}
                      onChange={(e) =>
                        updateRuleConfig(rule.id, 'endDate', e.target.value)
                      }
                    />
                  </div>
                )}

                {rule.type === 'tag' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        标签
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={`tag-input-${rule.id}`}
                          type="text"
                          placeholder="输入标签后按添加"
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag(rule.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTag(rule.id)}
                        >
                          添加
                        </Button>
                      </div>
                      {(rule.config.tags as string[])?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(rule.config.tags as string[]).map((tag) => (
                            <Badge
                              key={tag}
                              variant="primary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(rule.id, tag)}
                                className="ml-1 hover:text-red-200"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`match-all-${rule.id}`}
                        checked={rule.config.matchAll as boolean}
                        onChange={(e) =>
                          updateRuleConfig(rule.id, 'matchAll', e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`match-all-${rule.id}`}
                        className="text-sm text-gray-700"
                      >
                        匹配所有标签（默认匹配任意标签）
                      </label>
                    </div>
                  </div>
                )}

                {rule.type === 'person' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      人物识别功能即将上线，届时可以按人脸自动整理照片
                    </p>
                    <Input
                      label="人物ID"
                      placeholder="等待人物识别功能上线"
                      value={rule.config.personId as string || ''}
                      onChange={(e) =>
                        updateRuleConfig(rule.id, 'personId', e.target.value)
                      }
                      disabled
                    />
                  </div>
                )}

                {rule.type === 'location' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <Input
                      label="位置"
                      placeholder="例如：北京天安门、上海迪士尼"
                      value={rule.config.location as string || ''}
                      onChange={(e) =>
                        updateRuleConfig(rule.id, 'location', e.target.value)
                      }
                    />
                    <Input
                      label="半径（公里）"
                      type="number"
                      value={rule.config.radius as number || 10}
                      onChange={(e) =>
                        updateRuleConfig(
                          rule.id,
                          'radius',
                          parseInt(e.target.value) || 10
                        )
                      }
                    />
                  </div>
                )}

                {rule.type === 'advanced' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        高级条件
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addAdvancedCondition(rule.id)}
                      >
                        + 添加条件
                      </Button>
                    </div>

                    {(rule.config.conditions as Array<{
                      field: string;
                      operator: string;
                      value: unknown;
                    }>)?.map((condition, condIndex) => (
                      <div
                        key={condIndex}
                        className="flex gap-2 items-start bg-white p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <Select
                            options={fieldOptions}
                            value={condition.field}
                            onChange={(e) =>
                              updateAdvancedCondition(
                                rule.id,
                                condIndex,
                                'field',
                                e.target.value
                              )
                            }
                            label=""
                          />
                        </div>
                        <div className="flex-1">
                          <Select
                            options={operatorOptions}
                            value={condition.operator}
                            onChange={(e) =>
                              updateAdvancedCondition(
                                rule.id,
                                condIndex,
                                'operator',
                                e.target.value
                              )
                            }
                            label=""
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={condition.value as string || ''}
                            onChange={(e) =>
                              updateAdvancedCondition(
                                rule.id,
                                condIndex,
                                'value',
                                e.target.value
                              )
                            }
                            label=""
                            placeholder="值"
                          />
                        </div>
                        <button
                          onClick={() => removeAdvancedCondition(rule.id, condIndex)}
                          className="mt-6 text-gray-400 hover:text-red-500"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Rule Button */}
      {rules.length > 0 && rules.length < 10 && (
        <Button
          variant="outline"
          onClick={addRule}
          className="w-full"
        >
          + 添加更多规则
        </Button>
      )}

      {/* Validation Error */}
      {(validationError || error) && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{validationError || error}</p>
        </div>
      )}

      {/* Rules Summary */}
      {rules.length > 0 && !validationError && !error && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            <strong>已设置 {rules.length} 条规则</strong>
            <br />
            系统将根据这些规则自动更新相册内容
          </p>
        </div>
      )}
    </div>
  );
}
