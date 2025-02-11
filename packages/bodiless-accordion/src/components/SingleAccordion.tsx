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

import React, { ComponentType, useState } from 'react';
import { observer } from 'mobx-react';
import {
  withDesign,
  designable,
  Div,
  H2,
  StylableProps,
  addProps,
  flowHoc,
} from '@bodiless/fclasses';
import {
  asEditable,
} from '@bodiless/components';
import { withNode, useEditContext } from '@bodiless/core';

export type SingleAccordionComponents = {
  Wrapper: ComponentType<StylableProps>,
  TitleWrapper: ComponentType<StylableProps>,
  Title: ComponentType<StylableProps>,
  BodyWrapper: ComponentType<StylableProps>,
  Body: ComponentType<StylableProps>,
};

const singleAccordionComponentStart:SingleAccordionComponents = {
  Wrapper: Div,
  TitleWrapper: Div,
  Title: H2,
  BodyWrapper: Div,
  Body: Div,
};

const SingleAccordionBase = observer(({
  components, expanded, expandedStyle = null, ...rest
}: any) => {
  const EXPANDED = 'expanded';
  const COLLAPSED = 'collapsed';
  const initialState = expanded ? EXPANDED : COLLAPSED;
  const [accordionState, setAccordionState] = useState(initialState);
  const { isEdit } = useEditContext();

  const toggleAccordionState = () => {
    setAccordionState(accordionState === EXPANDED ? COLLAPSED : EXPANDED);
  };

  const {
    Wrapper,
    TitleWrapper,
    Title,
    BodyWrapper,
    Body,
  } = components;

  return (
    <Wrapper className={[accordionState]} {...rest}>
      <TitleWrapper
        onClick={isEdit ? undefined : toggleAccordionState}
        className={[
          'flex',
          'justify-between',
          'select-none',
          (accordionState === EXPANDED && expandedStyle) || '',
        ]}
      >
        <Title />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <span
          tabIndex={0}
          role="button"
          onClick={toggleAccordionState}
          className="material-icons cursor-pointer select-none"
          data-accordion-element="accordion-icon"
          data-accordion-icon={accordionState === COLLAPSED ? 'expand' : 'collapse'}
        >
          {accordionState === COLLAPSED ? 'add' : 'remove'}
        </span>
      </TitleWrapper>
      <BodyWrapper className={accordionState === COLLAPSED ? 'hidden' : 'block'}>
        <Body />
      </BodyWrapper>
    </Wrapper>
  );
});

const asSingleAccordion = flowHoc(
  withDesign({
    Title: asEditable('title', 'SingleAccordion Title Text'),
    Body: asEditable('body', 'SingleAccordion Body Text'),
  }),
);

const asTestableSingleAccordion = flowHoc(
  withDesign({
    Wrapper: addProps({ 'data-accordion-element': 'accordion' }),
    TitleWrapper: addProps({ 'data-accordion-element': 'accordion-title-wrapper' }),
    Title: addProps({ 'data-accordion-element': 'accordion-title' }),
    BodyWrapper: addProps({ 'data-accordion-element': 'accordion-body-wrapper' }),
    Body: addProps({ 'data-accordion-element': 'accordion-body' }),
  }),
);

const SingleAccordionClean = designable(singleAccordionComponentStart, 'Accordion')(SingleAccordionBase);

const SingleAccordion = flowHoc(
  asSingleAccordion,
  withNode,
)(SingleAccordionClean);

const TestableSingleAccordion = flowHoc(
  asTestableSingleAccordion,
  withNode,
)(SingleAccordionClean);

export default SingleAccordion;
export {
  SingleAccordionBase,
  SingleAccordion,
  SingleAccordionClean,
  TestableSingleAccordion,
  asSingleAccordion,
  asTestableSingleAccordion,
};
