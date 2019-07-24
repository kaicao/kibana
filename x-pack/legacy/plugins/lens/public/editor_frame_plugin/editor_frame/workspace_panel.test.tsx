/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { ExpressionRendererProps } from '../../../../../../../src/legacy/core_plugins/data/public';
import { Visualization } from '../../types';
import {
  createMockVisualization,
  createMockDatasource,
  createExpressionRendererMock,
  DatasourceMock,
  createMockFramePublicAPI,
} from '../mocks';
import { InnerWorkspacePanel, WorkspacePanelProps } from './workspace_panel';
import { mountWithIntl as mount } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { DragDrop } from '../../drag_drop';
import { Ast } from '@kbn/interpreter/common';

const waitForPromises = () => new Promise(resolve => setTimeout(resolve));

describe('workspace_panel', () => {
  let mockVisualization: jest.Mocked<Visualization>;
  let mockDatasource: DatasourceMock;

  let expressionRendererMock: jest.Mock<React.ReactElement, [ExpressionRendererProps]>;

  let instance: ReactWrapper<WorkspacePanelProps>;

  beforeEach(() => {
    mockVisualization = createMockVisualization();

    mockDatasource = createMockDatasource();

    expressionRendererMock = createExpressionRendererMock();
  });

  afterEach(() => {
    instance.unmount();
  });

  it('should render an explanatory text if no visualization is active', () => {
    instance = mount(
      <InnerWorkspacePanel
        activeDatasourceId={'mock'}
        datasourceStates={{}}
        datasourceMap={{}}
        framePublicAPI={createMockFramePublicAPI()}
        activeVisualizationId={null}
        visualizationMap={{
          vis: mockVisualization,
        }}
        visualizationState={{}}
        dispatch={() => {}}
        ExpressionRenderer={expressionRendererMock}
      />
    );

    expect(instance.find('[data-test-subj="empty-workspace"]')).toHaveLength(1);
    expect(instance.find(expressionRendererMock)).toHaveLength(0);
  });

  it('should render an explanatory text if the visualization does not produce an expression', () => {
    instance = mount(
      <InnerWorkspacePanel
        activeDatasourceId={'mock'}
        datasourceStates={{}}
        datasourceMap={{}}
        framePublicAPI={createMockFramePublicAPI()}
        activeVisualizationId="vis"
        visualizationMap={{
          vis: { ...mockVisualization, toExpression: () => null },
        }}
        visualizationState={{}}
        dispatch={() => {}}
        ExpressionRenderer={expressionRendererMock}
      />
    );

    expect(instance.find('[data-test-subj="empty-workspace"]')).toHaveLength(1);
    expect(instance.find(expressionRendererMock)).toHaveLength(0);
  });

  it('should render an explanatory text if the datasource does not produce an expression', () => {
    instance = mount(
      <InnerWorkspacePanel
        activeDatasourceId={'mock'}
        datasourceStates={{}}
        datasourceMap={{}}
        framePublicAPI={createMockFramePublicAPI()}
        activeVisualizationId="vis"
        visualizationMap={{
          vis: { ...mockVisualization, toExpression: () => 'vis' },
        }}
        visualizationState={{}}
        dispatch={() => {}}
        ExpressionRenderer={expressionRendererMock}
      />
    );

    expect(instance.find('[data-test-subj="empty-workspace"]')).toHaveLength(1);
    expect(instance.find(expressionRendererMock)).toHaveLength(0);
  });

  it('should render the resulting expression using the expression renderer', () => {
    const framePublicAPI = createMockFramePublicAPI();
    framePublicAPI.datasourceLayers = {
      first: mockDatasource.publicAPIMock,
    };
    mockDatasource.toExpression.mockReturnValue('datasource');
    mockDatasource.getLayers.mockReturnValue(['first']);

    instance = mount(
      <InnerWorkspacePanel
        activeDatasourceId={'mock'}
        datasourceStates={{
          mock: {
            state: {},
            isLoading: false,
          },
        }}
        datasourceMap={{
          mock: mockDatasource,
        }}
        framePublicAPI={framePublicAPI}
        activeVisualizationId="vis"
        visualizationMap={{
          vis: { ...mockVisualization, toExpression: () => 'vis' },
        }}
        visualizationState={{}}
        dispatch={() => {}}
        ExpressionRenderer={expressionRendererMock}
      />
    );

    expect(instance.find(expressionRendererMock).prop('expression')).toMatchInlineSnapshot(`
            Object {
              "chain": Array [
                Object {
                  "arguments": Object {
                    "layerIds": Array [
                      "first",
                    ],
                    "tables": Array [
                      Object {
                        "chain": Array [
                          Object {
                            "arguments": Object {},
                            "function": "datasource",
                            "type": "function",
                          },
                        ],
                        "type": "expression",
                      },
                    ],
                  },
                  "function": "lens_merge_tables",
                  "type": "function",
                },
                Object {
                  "arguments": Object {},
                  "function": "vis",
                  "type": "function",
                },
              ],
              "type": "expression",
            }
        `);
  });

  it('should include data fetching for each layer in the expression', () => {
    const mockDatasource2 = createMockDatasource();
    const framePublicAPI = createMockFramePublicAPI();
    framePublicAPI.datasourceLayers = {
      first: mockDatasource.publicAPIMock,
      second: mockDatasource2.publicAPIMock,
    };
    mockDatasource.toExpression.mockReturnValue('datasource');
    mockDatasource.getLayers.mockReturnValue(['first']);

    mockDatasource2.toExpression.mockReturnValue('datasource2');
    mockDatasource2.getLayers.mockReturnValue(['second', 'third']);

    instance = mount(
      <InnerWorkspacePanel
        activeDatasourceId={'mock'}
        datasourceStates={{
          mock: {
            state: {},
            isLoading: false,
          },
          mock2: {
            state: {},
            isLoading: false,
          },
        }}
        datasourceMap={{
          mock: mockDatasource,
          mock2: mockDatasource2,
        }}
        framePublicAPI={framePublicAPI}
        activeVisualizationId="vis"
        visualizationMap={{
          vis: { ...mockVisualization, toExpression: () => 'vis' },
        }}
        visualizationState={{}}
        dispatch={() => {}}
        ExpressionRenderer={expressionRendererMock}
      />
    );

    expect(
      (instance.find(expressionRendererMock).prop('expression') as Ast).chain[0].arguments.layerIds
    ).toEqual(['first', 'second', 'third']);
    expect(
      (instance.find(expressionRendererMock).prop('expression') as Ast).chain[0].arguments.tables
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "chain": Array [
            Object {
              "arguments": Object {},
              "function": "datasource",
              "type": "function",
            },
          ],
          "type": "expression",
        },
        Object {
          "chain": Array [
            Object {
              "arguments": Object {},
              "function": "datasource2",
              "type": "function",
            },
          ],
          "type": "expression",
        },
        Object {
          "chain": Array [
            Object {
              "arguments": Object {},
              "function": "datasource2",
              "type": "function",
            },
          ],
          "type": "expression",
        },
      ]
    `);
  });

  describe('expression failures', () => {
    it('should show an error message if the expression fails to parse', () => {
      mockDatasource.toExpression.mockReturnValue('|||');
      mockDatasource.getLayers.mockReturnValue(['first']);
      const framePublicAPI = createMockFramePublicAPI();
      framePublicAPI.datasourceLayers = {
        first: mockDatasource.publicAPIMock,
      };

      instance = mount(
        <InnerWorkspacePanel
          activeDatasourceId={'mock'}
          datasourceStates={{
            mock: {
              state: {},
              isLoading: false,
            },
          }}
          datasourceMap={{
            mock: mockDatasource,
          }}
          framePublicAPI={framePublicAPI}
          activeVisualizationId="vis"
          visualizationMap={{
            vis: { ...mockVisualization, toExpression: () => 'vis' },
          }}
          visualizationState={{}}
          dispatch={() => {}}
          ExpressionRenderer={expressionRendererMock}
        />
      );

      expect(instance.find('[data-test-subj="expression-failure"]')).toHaveLength(1);
      expect(instance.find(expressionRendererMock)).toHaveLength(0);
    });

    it('should show an error message if the expression fails to render', async () => {
      mockDatasource.toExpression.mockReturnValue('datasource');
      mockDatasource.getLayers.mockReturnValue(['first']);
      const framePublicAPI = createMockFramePublicAPI();
      framePublicAPI.datasourceLayers = {
        first: mockDatasource.publicAPIMock,
      };
      expressionRendererMock = jest.fn(({ onRenderFailure }) => {
        Promise.resolve().then(() => onRenderFailure!({ type: 'error' }));
        return <span />;
      });

      instance = mount(
        <InnerWorkspacePanel
          activeDatasourceId={'mock'}
          datasourceStates={{
            mock: {
              state: {},
              isLoading: false,
            },
          }}
          datasourceMap={{
            mock: mockDatasource,
          }}
          framePublicAPI={framePublicAPI}
          activeVisualizationId="vis"
          visualizationMap={{
            vis: { ...mockVisualization, toExpression: () => 'vis' },
          }}
          visualizationState={{}}
          dispatch={() => {}}
          ExpressionRenderer={expressionRendererMock}
        />
      );

      // "wait" for the expression to execute
      await waitForPromises();

      instance.update();

      expect(instance.find('[data-test-subj="expression-failure"]')).toHaveLength(1);
      expect(instance.find(expressionRendererMock)).toHaveLength(0);
    });

    it('should not attempt to run the expression again if it does not change', async () => {
      mockDatasource.toExpression.mockReturnValue('datasource');
      mockDatasource.getLayers.mockReturnValue(['first']);
      const framePublicAPI = createMockFramePublicAPI();
      framePublicAPI.datasourceLayers = {
        first: mockDatasource.publicAPIMock,
      };
      expressionRendererMock = jest.fn(({ onRenderFailure }) => {
        Promise.resolve().then(() => onRenderFailure!({ type: 'error' }));
        return <span />;
      });

      instance = mount(
        <InnerWorkspacePanel
          activeDatasourceId={'mock'}
          datasourceStates={{
            mock: {
              state: {},
              isLoading: false,
            },
          }}
          datasourceMap={{
            mock: mockDatasource,
          }}
          framePublicAPI={framePublicAPI}
          activeVisualizationId="vis"
          visualizationMap={{
            vis: { ...mockVisualization, toExpression: () => 'vis' },
          }}
          visualizationState={{}}
          dispatch={() => {}}
          ExpressionRenderer={expressionRendererMock}
        />
      );

      // "wait" for the expression to execute
      await waitForPromises();

      instance.update();

      expect(expressionRendererMock).toHaveBeenCalledTimes(1);

      instance.update();

      expect(expressionRendererMock).toHaveBeenCalledTimes(1);
    });

    it('should attempt to run the expression again if changes after an error', async () => {
      mockDatasource.toExpression.mockReturnValue('datasource');
      mockDatasource.getLayers.mockReturnValue(['first']);
      const framePublicAPI = createMockFramePublicAPI();
      framePublicAPI.datasourceLayers = {
        first: mockDatasource.publicAPIMock,
      };
      expressionRendererMock = jest.fn(({ onRenderFailure }) => {
        Promise.resolve().then(() => onRenderFailure!({ type: 'error' }));
        return <span />;
      });

      instance = mount(
        <InnerWorkspacePanel
          activeDatasourceId={'mock'}
          datasourceStates={{
            mock: {
              state: {},
              isLoading: false,
            },
          }}
          datasourceMap={{
            mock: mockDatasource,
          }}
          framePublicAPI={framePublicAPI}
          activeVisualizationId="vis"
          visualizationMap={{
            vis: { ...mockVisualization, toExpression: () => 'vis' },
          }}
          visualizationState={{}}
          dispatch={() => {}}
          ExpressionRenderer={expressionRendererMock}
        />
      );

      // "wait" for the expression to execute
      await waitForPromises();

      instance.update();

      expect(expressionRendererMock).toHaveBeenCalledTimes(1);

      expressionRendererMock.mockImplementation(_ => {
        return <span />;
      });

      instance.setProps({ visualizationState: {} });
      instance.update();

      expect(expressionRendererMock).toHaveBeenCalledTimes(2);

      expect(instance.find(expressionRendererMock)).toHaveLength(1);
    });
  });

  describe('suggestions from dropping in workspace panel', () => {
    let mockDispatch: jest.Mock;

    beforeEach(() => {
      mockDispatch = jest.fn();
      instance = mount(
        <InnerWorkspacePanel
          activeDatasourceId={'mock'}
          datasourceStates={{
            mock: {
              state: {},
              isLoading: false,
            },
          }}
          datasourceMap={{
            mock: mockDatasource,
          }}
          framePublicAPI={createMockFramePublicAPI()}
          activeVisualizationId={null}
          visualizationMap={{
            vis: mockVisualization,
          }}
          visualizationState={{}}
          dispatch={mockDispatch}
          ExpressionRenderer={expressionRendererMock}
        />
      );
    });

    it('should immediately transition if exactly one suggestion is returned', () => {
      const expectedTable = {
        datasourceSuggestionId: 0,
        isMultiRow: true,
        layerId: '1',
        columns: [],
      };
      mockDatasource.getDatasourceSuggestionsForField.mockReturnValueOnce([
        {
          state: {},
          table: expectedTable,
        },
      ]);
      mockVisualization.getSuggestions.mockReturnValueOnce([
        {
          score: 0.5,
          title: 'my title',
          state: {},
          datasourceSuggestionId: 0,
          previewIcon: 'empty',
        },
      ]);

      instance.find(DragDrop).prop('onDrop')!({
        name: '@timestamp',
        type: 'date',
        searchable: false,
        aggregatable: false,
      });

      expect(mockDatasource.getDatasourceSuggestionsForField).toHaveBeenCalledTimes(1);
      expect(mockVisualization.getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          tables: [expectedTable],
        })
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SWITCH_VISUALIZATION',
        newVisualizationId: 'vis',
        initialState: {},
        datasourceState: {},
      });
    });

    it('should immediately transition to the first suggestion if there are multiple', () => {
      mockDatasource.getDatasourceSuggestionsForField.mockReturnValueOnce([
        {
          state: {},
          table: {
            datasourceSuggestionId: 0,
            isMultiRow: true,
            columns: [],
            layerId: '1',
          },
        },
        {
          state: {},
          table: {
            datasourceSuggestionId: 1,
            isMultiRow: true,
            columns: [],
            layerId: '1',
          },
        },
      ]);
      mockVisualization.getSuggestions.mockReturnValueOnce([
        {
          score: 0.8,
          title: 'first suggestion',
          state: {
            isFirst: true,
          },
          datasourceSuggestionId: 1,
          previewIcon: 'empty',
        },
        {
          score: 0.5,
          title: 'second suggestion',
          state: {},
          datasourceSuggestionId: 0,
          previewIcon: 'empty',
        },
      ]);

      instance.find(DragDrop).prop('onDrop')!({
        name: '@timestamp',
        type: 'date',
        searchable: false,
        aggregatable: false,
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SWITCH_VISUALIZATION',
        newVisualizationId: 'vis',
        initialState: {
          isFirst: true,
        },
        datasourceState: {},
      });
    });

    it("should do nothing when the visualization can't use the suggestions", () => {
      instance.find(DragDrop).prop('onDrop')!({
        name: '@timestamp',
        type: 'date',
        searchable: false,
        aggregatable: false,
      });

      expect(mockDatasource.getDatasourceSuggestionsForField).toHaveBeenCalledTimes(1);
      expect(mockVisualization.getSuggestions).toHaveBeenCalledTimes(1);
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
