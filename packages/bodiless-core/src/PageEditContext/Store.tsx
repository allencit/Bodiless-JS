/**
 * Copyright © 2019 Johnson & Johnson
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

import { action, computed, observable } from 'mobx';
import type { ObservableMap } from 'mobx';
import type {
  PageEditContextInterface,
  PageEditStoreInterface,
  TPageOverlayStore,
} from './types';
import type { TMenuOption } from '../Types/ContextMenuTypes';
import {
  getFromSessionStorage,
  saveToSessionStorage,
} from '../SessionStorage';
import type { TOverlaySettings } from '../Types/PageOverlayTypes';

/**
 * @private
 *
 * Utility to create a menu option with existing (but undefined) properties for all possible
 * keys.  This guarantees that adding or removing keys will be an obwervable event.
 *
 * @param option The original option
 * @returh The option with all keys present.
 */
const toObservableOption = (option: TMenuOption): TMenuOption => {
  // This guarantees that if we add a property to TMenuyOption we'll get a ts error here if
  // we don't provide a default "undefined" value for it.
  type AllUndefined<T> = {
    [K in keyof T]: undefined
  };
  type ObservableMenuOption = AllUndefined<Required<TMenuOption>>;
  const observableMenuOption: ObservableMenuOption = {
    name: undefined,
    icon: undefined,
    label: undefined,
    isActive: undefined,
    isDisabled: undefined,
    isHidden: undefined,
    handler: undefined,
    local: undefined,
    global: undefined,
    group: undefined,
    Component: undefined,
    context: undefined,
  };
  return ({
    ...observableMenuOption,
    ...option,
  });
};

/**
 * @private
 *
 * Creates a proxy for a menu option which ensures that keys with value of undefined
 * are not enumerated.
 *
 * Note - we do this as a proxy to avoid iterating the keys prematurely and thus notifying
 * observers when irrelevant prperties change.
 *
 * @param option The observable option (as created by toObservableOption).
 *
 * @return A proxy which ensures that "undrefined" properties will not be enumerated.
 */
const fromObservableOption = (option: TMenuOption): TMenuOption => new Proxy(
  option, {
    ownKeys: (target: any) => Object.getOwnPropertyNames(target)
      .filter(key => target[key] !== undefined),
  },
);

export const defaultOverlaySettings: TOverlaySettings = {
  isActive: false,
  hasCloseButton: false,
  hasSpinner: true,
  message: '',
  maxTimeoutInSeconds: null,
  onClose: () => {},
};

/**
 * @private
 *
 * Holds the current UI state for the editor.
 */
export class PageEditStore implements PageEditStoreInterface {
  @observable activeContext: PageEditContextInterface | undefined = undefined;

  @observable isEdit = getFromSessionStorage('isEdit', false);

  @observable isPositionToggled = getFromSessionStorage('isPositionToggled', false);

  @observable pageOverlay: TPageOverlayStore = {
    data: {
      ...defaultOverlaySettings,
    },
    timeoutId: 0,
  };

  @observable
  optionMap = new Map() as ObservableMap<string, ObservableMap<string, TMenuOption>>;

  @action reset() {
    this.activeContext = undefined;
    this.isEdit = false;
    this.isPositionToggled = false;
    this.optionMap.clear();
    this.pageOverlay = {
      data: {
        ...defaultOverlaySettings,
      },
      timeoutId: 0,
    };
  }

  constructor(activeContext?: PageEditContextInterface) {
    if (activeContext) {
      this.setActiveContext(activeContext);
    }
  }

  @action
  setActiveContext(context?: PageEditContextInterface) {
    if (context) this.activeContext = context;

    // Travel the context trail, updating options for each context.
    const keys: string[] = [];
    for (let c = this.activeContext; c; c = c.parent) {
      keys.push(...this.updateMenuOptions(c));
    }

    // Ensure order is correct and remove obsolete entries.
    const newTrail = new Map();
    keys.reverse().forEach(key => {
      newTrail.set(key, this.optionMap.get(key));
    });
    // Note: requires mobx >5.15.5 to set order correctly.
    // See https://github.com/mobxjs/mobx/issues/1980
    // And https://codesandbox.io/s/wizardly-resonance-u97jm?file=/src/index.js
    this.optionMap.replace(newTrail);
  }

  @action
  updateMenuOptions(context: PageEditContextInterface) {
    if (!this.optionMap.has(context.id)) {
      this.optionMap.set(context.id, observable.map({}));
    }
    const map = this.optionMap.get(context.id);
    const keys = new Set();
    [context, ...context.peerContexts].forEach(c => {
      // Update all items in the map
      c.getMenuOptions().forEach(op => {
        keys.add(op.name);
        const existing = map!.get(op.name);
        const next = toObservableOption(op);
        if (existing) {
          Object.assign(existing, next);
        } else {
          map!.set(op.name, next);
        }
      });
    });
    // Delete any items which are no longer present.
    map!.forEach(($, key) => {
      if (!keys.has(key)) map!.delete(key);
    });
    return [context.id];
  }

  @computed get contextMenuOptions(): TMenuOption[] {
    const options: TMenuOption[] = [];
    const contextIds = Array.from(this.optionMap.keys());
    contextIds.forEach(contextId => {
      const optionMap = this.optionMap.get(contextId);
      const nextOptions = Array.from(optionMap!.values()).map(fromObservableOption);
      options.push(...nextOptions);
    });
    return options;
  }

  @action toggleEdit(on? : boolean) {
    if (on === undefined) {
      this.isEdit = !this.isEdit;
    } else {
      this.isEdit = Boolean(on);
    }

    saveToSessionStorage('isEdit', this.isEdit);
  }

  @action togglePosition(on? : boolean) {
    if (on === undefined) {
      this.isPositionToggled = !this.isPositionToggled;
    } else {
      this.isPositionToggled = Boolean(on);
    }

    saveToSessionStorage('isPositionToggled', this.isPositionToggled);
  }

  @computed get contextTrail() {
    const trail: string[] = [];
    for (let c = this.activeContext; c?.parent; c = c.parent) {
      trail.push(c.id);
    }
    return trail;
  }

  @observable areLocalTooltipsDisabled = false;

  @action toggleLocalTooltipsDisabled(isDisabled?: boolean) {
    if (isDisabled === undefined) {
      this.areLocalTooltipsDisabled = !this.areLocalTooltipsDisabled;
    } else {
      this.areLocalTooltipsDisabled = isDisabled;
    }
  }
}

export const defaultStore = new PageEditStore();
