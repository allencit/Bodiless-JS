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
  ContextMenuFormProps,
  getUI,
} from '@bodiless/core';
import {
  asToken,
  withDesign,
  withoutProps,
  addProps,
  ComponentOrTag,
} from '@bodiless/fclasses';
import { useFormState } from 'informed';
import { useFilterByGroupContext } from './FilterByGroupContext';
import type { NodeTagType, FilterTagType } from './types';

enum FilterSelectionAction {
  reset = 'SELECTION_RESET',
  clear = 'SELECTION_CLEAR',
  save = 'SELECTION_SAVE',
}

const defaultFiltersPath = [
  'Page',
  'default-filters',
];

/**
 * Retrieves default filter data on current page.
 * 
 * @private
 */
const useDefaultFiltersData = () => {
  const { node } = useNode();
  return node.peer(defaultFiltersPath).data as { tags: FilterTagType[] };
};

/**
 * Renders default filter form in different use cases:
 * - No existing default filter set yet.
 *   submit form to save the selected tags.
 * - Has saved default filter.
 *    - Clear/remove saved default filter
 *    - Reset current selection to default filter selection.
 * 
 * @private
 * @params props Default filter form properties.
 * @returns void
 */
const renderForm = (props: ContextMenuFormProps) => {
  const { ui } = props;
  const { tags = [] } = useDefaultFiltersData();
  const { values } = useFormState();

  const hanldeSubmit = (e: any) => {
    e.preventDefault();
  };

  if (!tags.length) {
    const { ComponentFormText, ComponentFormSubmitButton } = getUI(ui);
    return (
      <>
        <ComponentFormText
          type="hidden"
          field="filterSelectionAction"
          keepState
          initialValue={FilterSelectionAction.save}
        />
        <ComponentFormSubmitButton
          aria-label="Submit"
          onClick={hanldeSubmit}
        />
      </>
    );
  }
  const {
    ComponentFormLabel,
    ComponentFormRadioGroup,
    ComponentFormRadio,
    ComponentFormSubmitButton,
  } = getUI(ui);

  return (
    <>
      <ComponentFormRadioGroup field="filterSelectionAction" keepState>
        <ComponentFormLabel id={FilterSelectionAction.reset} key={FilterSelectionAction.reset}>
          <ComponentFormRadio value={FilterSelectionAction.reset} />
          Reset Local Filter UI to Saved State
        </ComponentFormLabel>
        <ComponentFormLabel id={FilterSelectionAction.clear} key={FilterSelectionAction.clear}>
          <ComponentFormRadio value={FilterSelectionAction.clear} />
          Clear Saved State from Page
        </ComponentFormLabel>
      </ComponentFormRadioGroup>
      <ComponentFormSubmitButton
        aria-label="Submit"
        onClick={hanldeSubmit}
      />
    </>
  );
};

/**
 * Custom hook to generate a default filter button menu options.
 * 
 * @private
 * @returns Default filter button menu option.
 */
const useFilterSelectionMenuOptions = () => {
  // const { getSelectedTags, updateSelectedTags } = useFilterByGroupContext();
  const { tags: defaultTags = [] } = useDefaultFiltersData();
  const formDescription = (!defaultTags.length) ? `Clicking the check will save the current Local
      Filter UI selections to this Page, creating a Save State.` : `Page now filtered by Saved
      State on page load.`;

  const filterSelectionMenuOptions: EditButtonOptions<any, NodeTagType> = {
    name: 'filter-page',
    label: 'Page',
    groupLabel: 'Filter',
    groupMerge: 'none',
    icon: 'filter_alt',
    local: true,
    global: false,
    formTitle: 'Filter Page',
    isHidden: false,
    formDescription,
    renderForm,
    hasSubmit: false,
    // submitValueHandler: (values: any) => {
    //   const { filterSelectionAction = '' } = values;
    //   switch (filterSelectionAction) {
    //     case FilterSelectionAction.clear: {
    //       const submitValues = { tags: [] };
    //       return submitValues;
    //     }
    //     case FilterSelectionAction.reset: {
    //       updateSelectedTags(defaultTags);
    //       return { tags: defaultTags };
    //     }
    //     case FilterSelectionAction.save: {
    //       const tags = getSelectedTags();
    //       const submitValues = { tags };
    //       return submitValues;
    //     }
    //   }
    // },
  };
  return filterSelectionMenuOptions;
};

const withTagListDesign = withDesign({
  Title: withDesign({
    FilterGroupItemInput: ifReadOnly(
      addProps({ disabled: true }),
    )
  }),
});
export const asDefaultFilter = withDesign({
  TagList: withTagListDesign,
});

/**
 * HOC applies page default filter to Filter component.
 * 
 * @private
 * @param Component filter component.
 * @returns 
 */
const withFilterDefaultSelection = <P extends object>(Component: ComponentOrTag<P>) => {
  const WithFilterDefaultSelection = (props: P) => {
    const { updateSelectedTags, hasTagFromQueryParams } = useFilterByGroupContext();
    const { tags = [] } = useDefaultFiltersData();
    useEffect(() => {
      if (!hasTagFromQueryParams()) {
        updateSelectedTags(tags);
      }
    }, []);
    return (
      <Component {...props} />
    );
  };
  return WithFilterDefaultSelection;
};

/**
 * HOC adds default filter form and data to filter list. Selected filter data has
 * default nodekey as 'default-filters'.
 * 
 * @param nodeKey Default filter nodekey for page level storage.
 * @param defaultData default data for default filter selection.
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
