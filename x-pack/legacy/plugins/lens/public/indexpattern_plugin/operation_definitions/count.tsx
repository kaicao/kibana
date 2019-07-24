/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import { CountIndexPatternColumn } from '../indexpattern';
import { OperationDefinition } from '../operations';

export const countOperation: OperationDefinition<CountIndexPatternColumn> = {
  type: 'count',
  displayName: i18n.translate('xpack.lens.indexPattern.count', {
    defaultMessage: 'Count',
  }),
  isApplicableWithoutField: true,
  isApplicableForField: () => false,
  buildColumn({ operationId, suggestedPriority, indexPatternId }) {
    return {
      operationId,
      label: i18n.translate('xpack.lens.indexPattern.countOf', {
        defaultMessage: 'Count of documents',
      }),
      dataType: 'number',
      operationType: 'count',
      suggestedPriority,
      isBucketed: false,
      indexPatternId,
    };
  },
  toEsAggsConfig: (column, columnId) => ({
    id: columnId,
    enabled: true,
    type: 'count',
    schema: 'metric',
    params: {},
  }),
};
