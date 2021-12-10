/**
 * Copyright © 2021 Johnson & Johnson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect } from 'react';
import {
  withEditButton,
  withNodeDataHandlers,
  EditButtonOptions,
  withSidecarNodes,
  withNode,
  withNodeKey,
  ifEditable,
  ifReadOnly,
  withLocalContextMenu,
  withContextActivator,
  useNode,
} from '@bodiless/core';
import {
  asToken,
  withDesign,
  withoutProps,
  addProps,
} from '@bodiless/fclasses';
import { useFilterByGroupContext, useIsFilterTagSelected } from './FilterByGroupContext';
import type { NodeTagType, FilterTagType } from './types';

const renderForm = () => (<></>);
const useFilterSelectionMenuOptions = () => {
  const { getSelectedTags } = useFilterByGroupContext();
  const tags = getSelectedTags();
  const filterSelectionMenuOptions: EditButtonOptions<any, NodeTagType> = {
    name: 'filter-page',
    label: 'Page',
    groupLabel: 'Filter',
    groupMerge: 'none',
    icon: 'filter_alt',
    local: true,
    global: false,
    formTitle: 'Filter Page',
    formDescription: true ? `Clicking the check will save the current Local 
  Filter UI selections to this Page, creating a Save State.` : `Page now filtered by Saved 
  State on page load.`,
    isHidden: false,
    renderForm,
    submitValueHandler: (values: any) => {
      const submitValues = { tags };
      return submitValues;
    },
  };
  return filterSelectionMenuOptions;
};

const withTagListDesign = withDesign({
  Title: asToken(
    withDesign({
      FilterGroupItemInput: ifReadOnly(
        addProps({ disabled: true }),
      )
    }),
  ),
});
export const asDefaultFilter = withDesign({
  TagList: withTagListDesign,
});

const withFilterDefaultSelection = (Component: any) => {
  const WithFilterDefaultSelection = (props: any) => {
    const { node } = useNode();
    const { updateSelectedTags } = useFilterByGroupContext();
    const { tags = [] } = node.peer(['Page', 'default-filters']).data as { tags: FilterTagType[] };
    useEffect(() => {
      updateSelectedTags(tags);
    }, []);
    return (
      <Component {...props} />
    );
  };
  return WithFilterDefaultSelection;
};

/**
 * HOC adds default filter form and data to filter list.
 * 
 * @todo: type HOC component.
 * 
 * @param Component 
 * @returns 
 */
const withFilterSelection = (
  nodeKey = 'default-filters',
  defaultData = { tags: [] },
) => asToken(
  withoutProps(['componentData', 'setComponentData']),
  withSidecarNodes(
    withNodeKey(nodeKey),
    withNode,
    withNodeDataHandlers(defaultData),
    withFilterDefaultSelection,
    ifEditable(
      withEditButton(() => useFilterSelectionMenuOptions()),
      withContextActivator('onClick'),
      withLocalContextMenu,
    ),
  ),
  asDefaultFilter,
);

export default withFilterSelection;
